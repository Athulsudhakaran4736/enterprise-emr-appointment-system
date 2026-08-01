const AuditLog = require("../models/AuditLog");

const createAuditLog = async ({
  user = null,
  role = null,
  action,
  entityType,
  entityId = null,
  metadata = {},
  ipAddress = null,
  userAgent = null,
}) => {
  try {
    await AuditLog.create({
      user,
      role,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("Audit logging failed:", error.message);
  }
};

module.exports = {
  createAuditLog,
};
