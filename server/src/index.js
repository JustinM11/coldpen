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
