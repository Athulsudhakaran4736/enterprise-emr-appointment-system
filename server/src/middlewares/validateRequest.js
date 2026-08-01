const { validationResult } = require("express-validator");

const ApiError = require("../utils/ApiError");

const validateRequest = (req, _res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const validationErrors = result.array().map((error) => ({
    field: error.path,
    message: error.msg,
  }));

  return next(
    new ApiError(422, "Request validation failed", validationErrors)
  );
};

module.exports = validateRequest;
