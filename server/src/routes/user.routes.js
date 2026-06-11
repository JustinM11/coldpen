import { Router } from "express";
import { clerkClient } from "@clerk/express";
import { protect } from "../middleware/auth.js";
import { limitForPlan } from "../config/plans.js";
import { EmailModel } from "../models/email.model.js";
import { db } from "../config/database.js";
import { stripe, isAlreadyCanceled } from "../config/stripe.js";

const router = Router();

// The pg driver parses a DATE column into a JS Date at *local* midnight, so
// toISOString() shifts it a day on any server running ahead of UTC. Format
// from local components instead to recover the stored calendar date exactly.
function dateColumnToString(d) {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

router.get("/me", ...protect, async (req, res, next) => {
  try {
    const user = req.user;
    // The rate limiter stamps last_generation_date with the UTC date, so
    // compare against UTC "today" — the two must use the same clock.
    const today = new Date().toISOString().split("T")[0];
    const lastDate = dateColumnToString(user.last_generation_date);

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

// Full account data export — every brief with all variations, as JSON.
router.get("/export", ...protect, async (req, res, next) => {
  try {
    const emails = await EmailModel.findAllByUser(req.user.id);
    res.json({
      exportedAt: new Date().toISOString(),
      user: {
        email: req.user.email,
        name: req.user.name,
        plan: req.user.plan,
        createdAt: req.user.created_at,
      },
      emails,
    });
  } catch (error) {
    next(error);
  }
});

// Permanently delete the account. Order matters:
// 1. Cancel any live Stripe subscription FIRST — once the DB row is gone the
//    subscription id is unrecoverable and the deleted user would keep getting
//    billed. A failure here (other than "already canceled") aborts the whole
//    deletion so the account is never orphaned from its billing.
// 2. Remove the Clerk user (kills all sessions).
// 3. Remove the DB row (cascades to emails). The user.deleted webhook also
//    deletes the row, so the direct delete just makes the result immediate.
router.delete("/me", ...protect, async (req, res, next) => {
  try {
    if (req.user.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(req.user.stripe_subscription_id);
      } catch (err) {
        if (!isAlreadyCanceled(err)) throw err;
      }
    }
    await clerkClient.users.deleteUser(req.user.clerk_id);
    await db.query("DELETE FROM users WHERE id = $1", [req.user.id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
