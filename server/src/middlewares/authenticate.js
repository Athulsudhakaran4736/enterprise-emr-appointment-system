const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { verifyAccessToken } = require("../utils/token");

const authenticate = asyncHandler(async (req, _res, next) => {
  const authorizationHeader = req.get("authorization");

  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new ApiError(401, "Authentication required");
  }

  const accessToken = authorizationHeader.slice("Bearer ".length).trim();

  if (!accessToken) {
    throw new ApiError(401, "Authentication required");
  }

  let decoded;

  try {
    decoded = verifyAccessToken(accessToken);
  } catch (_error) {
    throw new ApiError(401, "Invalid or expired access token");
  }

  if (decoded.type !== "access" || !decoded.sub) {
    throw new ApiError(401, "Invalid access token");
  }

  const user = await User.findById(decoded.sub).select(
    "_id name email role isActive lastLoginAt"
  );

  if (!user || !user.isActive) {
    throw new ApiError(401, "Authentication required");
  }

  req.user = user;

  return next();
});

module.exports = authenticate;
