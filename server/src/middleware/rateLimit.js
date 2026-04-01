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

    const lastDate = user.last_generation_date
      ? user.last_generation_date.toISOString().split("T")[0]
      : null;

    if (lastDate !== today) {
      await db.query(
        `UPDATE users
                SET generations_today = 0, last_generation_date =  $1
                WHERE id = $2`,
        [today, user.id],
      );
      user.generations_today = 0;
    }

    if (user.generations_today >= limit) {
      return res.status(429).json({
        error: "Daily generation limit reached",
        limit,
        plan: user.plan,
        upgrade_url: user.plan === "free" ? "/pricing" : null,
      });
    }

    await db.query(
      `UPDATE users
            SET generations_today = generations_today + 1,
            last_generation_date = $1,
            updated_at = NOW()
            WHERE id = $2`,
      [today, user.id],
    );

    req.rateLimitInfo = {
      remaining: limit - user.generations_today - 1,
      limit,
      plan: user.plan,
    };

    next();
  } catch (error) {
    next(error);
  }
};
