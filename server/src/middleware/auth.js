import { requireAuth } from "@clerk/express";
import { db } from "../config/database.js";

export const attachUser = async (req, res, next) => {
  try {
    const authData = req.auth();
    const clerkId = authData?.userId;

    if (!clerkId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const result = await db.query("SELECT * FROM users WHERE clerk_id = $1", [
      clerkId,
    ]);

    if (result.rows.length === 0) {
      const newUser = await db.query(
        `INSERT INTO users (clerk_id, email, name)
         VALUES ($1, $2, $3)
         ON CONFLICT (clerk_id) DO UPDATE SET email = COALESCE(EXCLUDED.email, users.email), name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name)
         RETURNING *`,
        [
          clerkId,
          authData?.sessionClaims?.email || null,
          authData?.sessionClaims?.name || "",
        ],
      );
      req.user = newUser.rows[0];
    } else {
      req.user = result.rows[0];
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    next(error);
  }
};

export const protect = [requireAuth(), attachUser];
