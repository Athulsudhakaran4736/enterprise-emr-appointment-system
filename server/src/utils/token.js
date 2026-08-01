const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const getJwtOptions = () => ({
  issuer: process.env.JWT_ISSUER || "emr-appointment-api",
  audience: process.env.JWT_AUDIENCE || "emr-appointment-client",
});

const signToken = ({ payload, secret, expiresIn }) => {
  if (!secret) {
    throw new Error("JWT secret is not configured");
  }

  const token = jwt.sign(payload, secret, {
    expiresIn,
    jwtid: crypto.randomUUID(),
    ...getJwtOptions(),
  });

  const decoded = jwt.decode(token);

  if (!decoded?.exp) {
    throw new Error("Unable to determine token expiration");
  }

  return {
    token,
    expiresAt: new Date(decoded.exp * 1000),
  };
};

const generateAccessToken = (user) =>
  signToken({
    payload: {
      sub: user._id.toString(),
      role: user.role,
      type: "access",
    },
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });

const generateRefreshToken = (user) =>
  signToken({
    payload: {
      sub: user._id.toString(),
      type: "refresh",
    },
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });

const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET, getJwtOptions());

const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET, getJwtOptions());

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
