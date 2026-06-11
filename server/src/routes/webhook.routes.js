import { Router } from "express";
import { Webhook } from "svix";
import { db } from "../config/database.js";
import { stripe, isAlreadyCanceled } from "../config/stripe.js";

const router = Router();

// Clerk events list every address on the account; resolve the primary one.
function primaryEmail(data) {
  const list = data.email_addresses || [];
  const primary = list.find((e) => e.id === data.primary_email_address_id);
  return (primary || list[0])?.email_address || "";
}

function fullName(data) {
  return [data.first_name, data.last_name].filter(Boolean).join(" ");
}

router.post("/clerk", async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET environment variable");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const svixHeaders = {
    "svix-id": req.header("svix-id"),
    "svix-timestamp": req.header("svix-timestamp"),
    "svix-signature": req.header("svix-signature"),
  };

  let event;
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    event = wh.verify(req.body, svixHeaders);
  } catch (err) {
    console.error("Webhook verification failed:", err.message);
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  const { type, data } = event;

  try {
    switch (type) {
      case "user.created":
      case "user.updated": {
        // Same upsert for both: created inserts the row, updated keeps the
        // local email/name in sync when they change in Clerk.
        await db.query(
          `INSERT INTO users (clerk_id, email, name)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (clerk_id) DO UPDATE SET email = $2, name = $3`,
          [data.id, primaryEmail(data), fullName(data)],
        );
        console.log(`Webhook ${type}:`, data.id);
        break;
      }

      case "user.deleted": {
        // Cancel any live subscription before the row (and with it the
        // subscription id) disappears — otherwise a user deleted from the
        // Clerk dashboard keeps getting billed with no record of why.
        // Throwing here returns a 500 so Clerk retries the event.
        const existing = await db.query(
          "SELECT stripe_subscription_id FROM users WHERE clerk_id = $1",
          [data.id],
        );
        const subscriptionId = existing.rows[0]?.stripe_subscription_id;
        if (subscriptionId) {
          try {
            await stripe.subscriptions.cancel(subscriptionId);
          } catch (err) {
            if (!isAlreadyCanceled(err)) throw err;
          }
        }
        await db.query("DELETE FROM users WHERE clerk_id = $1", [data.id]);
        console.log("User deleted:", data.id);
        break;
      }
    }
  } catch (error) {
    // Return a non-2xx so Clerk retries instead of dropping the event.
    console.error("Webhook handler error:", error.message);
    return res.status(500).json({ error: "Webhook handler failed" });
  }

  res.json({ received: true });
});

router.post("/stripe", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook verification failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        await db.query(
          `UPDATE users
                    SET plan = 'pro',
                        stripe_customer_id = $1,
                        stripe_subscription_id = $2,
                        updated_at = NOW()
                    WHERE id = $3`,
          [customerId, subscriptionId, userId],
        );
        console.log("User upgraded to Pro", userId);
        break;
      }

      case "customer.subscription.updated": {
        // Mirror the subscription status both ways: downgrade on past_due /
        // unpaid / canceled, but also restore 'pro' when a lapsed payment
        // recovers and the subscription returns to active.
        const subscription = event.data.object;
        const isActive = ["active", "trialing"].includes(subscription.status);
        await db.query(
          `UPDATE users
                      SET plan = $1,
                          updated_at = NOW()
                      WHERE stripe_subscription_id = $2`,
          [isActive ? "pro" : "free", subscription.id],
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await db.query(
          `UPDATE users
                        SET plan = 'free',
                        stripe_subscription_id = NULL,
                        updated_at = NOW()
                        WHERE stripe_subscription_id = $1`,
          [subscription.id],
        );
        console.log("Subscription cancelled", subscription.id);
        break;
      }
    }
  } catch (error) {
    // Return a non-2xx so Stripe retries — critical for checkout.session.completed,
    // where a dropped event would leave a paying customer un-upgraded.
    console.error("Stripe webhook error:", error.message);
    return res.status(500).json({ error: "Webhook handler failed" });
  }

  res.json({ received: true });
});

export default router;
