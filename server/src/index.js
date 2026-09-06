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

// Fail fast if required env vars are missing
const REQUIRED_ENV = [
  "DATABASE_URL",
  "CLERK_SECRET_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "CLERK_WEBHOOK_SECRET",
  "ANTHROPIC_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRO_PRICE_ID",
  "CLIENT_URL",
];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error("Missing required environment variables:", missing.join(", "));
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet());

// Request logging — verbose dev format locally, structured combined format in prod
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// CORS - allow frontend to talk to this server
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Raw body for webhook signature verification (must be before express.json())
app.use("/api/webhooks/stripe", express.raw({ type: "application/json" }));
app.use("/api/webhooks/clerk", express.raw({ type: "application/json" }));

// Parse JSON request bodies
app.use(express.json());

// Clerk auth — must be before any protected routes
app.use(clerkMiddleware());

app.use("/api/webhooks", webhookRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/users", userRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
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
