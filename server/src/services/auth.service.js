const bcrypt = require("bcryptjs");

const AUDIT_ACTIONS = require("../constants/auditActions");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const ApiError = require("../utils/ApiError");
const { hashToken } = require("../utils/hash");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/token");
const { createAuditLog } = require("./audit.service");

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt,
});

const createTokenSession = async ({ user, ipAddress, userAgent }) => {
  const accessTokenData = generateAccessToken(user);
  const refreshTokenData = generateRefreshToken(user);
  const tokenHash = hashToken(refreshTokenData.token);

  await RefreshToken.create({
    user: user._id,
    tokenHash,
    expiresAt: refreshTokenData.expiresAt,
    ipAddress,
    userAgent,
  });

  return {
    accessToken: accessTokenData.token,
    accessTokenExpiresAt: accessTokenData.expiresAt,
    refreshToken: refreshTokenData.token,
    refreshTokenExpiresAt: refreshTokenData.expiresAt,
  };
};

const login = async ({ email, password, ipAddress, userAgent }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+passwordHash"
  );

  if (!user) {
    await createAuditLog({
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      entityType: "User",
      metadata: {
        email: normalizedEmail,
        reason: "INVALID_CREDENTIALS",
      },
      ipAddress,
      userAgent,
    });

    throw new ApiError(401, "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches || !user.isActive) {
    await createAuditLog({
      user: user._id,
      role: user.role,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      entityType: "User",
      entityId: user._id,
      metadata: {
        reason: user.isActive
          ? "INVALID_CREDENTIALS"
          : "USER_INACTIVE",
      },
      ipAddress,
      userAgent,
    });

    throw new ApiError(401, "Invalid email or password");
  }

  const tokens = await createTokenSession({
    user,
    ipAddress,
    userAgent,
  });

  const loginTime = new Date();

  await User.updateOne(
    { _id: user._id },
    { $set: { lastLoginAt: loginTime } }
  );

  user.lastLoginAt = loginTime;

  await createAuditLog({
    user: user._id,
    role: user.role,
    action: AUDIT_ACTIONS.LOGIN_SUCCESS,
    entityType: "User",
    entityId: user._id,
    ipAddress,
    userAgent,
  });

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
};

const refreshSession = async ({
  refreshToken,
  ipAddress,
  userAgent,
}) => {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (_error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  if (decoded.type !== "refresh" || !decoded.sub) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const oldTokenHash = hashToken(refreshToken);
  const now = new Date();

  const storedToken = await RefreshToken.findOneAndUpdate(
    {
      user: decoded.sub,
      tokenHash: oldTokenHash,
      revokedAt: null,
      expiresAt: { $gt: now },
    },
    {
      $set: {
        revokedAt: now,
        revokeReason: "ROTATED",
      },
    },
    {
      new: true,
    }
  );

  if (!storedToken) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded.sub);

  if (!user || !user.isActive) {
    throw new ApiError(401, "Authentication required");
  }

  const newTokens = await createTokenSession({
    user,
    ipAddress,
    userAgent,
  });

  storedToken.replacedByTokenHash = hashToken(
    newTokens.refreshToken
  );
  await storedToken.save();

  await createAuditLog({
    user: user._id,
    role: user.role,
    action: AUDIT_ACTIONS.TOKEN_REFRESHED,
    entityType: "User",
    entityId: user._id,
    ipAddress,
    userAgent,
  });

  return {
    user: sanitizeUser(user),
    ...newTokens,
  };
};

const logout = async ({ refreshToken, ipAddress, userAgent }) => {
  if (!refreshToken) {
    return;
  }

  const tokenHash = hashToken(refreshToken);

  const storedToken = await RefreshToken.findOneAndUpdate(
    {
      tokenHash,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
        revokeReason: "LOGOUT",
      },
    },
    {
      new: true,
    }
  ).populate("user", "role");

  if (storedToken?.user) {
    await createAuditLog({
      user: storedToken.user._id,
      role: storedToken.user.role,
      action: AUDIT_ACTIONS.LOGOUT,
      entityType: "User",
      entityId: storedToken.user._id,
      ipAddress,
      userAgent,
    });
  }
};

module.exports = {
  login,
  refreshSession,
  logout,
};
