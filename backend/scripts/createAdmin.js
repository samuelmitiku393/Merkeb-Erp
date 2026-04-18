import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to database
    await connectDB();

    // Check if admin already exists
    const adminExists = await User.findOne({ username: "admin" });
    
    if (adminExists) {
      console.log("\x1b[33m%s\x1b[0m", "⚠ Admin user already exists");
      console.log("Username: admin");
      console.log("To reset password, delete the user and run this script again\n");
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      username: "admin",
      password: "admin123", // You should change this to a strong password
      role: "admin"
    });

    console.log("\x1b[32m%s\x1b[0m", "✓ Admin user created successfully!");
    console.log("\x1b[36m%s\x1b[0m", "\nAdmin Credentials:");
    console.log("Username:", admin.username);
    console.log("Password: admin123");
    console.log("Role:", admin.role);
    console.log("\n\x1b[33m%s\x1b[0m", "⚠ Please change the default password after first login!\n");
    
    process.exit(0);
  } catch (error) {
    console.error("\x1b[31m%s\x1b[0m", "✗ Error creating admin user:");
    console.error(error);
    process.exit(1);
  }
};

createAdminUser();