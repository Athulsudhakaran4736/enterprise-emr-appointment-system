require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const connectDatabase = require("../config/db");
const ROLES = require("../constants/roles");
const User = require("../models/User");

const seedSuperAdmin = async () => {
  try {
    const {
      SUPER_ADMIN_NAME,
      SUPER_ADMIN_EMAIL,
      SUPER_ADMIN_PASSWORD,
    } = process.env;

    if (
      !SUPER_ADMIN_NAME ||
      !SUPER_ADMIN_EMAIL ||
      !SUPER_ADMIN_PASSWORD
    ) {
      throw new Error(
        "SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required"
      );
    }

    if (SUPER_ADMIN_PASSWORD.length < 8) {
      throw new Error(
        "SUPER_ADMIN_PASSWORD must contain at least 8 characters"
      );
    }

    await connectDatabase();

    const normalizedEmail = SUPER_ADMIN_EMAIL
      .trim()
      .toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      console.log("Super Admin already exists");
      return;
    }

    const saltRounds = Number(
      process.env.BCRYPT_SALT_ROUNDS || 12
    );

    const passwordHash = await bcrypt.hash(
      SUPER_ADMIN_PASSWORD,
      saltRounds
    );

    await User.create({
      name: SUPER_ADMIN_NAME.trim(),
      email: normalizedEmail,
      passwordHash,
      role: ROLES.SUPER_ADMIN,
    });

    console.log("Super Admin created successfully");
  } catch (error) {
    console.error("Super Admin seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
};

seedSuperAdmin();
