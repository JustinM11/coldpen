import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { limitForPlan } from "../config/plans.js";

const router = Router();

router.get("/me", ...protect, async (req, res, next) => {
  try {
    const user = req.user;
    const today = new Date().toISOString().split("T")[0];
    const lastDate = user.last_generation_date
      ? user.last_generation_date.toISOString().split("T")[0]
      : null;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        generationToday: lastDate !== today ? 0 : user.generations_today,
        generationLimit: limitForPlan(user.plan),
        stripeCustomerId: user.stripe_customer_id,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
