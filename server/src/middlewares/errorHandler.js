const errorHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "An unexpected error occurred";
  let details = error.details || null;

  if (error.code === 11000) {
    statusCode = 409;
    message = "A record with the provided value already exists";
    details = Object.keys(error.keyPattern || {}).map((field) => ({
      field,
      message: `${field} must be unique`,
    }));
  }

  if (error.name === "ValidationError") {
    statusCode = 422;
    message = "Database validation failed";
    details = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
  }

  if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource identifier";
  }

  if (
    error.name === "JsonWebTokenError" ||
    error.name === "TokenExpiredError"
  ) {
    statusCode = 401;
    message = "Invalid or expired token";
  }

  if (statusCode >= 500) {
    console.error(error);

    if (process.env.NODE_ENV === "production") {
      message = "An unexpected error occurred";
      details = null;
    }
  }

  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    meta: details ? { errors: details } : {},
  });
};

module.exports = errorHandler;
