import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

interface AuthRequest {
    email: string;
    password: string;
}

interface SignInResponse {
    token: string;
    user: admin.auth.UserRecord;
}

export const handleSignup = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const { email, password } = req.body as AuthRequest;

    if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
    }

    try {
        const user = await admin.auth().createUser({
            email,
            password,
        });
        res.json({ data: { user } });
    } catch (error: any) {
        res.status(500).json({
            error: "Failed to create user",
            message: error.message,
        });
    }
});

export const handleGetUser = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "No valid authorization header" });
        return;
    }

    const token = authHeader.split("Bearer ")[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const user = await admin.auth().getUser(decodedToken.uid);
        res.json({ user });
    } catch (error) {
        res.status(401).json({
            error: "Invalid token",
            message: (error as Error).message,
        });
    }
});

export const handleSignIn = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const { email, password } = req.body as AuthRequest;

    if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
    }

    try {
        // Sign in with email and password using Firebase Auth REST API
        const signInResponse = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${functions.config().app.api_key}`,
            {
                method: 'POST',
                body: JSON.stringify({
                    email,
                    password,
                    returnSecureToken: true
                })
            }
        );

        const data = await signInResponse.json();

        if (!signInResponse.ok) {
            throw new Error(data.error.message);
        }

        // Get user details
        const user = await admin.auth().getUserByEmail(email);

        res.json({
            data: {
                token: data.idToken,
                user
            } as SignInResponse
        });
    } catch (error: any) {
        res.status(401).json({
            error: "Authentication failed",
            message: error.message
        });
    }
});

export const handleDeleteUser = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    if (req.method !== "DELETE") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "No valid authorization header" });
        return;
    }

    const token = authHeader.split("Bearer ")[1];

    try {
        // Verify the token and get the user ID
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Delete the user
        await admin.auth().deleteUser(decodedToken.uid);

        res.json({ message: "User successfully deleted" });
    } catch (error: any) {
        res.status(401).json({
            error: "Failed to delete user",
            message: error.message
        });
    }
});
