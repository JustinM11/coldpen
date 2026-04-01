export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Mark as operational error
  }
}

export const errorHandler = (err, req, res, next) => {
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
