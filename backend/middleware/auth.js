import supabase from "../config/supabase.js";

export const requireSupabaseAuth = async (req, res, next) => {
  try {
    // 1. Grab the Authorization header from the request
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Missing or malformed token" });
    }

    // 2. Extract the actual JWT token string
    const token = authHeader.split(" ")[1];

    // 3. Ask Supabase to verify this token and retrieve the corresponding user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Invalid or expired token" });
    }

    // 4. Attach the authenticated user object (which contains the UUID id) to the request
    req.user = user;

    // 5. Pass control to your route controller
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    return res
      .status(500)
      .json({ error: "Internal Server Error during authentication" });
  }
};
