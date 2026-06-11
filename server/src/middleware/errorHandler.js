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

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Internal server error";

  if (statusCode >= 500) {
    console.error("Server Error:", req.method, req.originalUrl);
    console.error(err.message);
  }

  res.status(statusCode).json({
    error: message,
    code: err.code || "INTERNAL_ERROR",
  });
};
