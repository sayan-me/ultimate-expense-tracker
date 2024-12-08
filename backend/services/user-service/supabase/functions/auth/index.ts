import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4/dist/module/index.js";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

// Add type for request body
interface AuthRequest {
  email?: string;
  password?: string;
}

serve(async (req: Request) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
  };

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // Verify Supabase client is properly initialized
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase credentials");
    }

    switch (req.method) {
      case "POST": {
        const body = await req.json() as AuthRequest;

        // Debug log to see what path is being received
        console.log("Received path:", path);

        // Remove both leading slash and 'auth/' from the path
        const cleanPath = path.replace(/^\/+/, "").replace(/^auth\//, "");
        console.log("Clean path for matching:", cleanPath);

        // Validate required fields
        if (cleanPath !== "signout" && (!body.email || !body.password)) {
          return new Response(
            JSON.stringify({ error: "Email and password are required" }),
            { status: 400, headers },
          );
        }

        switch (cleanPath) {
          case "signup": {
            const { email, password } = body;
            if (!email || !password) {
              throw new Error("Email and password are required");
            }
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
            });
            if (error) throw error;
            return new Response(JSON.stringify({ data }), { headers });
          }

          case "signin": {
            console.log("Matched signin case");
            const { email, password } = body;
            if (!email || !password) {
              throw new Error("Email and password are required");
            }
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            if (error) throw error;
            return new Response(JSON.stringify({ data }), { headers });
          }

          case "signout": {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return new Response(
              JSON.stringify({ message: "Signed out successfully" }),
              { headers },
            );
          }
        }
        break; // Add break statement
      }

      case "GET": {
        console.log("GET request path:", path);
        const cleanPath = path.replace(/^\/+/, "").replace(/^auth\//, "");

        if (cleanPath === "user") {
          // Get the Authorization header
          const authHeader = req.headers.get("Authorization");
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: "No authorization header" }),
              { status: 401, headers },
            );
          }

          // Extract the token
          const token = authHeader.replace("Bearer ", "");
          if (!token) {
            return new Response(
              JSON.stringify({ error: "No token provided" }),
              { status: 401, headers },
            );
          }

          try {
            // Get user with the token
            const { data: { user }, error } = await supabase.auth.getUser(
              token,
            );
            if (error) throw error;

            return new Response(
              JSON.stringify({ user }),
              { headers },
            );
          } catch (error) {
            console.error("Error getting user:", error);
            return new Response(
              JSON.stringify({
                error: "Invalid token",
                details: error instanceof Error
                  ? error.message
                  : "Unknown error",
              }),
              { status: 401, headers },
            );
          }
        }
        break;
      }

      default: {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers },
        );
      }
    }

    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers,
    });
  } catch (error) {
    console.error("Auth function error:", error); // Add logging
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers },
    );
  }
});
