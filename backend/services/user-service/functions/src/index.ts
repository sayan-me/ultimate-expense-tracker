import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { createClient } from '@supabase/supabase-js';

admin.initializeApp();

// Initialize Supabase client
const supabase = createClient(
    functions.config().supabase.url,
    functions.config().supabase.service_key
);

interface AuthRequest {
    email: string;
    password: string;
    name?: string;  // Added for signup
}

export const handleSignup = functions.https.onRequest(async (req, res) => {
    // ... existing CORS and method checks ...

    const { email, password, name } = req.body as AuthRequest;

    if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
    }

    try {
        // 1. Create Firebase auth user
        const firebaseUser = await admin.auth().createUser({
            email,
            password,
        });

        // 2. Create user record in Supabase
        const { data: dbUser, error: dbError } = await supabase
            .from('users')
            .insert([
                {
                    id: firebaseUser.uid,  // Use Firebase UID as Supabase user ID
                    name: name || null,
                    email: email,
                }
            ])
            .select()
            .single();

        if (dbError) throw dbError;

        res.json({
            data: {
                user: firebaseUser,
                profile: dbUser
            }
        });
    } catch (error: any) {
        console.error('Signup error:', error);

        // If user was created in Firebase but Supabase failed, clean up
        if (error.code === 'SUPABASE_ERROR' && error.firebaseUid) {
            await admin.auth().deleteUser(error.firebaseUid);
        }

        res.status(500).json({
            error: "Failed to create user",
            message: error.message,
        });
    }
});

export const handleGetUser = functions.https.onRequest(async (req, res) => {
    // ... existing CORS and method checks ...

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "No valid authorization header" });
        return;
    }

    const token = authHeader.split("Bearer ")[1];

    try {
        // 1. Verify Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token);
        const firebaseUser = await admin.auth().getUser(decodedToken.uid);

        // 2. Get user data from Supabase
        const { data: dbUser, error: dbError } = await supabase
            .from('users')
            .select('*')
            .eq('id', decodedToken.uid)
            .single();

        if (dbError) throw dbError;

        res.json({
            user: {
                ...firebaseUser,
                profile: dbUser
            }
        });
    } catch (error) {
        res.status(401).json({
            error: "Invalid token",
            message: (error as Error).message,
        });
    }
});

export const handleDeleteUser = functions.https.onRequest(async (req, res) => {
    // ... existing CORS and method checks ...

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "No valid authorization header" });
        return;
    }

    const token = authHeader.split("Bearer ")[1];

    try {
        // 1. Verify the token and get the user ID
        const decodedToken = await admin.auth().verifyIdToken(token);

        // 2. Delete user from Supabase
        const { error: dbError } = await supabase
            .from('users')
            .delete()
            .eq('id', decodedToken.uid);

        if (dbError) throw dbError;

        // 3. Delete the Firebase user
        await admin.auth().deleteUser(decodedToken.uid);

        res.json({ message: "User successfully deleted" });
    } catch (error: any) {
        res.status(401).json({
            error: "Failed to delete user",
            message: error.message
        });
    }
});