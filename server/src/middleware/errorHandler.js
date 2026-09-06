export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Mark as operational error
  }
}

export const errorHandler = (err, req, res, next) => {
  // express.json() throws this for malformed bodies; without the special case
  // it falls through as a 400 with the message "Internal server error".
  if (err.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ error: "Invalid JSON in request body", code: "INVALID_JSON" });
  }

  // Only trust the status code on errors we created deliberately.
  // Third-party SDK errors (Stripe, Clerk) can carry a misleading statusCode
  // like 400, which would otherwise hide a real server-side failure.
  const statusCode = err.isOperational ? err.statusCode || 500 : 500;
  const message = err.isOperational ? err.message : "Internal server error";

  // Log every non-operational error, not just 500+, so silent SDK failures
  // (e.g. a wrong STRIPE_PRO_PRICE_ID) actually appear in the server log.
  if (!err.isOperational || statusCode >= 500) {
    console.error("Server Error:", req.method, req.originalUrl);
    console.error(err.message);
  }
  res.status(statusCode).json({
    error: message,
    code: err.code || "INTERNAL_ERROR",
  });
};
