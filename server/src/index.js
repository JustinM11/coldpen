import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { db } from "./config/database.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { clerkMiddleware } from "@clerk/express";
import emailRoutes from "./routes/email.routes.js";
import userRoutes from "./routes/user.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet());

// Request logging
app.use(morgan("dev"));

// CORS - allow frontend to talk to this server
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Webhook routes (no auth, raw body for Stripe)
app.use("/api/webhooks/stripe", express.raw({ type: "application/json" }));

// Parse JSON  request bodies
app.use(express.json());

// Clerk webhook routes (no auth, raw body for verification)
app.use("/api/webhooks", webhookRoutes);

// API routes
app.use("/api/emails", emailRoutes);

// User routes (e.g. for fetching user info, usage stats, etc.)
app.use("/api/users", userRoutes);

// Billing routes (e.g. for creating Stripe checkout sessions)
app.use("/api/billing", billingRoutes);

// Analytics routes (protected)
app.use("/api/analytics", analyticsRoutes);

// Clerk authentication middleware
app.use(clerkMiddleware());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString });
});

app.use(errorHandler);

// Start the server
async function start() {
  try {
    await db.query("SELECT NOW()");
    console.log("Database connection successful");

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
