import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { EmailModel } from "../models/email.model.js";

const router = Router();

router.get("/dashboard", ...protect, async (req, res) => {
  try {
    const stats = await EmailModel.getStats(req.user.id);

    res.json({
      stats: {
        totalGenerations: parseInt(stats.total_generation, 10),
        totalFavorited: parseInt(stats.total_favorited, 10),
        totalCopies: parseInt(stats.total_copied, 10),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
