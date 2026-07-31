const REFRESH_TOKEN_COOKIE = "refreshToken";

const getRefreshCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/api/v1/auth",
  };
};

const setRefreshTokenCookie = (res, token, expiresAt) => {
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    ...getRefreshCookieOptions(),
    expires: expiresAt,
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie(REFRESH_TOKEN_COOKIE, getRefreshCookieOptions());
};

module.exports = {
  REFRESH_TOKEN_COOKIE,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
};
