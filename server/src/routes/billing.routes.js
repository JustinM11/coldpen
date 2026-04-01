import { Router } from "express";
import Stripe from "stripe";
import { protect } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", ...protect, async (req, res, next) => {
  try {
    if (req.user.plan === "pro") {
      throw new AppError("You are already on the Pro plan", 400, "ALREADY_PRO");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      client_reference_id: req.user.id,
      customer_email: req.user.email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.CLIENT_URL}/pricing?cancelled=true`,
    });

    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
});

router.post("/create-portal-session", ...protect, async (req, res, next) => {
  try {
    if (!req.user.stripe_customer_id) {
      throw new AppError(
        "No active subscription found",
        400,
        "NO_SUBSCRIPTION",
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: req.user.stripe_customer_id,
      return_url: `${process.env.CLIENT_URL}/dashboard`,
    });
    res.json({ url: portalSession.url });
  } catch (error) {
    next(error);
  }
});

export default router;
