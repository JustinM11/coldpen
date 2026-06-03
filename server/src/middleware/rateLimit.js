import { db } from "../config/database.js";

const PLAN_LIMITS = {
  free: 5,
  pro: 1000,
};

export const rateLimitByPlan = async (req, res, next) => {
  try {
    const user = req.user;
    const limit = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;
    const today = new Date().toISOString().split("T")[0];

    // Atomic check-and-increment: the WHERE clause only matches when the user
    // is either on a new day (counter resets to 1) or still under the limit.
    // No rows returned means the daily limit was already reached.
    const result = await db.query(
      `UPDATE users
       SET
         generations_today = CASE
           WHEN last_generation_date IS DISTINCT FROM $1::date THEN 1
           ELSE generations_today + 1
         END,
         last_generation_date = $1::date,
         updated_at = NOW()
       WHERE id = $2
         AND (last_generation_date IS DISTINCT FROM $1::date OR generations_today < $3)
       RETURNING generations_today`,
      [today, user.id, limit],
    );

    if (result.rows.length === 0) {
      return res.status(429).json({
        error: "Daily generation limit reached",
        limit,
        plan: user.plan,
        upgrade_url: user.plan === "free" ? "/pricing" : null,
      });
    }

    req.rateLimitInfo = {
      remaining: limit - result.rows[0].generations_today,
      limit,
      plan: user.plan,
      date: today,
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Give back a generation that was counted by rateLimitByPlan but never
// produced a result (validation failure, AI error, save failure, etc).
// Guarded on the date so a refund issued just after midnight can't wipe a
// fresh day's count, and clamped at 0 so it can never go negative.
export const refundGeneration = async (userId, date) => {
  await db.query(
    `UPDATE users
       SET generations_today = GREATEST(generations_today - 1, 0),
           updated_at = NOW()
     WHERE id = $1 AND last_generation_date = $2::date`,
    [userId, date],
  );
};
