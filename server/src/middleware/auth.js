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
         ON CONFLICT (clerk_id) DO UPDATE SET email = $2
         RETURNING *`,
        [
          clerkId,
          authData?.sessionClaims?.email || "",
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
