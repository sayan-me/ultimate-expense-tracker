import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {createClient} from "@supabase/supabase-js";
import {Response} from "express";

admin.initializeApp();

interface Config {
    supabase: {
        url: string,
        service_role_key: string,
    },
    app: {
        api_key: string,
    },
}

// Initialize Supabase client lazily
let supabase: ReturnType<typeof createClient> | null = null;

/**
 * Gets or creates a Supabase client instance
 * @return {object} Supabase client instance
 */
function getSupabaseClient() {
  if (!supabase) {
    const config = functions.config() as Config;
    
    // Check if config is properly loaded
    if (!config.supabase?.url || !config.supabase?.service_role_key) {
      throw new Error("Supabase configuration not found. Please set up Firebase config.");
    }
    
    supabase = createClient(
      config.supabase.url,
      config.supabase.service_role_key
    );
  }
  return supabase;
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
  const {data, error} = await getSupabaseClient()
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

  if (error) throw error;
  return data;
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
async function handleLogin(req: functions.https.Request, res: Response) {
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
    const config = functions.config() as Config;
    
    // Check if API key is available
    if (!config.app?.api_key) {
      throw new Error("Firebase API key not configured");
    }
    
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${
        config.app.api_key
      }`,
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
 * @param {functions.https.Request} req - The request object
 * @param {Response} res - The response object
 */
async function handleRegister(req: functions.https.Request, res: Response) {
  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  const {email, password, name} = req.body as AuthRequest;

  if (!email || !password) {
    res.status(400).json({error: "Email and password are required"});
    return;
  }

  let firebaseUser: admin.auth.UserRecord | null = null;

  try {
    firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    const dbUser = await createUserInDB(firebaseUser.uid, email, name);

    res.json({
      data: {
        user: firebaseUser,
        dbUser: {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
        },
      },
    });
  } catch (error: unknown) {
    if (firebaseUser) {
      await admin.auth().deleteUser(firebaseUser.uid);
    }
    res.status(500).json({
      error: "Failed to create user",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Handles user retrieval and deletion
 * @param {functions.https.Request} req - The request object
 * @param {Response} res - The response object
 */
async function handleUser(req: functions.https.Request, res: Response) {
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

// Simple health check function
export const health = functions.https.onRequest((req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "User service is running"
  });
});

// Main auth function that routes to the appropriate handler
export const auth = functions.https.onRequest((req, res) => {
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
