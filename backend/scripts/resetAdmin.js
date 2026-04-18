import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

const resetAdminUser = async () => {
  try {
    // Connect to database
    await connectDB();

    // Delete existing admin
    const deleteResult = await User.deleteOne({ username: "admin" });
    console.log("\x1b[33m%s\x1b[0m", `Deleted existing admin: ${deleteResult.deletedCount > 0 ? 'Yes' : 'No'}`);

    // Create new user instance
    const admin = new User({
      username: "admin",
      password: "admin123",
      role: "admin"
    });

    // Manually hash the password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(admin.password, salt);

    // Save to database
    await admin.save();

    console.log("\x1b[32m%s\x1b[0m", "✓ New admin user created successfully!");
    console.log("\x1b[36m%s\x1b[0m", "\nAdmin Credentials:");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("Role: admin");
    console.log("ID:", admin._id);
    console.log("\n\x1b[32m%s\x1b[0m", "✓ You can now login with these credentials!\n");
    
    process.exit(0);
  } catch (error) {
    console.error("\x1b[31m%s\x1b[0m", "✗ Error resetting admin user:");
    console.error(error);
    process.exit(1);
  }
};

resetAdminUser();