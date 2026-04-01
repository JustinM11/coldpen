import { generateColdEmails } from "../services/ai.service.js";
import { EmailModel } from "../models/email.model.js";
import { AppError } from "../middleware/errorHandler.js";

const VALID_TONES = ["professional", "casual", "friendly", "bold"];

export const EmailController = {
  async generate(req, res, next) {
    try {
      const { productDescription, targetAudience, tone, ctaGoal } = req.body;

      if (
        !productDescription?.trim() ||
        !targetAudience?.trim() ||
        !tone ||
        !ctaGoal?.trim()
      ) {
        throw new AppError("All fields are required", 400, "VALIDATION_ERROR");
      }

      if (!VALID_TONES.includes(tone)) {
        throw new AppError(
          "invalid tone. Must be one of: ${VALID_TONES.join(', ')}",
          400,
          "VALIDATION_ERROR",
        );
      }

      const { variations, usage } = await generateColdEmails({
        productDescription: productDescription.trim(),
        targetAudience: targetAudience.trim(),
        tone,
        ctaGoal: ctaGoal.trim(),
      });

      const savedEmail = await EmailModel.create({
        userId: req.user.id,
        productDescription: productDescription.trim(),
        targetAudience: targetAudience.trim(),
        tone,
        ctaGoal: ctaGoal.trim(),
        variations,
      });

      res.status(201).json({
        email: savedEmail,
        usage,
        rateLimit: req.rateLimitInfo,
      });
    } catch (error) {
      next(error);
    }
  },

  async list(req, res, next) {
    try {
      const { limit = "20", offset = "0", favorites, search = "" } = req.query;

      const emails = await EmailModel.findByUser(req.user.id, {
        limit: Math.min(parseInt(limit, 10) || 20, 100),
        offset: parseInt(offset, 10) || 0,
        favoriteOnly: favorites === "true",
        search,
      });

      res.json({ emails, count: emails.length });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const email = await EmailModel.findById(req.params.id, req.user.id);
      if (!email) {
        throw new AppError("Email not found", 404, "NOT_FOUND");
      }
      res.json({ email });
    } catch (error) {
      next(error);
    }
  },

  async toggleFavorite(req, res, next) {
    try {
      const email = await EmailModel.toggleFavorite(req.params.id, req.user.id);
      if (!email) {
        throw new AppError("Email not found", 404, "NOT_FOUND");
      }
      res.json({ email });
    } catch (error) {
      next(error);
    }
  },

  async trackCopy(req, res, next) {
    try {
      const result = await EmailModel.incrementCopyCount(
        req.params.id,
        req.user.id,
      );
      if (!result) {
        throw new AppError("Email not found", 404, "NOT_FOUND");
      }
      res.json({ copiedCount: result.copied_count });
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const deleted = await EmailModel.delete(req.params.id, req.user.id);
      if (!deleted) {
        throw new AppError("Email not found", 404, "NOT_FOUND");
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async getStats(req, res, next) {
    try {
      const stats = await EmailModel.getStats(req.user.id);
      res.json({ stats });
    } catch (error) {
      next(error);
    }
  },
};
