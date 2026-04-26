import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const createUser = async () => {
  try {
    await connectDB();

    // Get command line arguments
    const args = process.argv.slice(2);
    const username = args[0] || "admin";
    const password = args[1] || "admin123";
    const role = args[2] || "admin";

    // Check if user exists
    const userExists = await User.findOne({ username: username.toLowerCase() });
    
    if (userExists) {
      console.log("\x1b[33m%s\x1b[0m", `⚠ User '${username}' already exists`);
      process.exit(0);
    }

    // Create user
    const user = new User({
      username: username.toLowerCase(),
      password: password,
      role: role
    });

    await user.hashPassword();
    await user.save();

    console.log("\x1b[32m%s\x1b[0m", "✓ User created successfully!");
    console.log("\x1b[36m%s\x1b[0m", "\nUser Credentials:");
    console.log("Username:", user.username);
    console.log("Password:", password);
    console.log("Role:", user.role);
    console.log("\n\x1b[33m%s\x1b[0m", "⚠ Please change the default password after first login!\n");
    
    process.exit(0);
  } catch (error) {
    console.error("\x1b[31m%s\x1b[0m", "✗ Error creating user:");
    console.error(error);
    process.exit(1);
  }
};

createUser();