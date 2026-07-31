const crypto = require("crypto");

const hashToken = (token) => {
  if (!token || typeof token !== "string") {
    return null;
  }

  return crypto.createHash("sha256").update(token).digest("hex");
};

module.exports = {
  hashToken,
};
