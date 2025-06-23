import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {createClient} from "@supabase/supabase-js";
import {Request, Response} from "firebase-functions/v1";

admin.initializeApp();

// Environment variables for configuration (using process.env directly)

// Initialize Supabase client lazily
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Supabase configuration not found. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.");
    }
    
    supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  }
  return supabase;
}

function getFirebaseApiKey(): string {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Google API key not found. Please set GOOGLE_API_KEY environment variable.");
  }
  return apiKey;
}

interface AuthRequest {
    email: string;
    password: string;
    name?: string;
}

/**
 * Creates a new user in the database
 * @param {string} firebaseId - The Firebase user ID
 * @param {string} email - The user's email address
 * @param {string} [name] - The user's name (optional)
 * @return {Promise<object>} The created user data
 */
async function createUserInDB(
  firebaseId: string,
  email: string,
  name?: string
) {
  try {
    console.log("Creating user in Supabase DB:");
    console.log("- Firebase ID:", firebaseId);
    console.log("- Email:", email);
    console.log("- Name:", name);
    console.log("- Supabase URL:", process.env.SUPABASE_URL);
    console.log("- URL length:", process.env.SUPABASE_URL?.length);
    console.log("- Key length:", process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
    
    // Test basic connectivity first
    console.log("Testing Supabase connectivity...");
    try {
      const testResponse = await fetch(process.env.SUPABASE_URL + '/rest/v1/', {
        method: 'GET',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        }
      });
      console.log("Connectivity test status:", testResponse.status);
      console.log("Connectivity test headers:", Object.fromEntries(testResponse.headers.entries()));
    } catch (connError) {
      console.error("Connectivity test failed:", connError);
    }
    
    const supabase = getSupabaseClient();
    console.log("Supabase client created successfully");
    
    const {data, error} = await supabase
      .from("users")
      .insert([
        {
          firebase_id: firebaseId,
          email: email,
          name: name,
        },
      ])
      .select("id, name, email")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }
    
    console.log("Supabase insert successful:", data);
    return data;
  } catch (error) {
    console.error("=== SUPABASE ERROR ===");
    console.error("Error:", error);
    console.error("Error type:", typeof error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    console.error("====================");
    throw error;
  }
}

/**
 * Deletes a user from the database
 * @param {string} firebaseId - The Firebase user ID
 */
async function deleteUserFromDB(firebaseId: string) {
  const {error} = await getSupabaseClient()
    .from("users")
    .delete()
    .eq("firebase_id", firebaseId);

  if (error) throw error;
}

/**
 * Handles user login
 * @param {functions.https.Request} req - The request object
 * @param {Response} res - The response object
 */
async function handleLogin(req: Request, res: Response) {
  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  const {email, password} = req.body as AuthRequest;

  if (!email || !password) {
    res.status(400).json({error: "Email and password are required"});
    return;
  }

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${getFirebaseApiKey()}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error.message);
    }

    const {data: dbUser, error: dbError} = await getSupabaseClient()
      .from("users")
      .select("id, name, email")
      .eq("firebase_id", data.localId)
      .single();

    if (dbError) throw dbError;

    res.json({
      data: {
        firebaseToken: data.idToken,
        user: {
          uid: data.localId,
          email: data.email,
          id: dbUser.id,
          name: dbUser.name,
        },
      },
    });
  } catch (error: unknown) {
    res.status(401).json({
      error: "Authentication failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Handles user registration
 * Creates both Firebase user and Supabase database record
 * @param {functions.https.Request} req - The request object
 * @param {Response} res - The response object
 */
async function handleRegister(req: Request, res: Response) {
  console.log("=== REGISTRATION REQUEST ===");
  console.log("Method:", req.method);
  console.log("Body keys:", Object.keys(req.body || {}));
  console.log("Environment check:");
  console.log("- SUPABASE_URL exists:", !!process.env.SUPABASE_URL);
  console.log("- SUPABASE_SERVICE_ROLE_KEY exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log("- GOOGLE_API_KEY exists:", !!process.env.GOOGLE_API_KEY);
  console.log("===========================");

  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  const {email, password, name} = req.body as AuthRequest;

  if (!email || !password || !name) {
    console.error("Missing required fields:", {email: !!email, password: !!password, name: !!name});
    res.status(400).json({error: "Email, password, and name are required"});
    return;
  }

  let firebaseUser: admin.auth.UserRecord | null = null;

  try {
    console.log("Step 1: Creating Firebase user for email:", email);
    // Create user in Firebase
    firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });
    console.log("Step 1 SUCCESS: Firebase user created with UID:", firebaseUser.uid);

    console.log("Step 2: Creating Supabase database record");
    // Create user in Supabase database
    const dbUser = await createUserInDB(firebaseUser.uid, email, name);
    console.log("Step 2 SUCCESS: Supabase user created with ID:", dbUser.id);

    console.log("Step 3: Generating custom token");
    // Generate custom token for immediate sign-in
    const customToken = await admin.auth().createCustomToken(firebaseUser.uid);
    console.log("Step 3 SUCCESS: Custom token generated");

    res.json({
      success: true,
      message: "User registered successfully",
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        featureLevel: "registered", // Default level for new users
      },
      customToken, // Client can use this to sign in immediately
    });
  } catch (error: unknown) {
    // Cleanup: if Firebase user was created but Supabase failed, delete Firebase user
    if (firebaseUser) {
      try {
        await admin.auth().deleteUser(firebaseUser.uid);
        console.log("Cleaned up Firebase user after error");
      } catch (cleanupError) {
        console.error("Failed to cleanup Firebase user:", cleanupError);
      }
    }
    
    // Enhanced error logging
    console.error("=== REGISTRATION ERROR ===");
    console.error("Error type:", typeof error);
    console.error("Error details:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    console.error("========================");
    
    res.status(500).json({
      error: "Failed to create user",
      message: error instanceof Error ? error.message : `Unknown error: ${JSON.stringify(error)}`,
      details: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
}

/**
 * Handles user retrieval and deletion
 * @param {functions.https.Request} req - The request object
 * @param {Response} res - The response object
 */
async function handleUser(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({error: "No valid authorization header"});
    return;
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    if (req.method === "GET") {
      const {data: dbUser, error} = await getSupabaseClient()
        .from("users")
        .select("id, name, email")
        .eq("firebase_id", decodedToken.uid)
        .single();

      if (error) throw error;

      const firebaseUser = await admin.auth().getUser(decodedToken.uid);

      res.json({
        data: {
          user: firebaseUser,
          dbUser: dbUser,
        },
      });
    } else if (req.method === "DELETE") {
      await deleteUserFromDB(decodedToken.uid);
      await admin.auth().deleteUser(decodedToken.uid);
      res.json({message: "User successfully deleted"});
    } else {
      res.status(405).json({error: "Method not allowed"});
    }
  } catch (error: unknown) {
    res.status(401).json({
      error: req.method === "DELETE" ?
        "Failed to delete user" :
        "Failed to get user details",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Main auth function that routes to the appropriate handler
export const auth = functions.https.onRequest((req: Request, res: Response) => {
  // Enable CORS for all routes
  res.set("Access-Control-Allow-Origin", "*");
  res.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  res.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");

  // Handle OPTIONS requests
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  // Route to appropriate handler based on path
  const path = req.path.split("/").filter(Boolean);

  switch (path[0]) {
  case "login":
    handleLogin(req, res);
    return;
  case "register":
    handleRegister(req, res);
    return;
  case "user":
    handleUser(req, res);
    return;
  default:
    res.status(404).json({error: "Not found"});
    return;
  }
});
