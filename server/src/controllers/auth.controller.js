const authService = require("../services/auth.service");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const {
  REFRESH_TOKEN_COOKIE,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} = require("../utils/cookie");

const getRequestInformation = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get("user-agent") || null,
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login({
    email: req.body.email,
    password: req.body.password,
    ...getRequestInformation(req),
  });

  setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt);

  return sendSuccess(res, {
    message: "Login successful",
    data: {
      user: result.user,
      accessToken: result.accessToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt,
    },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refreshSession({
    refreshToken: req.cookies[REFRESH_TOKEN_COOKIE],
    ...getRequestInformation(req),
  });

  setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt);

  return sendSuccess(res, {
    message: "Token refreshed successfully",
    data: {
      user: result.user,
      accessToken: result.accessToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout({
    refreshToken: req.cookies[REFRESH_TOKEN_COOKIE],
    ...getRequestInformation(req),
  });

  clearRefreshTokenCookie(res);

  return sendSuccess(res, {
    message: "Logout successful",
    data: {},
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    message: "Current user retrieved successfully",
    data: {
      user: req.user,
    },
  });
});

module.exports = {
  login,
  refresh,
  logout,
  getCurrentUser,
};
