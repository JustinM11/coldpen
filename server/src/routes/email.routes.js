import { Router } from "express";
import { EmailController } from "../controllers/email.controller.js";
import { protect } from "../middleware/auth.js";
import { rateLimitByPlan } from "../middleware/rateLimit.js";

const router = Router();

router.post("/generate", ...protect, rateLimitByPlan, EmailController.generate);

router.get("/stats", ...protect, EmailController.getStats);

router.get("/", ...protect, EmailController.list);

router.get("/:id", ...protect, EmailController.getById);

router.patch("/:id/favorite", ...protect, EmailController.toggleFavorite);

router.patch("/:id/copy", ...protect, EmailController.trackCopy);

router.delete("/:id", ...protect, EmailController.remove);

export default router;
