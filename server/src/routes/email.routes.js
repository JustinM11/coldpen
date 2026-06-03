import { Router } from "express";
import { EmailController } from "../controllers/email.controller.js";
import { protect } from "../middleware/auth.js";
import { rateLimitByPlan } from "../middleware/rateLimit.js";

const router = Router();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Reject malformed ids up front. Without this, a non-UUID :id reaches a query
// against a uuid column and surfaces as a 500 ("invalid input syntax for type
// uuid") instead of a clean 404.
router.param("id", (req, res, next, id) => {
  if (!UUID_RE.test(id)) {
    return res.status(404).json({ error: "Email not found", code: "NOT_FOUND" });
  }
  next();
});

router.post("/generate", ...protect, rateLimitByPlan, EmailController.generate);

router.get("/stats", ...protect, EmailController.getStats);

router.get("/", ...protect, EmailController.list);

router.get("/:id", ...protect, EmailController.getById);

router.patch("/:id/favorite", ...protect, EmailController.toggleFavorite);

router.patch("/:id/copy", ...protect, EmailController.trackCopy);

router.delete("/:id", ...protect, EmailController.remove);

export default router;
