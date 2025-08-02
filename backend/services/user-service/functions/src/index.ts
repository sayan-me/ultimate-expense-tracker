import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {createClient} from "@supabase/supabase-js";
import {Request, Response} from "firebase-functions/v1";

admin.initializeApp({
  serviceAccountId: process.env.FIREBASE_SERVICE_ACCOUNT_ID || 'uet-stg@appspot.gserviceaccount.com'
});

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

interface UpdateUserRequest {
    name?: string;
    email?: string;
}

interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
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
      // Handle duplicate email error
      if (error.code === '23505' && error.message.includes('users_email_unique')) {
        throw new Error('Email already registered');
      }
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
 * Records login history asynchronously (non-blocking)
 * @param {number} userId - The user's database ID
 * @param {string} firebaseId - The Firebase user ID
 * @param {Request} req - The request object for extracting IP and user agent
 * @param {boolean} success - Whether the login was successful
 */
async function recordLoginHistory(
  userId: number,
  firebaseId: string,
  req: Request,
  success: boolean = true
) {
  try {
    const clientIp = req.headers['x-forwarded-for'] as string || 
                     req.headers['x-real-ip'] as string ||
                     req.connection?.remoteAddress ||
                     req.socket?.remoteAddress ||
                     'unknown';
    
    const userAgent = req.headers['user-agent'] || 'unknown';

    await getSupabaseClient()
      .from("login_history")
      .insert([{
        user_id: userId,
        firebase_id: firebaseId,
        ip_address: clientIp,
        user_agent: userAgent,
        success: success,
        login_method: 'password'
      }]);
  } catch (error) {
    // Log the error but don't throw - this should not block login
    console.error("Failed to record login history:", error);
  }
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

    // Record login history asynchronously (non-blocking)
    recordLoginHistory(Number(dbUser.id), data.localId, req, true).catch(err => {
      console.error("Login history recording failed:", err);
    });

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

    console.log("Step 3: Authenticating with REST API to get ID token");
    // Use Firebase REST API to sign in and get ID token (no IAM permissions needed)
    const signInResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${getFirebaseApiKey()}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
          returnSecureToken: true,
        }),
      }
    );

    const signInData = await signInResponse.json();
    if (!signInResponse.ok) {
      throw new Error(`Failed to authenticate new user: ${signInData.error.message}`);
    }
    
    console.log("Step 3 SUCCESS: ID token generated via REST API");
    
    res.json({
      success: true,
      message: "User registered successfully",
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        featureLevel: "registered", // Default level for new users
        uid: firebaseUser.uid,
      },
      firebaseToken: signInData.idToken,
      refreshToken: signInData.refreshToken,
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
 * Updates user profile in both Firebase and Supabase
 * @param {string} firebaseId - The Firebase user ID
 * @param {string} [name] - The user's name
 * @param {string} [email] - The user's email
 * @return {Promise<object>} The updated user data
 */
async function updateUserInDB(
  firebaseId: string,
  name?: string,
  email?: string
) {
  try {
    functions.logger.info("Updating user in both Firebase and Supabase", { firebaseId, name, email });

    // Step 1: Update Firebase user first
    const updateData: any = {};
    if (name) updateData.displayName = name;
    if (email) updateData.email = email;
    
    if (Object.keys(updateData).length > 0) {
      await admin.auth().updateUser(firebaseId, updateData);
      console.log("Firebase user updated successfully");
    }

    // Step 2: Update Supabase user
    const supabaseUpdateData: any = {};
    if (name) supabaseUpdateData.name = name;
    if (email) supabaseUpdateData.email = email;
    
    if (Object.keys(supabaseUpdateData).length > 0) {
      const {data, error} = await getSupabaseClient()
        .from("users")
        .update(supabaseUpdateData)
        .eq("firebase_id", firebaseId)
        .select("id, name, email")
        .single();

      if (error) {
        console.error("Supabase update error:", error);
        // If Supabase update fails, try to rollback Firebase changes
        if (email) {
          try {
            // Get the original user data to rollback
            const originalUser = await admin.auth().getUser(firebaseId);
            await admin.auth().updateUser(firebaseId, { email: originalUser.email });
            console.log("Rolled back Firebase email change");
          } catch (rollbackError) {
            console.error("Failed to rollback Firebase changes:", rollbackError);
          }
        }
        throw error;
      }

      console.log("Supabase user updated successfully:", data);
      return data;
    }

    // If no updates to Supabase, return current user data
    const {data, error} = await getSupabaseClient()
      .from("users")
      .select("id, name, email")
      .eq("firebase_id", firebaseId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("=== UPDATE USER ERROR ===");
    console.error("Error:", error);
    console.error("=========================");
    throw error;
  }
}

/**
 * Handles user retrieval, update, and deletion
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
    } else if (req.method === "PUT") {
      const {name, email} = req.body as UpdateUserRequest;

      if (!name && !email) {
        res.status(400).json({error: "At least one field (name or email) is required"});
        return;
      }

      const updatedUser = await updateUserInDB(decodedToken.uid, name, email);
      
      res.json({
        success: true,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          uid: decodedToken.uid,
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
        req.method === "PUT" ?
        "Failed to update user" :
        "Failed to get user details",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Handles password change
 * @param {functions.https.Request} req - The request object
 * @param {Response} res - The response object
 */
async function handleChangePassword(req: Request, res: Response) {
  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({error: "No valid authorization header"});
    return;
  }

  const token = authHeader.split("Bearer ")[1];
  const {currentPassword, newPassword} = req.body as ChangePasswordRequest;

  if (!currentPassword || !newPassword) {
    res.status(400).json({error: "Current password and new password are required"});
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({error: "New password must be at least 6 characters long"});
    return;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get user's email to verify current password
    const firebaseUser = await admin.auth().getUser(decodedToken.uid);
    if (!firebaseUser.email) {
      res.status(400).json({error: "User email not found"});
      return;
    }

    // Verify current password by attempting to sign in
    const verifyResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${getFirebaseApiKey()}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: firebaseUser.email,
          password: currentPassword,
          returnSecureToken: true,
        }),
      }
    );

    if (!verifyResponse.ok) {
      res.status(400).json({error: "Current password is incorrect"});
      return;
    }

    // Update password using Firebase Admin SDK
    await admin.auth().updateUser(decodedToken.uid, {
      password: newPassword,
    });

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error: unknown) {
    console.error("Password change error:", error);
    res.status(500).json({
      error: "Failed to change password",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Handles login history retrieval
 * @param {functions.https.Request} req - The request object
 * @param {Response} res - The response object
 */
async function handleLoginHistory(req: Request, res: Response) {
  if (req.method !== "GET") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({error: "No valid authorization header"});
    return;
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Get user's database ID
    const {data: dbUser, error: userError} = await getSupabaseClient()
      .from("users")
      .select("id")
      .eq("firebase_id", decodedToken.uid)
      .single();

    if (userError) throw userError;

    // Parse pagination parameters
    const limit = parseInt((req.query.limit as string) || "20");
    const offset = parseInt((req.query.offset as string) || "0");

    // Fetch login history with pagination
    const {data: history, error: historyError, count} = await getSupabaseClient()
      .from("login_history")
      .select("id, login_timestamp, ip_address, user_agent, login_method, success", { count: 'exact' })
      .eq("user_id", Number(dbUser.id))
      .order("login_timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    if (historyError) throw historyError;

    res.json({
      success: true,
      history: history || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error: unknown) {
    console.error("Login history error:", error);
    res.status(500).json({
      error: "Failed to retrieve login history",
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
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

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
  case "change-password":
    handleChangePassword(req, res);
    return;
  case "login-history":
    handleLoginHistory(req, res);
    return;
  default:
    res.status(404).json({error: "Not found"});
    return;
  }
});
