import Stripe from "stripe";

// Single shared Stripe client (billing routes, webhooks, account deletion).
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// True when a subscriptions.cancel() failure means the subscription is
// already gone or already canceled — safe to continue tearing down.
export function isAlreadyCanceled(err) {
  return (
    err?.code === "resource_missing" ||
    /canceled/i.test(err?.message || "")
  );
}
