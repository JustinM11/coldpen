import { generateColdEmails } from "../services/ai.service.js";
import { EmailModel } from "../models/email.model.js";
import { AppError } from "../middleware/errorHandler.js";
import { refundGeneration } from "../middleware/rateLimit.js";

const VALID_TONES = ["professional", "casual", "friendly", "bold"];

const MAX_LENGTHS = {
  productDescription: 1000,
  targetAudience: 500,
  ctaGoal: 200,
  senderName: 100,
  signature: 300,
};

export const EmailController = {
  async generate(req, res, next) {
    try {
      const { productDescription, targetAudience, tone, ctaGoal } = req.body;
      const senderName = req.body.senderName?.trim() || "";
      const signature = req.body.signature?.trim() || "";

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
          `Invalid tone. Must be one of: ${VALID_TONES.join(", ")}`,
          400,
          "VALIDATION_ERROR",
        );
      }

      if (productDescription.trim().length > MAX_LENGTHS.productDescription) {
        throw new AppError(
          `Product description must be ${MAX_LENGTHS.productDescription} characters or less`,
          400,
          "VALIDATION_ERROR",
        );
      }
      if (targetAudience.trim().length > MAX_LENGTHS.targetAudience) {
        throw new AppError(
          `Target audience must be ${MAX_LENGTHS.targetAudience} characters or less`,
          400,
          "VALIDATION_ERROR",
        );
      }
      if (ctaGoal.trim().length > MAX_LENGTHS.ctaGoal) {
        throw new AppError(
          `CTA goal must be ${MAX_LENGTHS.ctaGoal} characters or less`,
          400,
          "VALIDATION_ERROR",
        );
      }
      if (senderName.length > MAX_LENGTHS.senderName) {
        throw new AppError(
          `Sender name must be ${MAX_LENGTHS.senderName} characters or less`,
          400,
          "VALIDATION_ERROR",
        );
      }
      if (signature.length > MAX_LENGTHS.signature) {
        throw new AppError(
          `Signature must be ${MAX_LENGTHS.signature} characters or less`,
          400,
          "VALIDATION_ERROR",
        );
      }

      const { variations, usage } = await generateColdEmails({
        productDescription: productDescription.trim(),
        targetAudience: targetAudience.trim(),
        tone,
        ctaGoal: ctaGoal.trim(),
        senderName,
        signature,
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
      // rateLimitByPlan already counted this generation. Since the request
      // failed (validation, AI error, or save failure), give it back so the
      // user isn't charged a generation for nothing.
      if (req.rateLimitInfo?.date) {
        try {
          await refundGeneration(req.user.id, req.rateLimitInfo.date);
        } catch (refundError) {
          console.error("Failed to refund generation:", refundError.message);
        }
      }
      next(error);
    }
  },

  async list(req, res, next) {
    try {
      const { limit = "20", offset = "0", favorites, search = "", tone = "" } = req.query;

      const emails = await EmailModel.findByUser(req.user.id, {
        limit: Math.min(parseInt(limit, 10) || 20, 100),
        offset: parseInt(offset, 10) || 0,
        favoriteOnly: favorites === "true",
        search,
        tone,
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
