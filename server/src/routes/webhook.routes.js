import { Router } from "express";
import { Webhook } from "svix";
import Stripe from "stripe";
import { db } from "../config/database.js";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
    event = wh.verify(JSON.stringify(req.body), svixHeaders);
  } catch (err) {
    console.error("Webhook verification failed:", err.message);
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  const { type, data } = event;

  try {
    switch (type) {
      case "user.created": {
        const email = data.email_addresses?.[0]?.email_address || "";
        const name = [data.first_name, data.last_name]
          .filter(Boolean)
          .join(" ");

        await db.query(
          `INSERT INTO users (clerk_id, email, name)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (clerk_id) DO UPDATE SET email = $2, name = $3`,
          [data.id, email, name],
        );
        console.log("User created:", email);
        break;
      }

      case "user.deleted": {
        await db.query("DELETE FROM users WHERE clerk_id = $1", [data.id]);
        console.log("User deleted:", data.id);
        break;
      }
    }
  } catch (error) {
    console.error("Webhook handler error:", error.message);
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
                    SET plan = "pro",
                        stripe_customer_id = $1,
                        stripe_subscription_id = $2
                        updated_at = NOW()
                    WHERE id = $3`,
          [customerId, subscriptionId, userId],
        );
        console.log("User upgraded to Pro", userId);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        if (
          subscription.status === "active" &&
          subscription.status !== "trailing"
        ) {
          await db.query(
            `UPDATE users 
                        SET plan = "free",
                            updated_at = NOW()
                        WHERE stripe_subscription_id = $1`,
            [subscription.id],
          );
          break;
        }
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await db.query(
          `UPDATE users
                        SET plan = "free",
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
    console.error("Stripe webhook error:", error.message);
  }

  res.json({ received: true });
});

export default router;
