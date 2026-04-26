import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const createUsers = async () => {
  try {
    await connectDB();

    // Define users to create
    const usersToCreate = [
      { username: "yeron", password: "admin123", role: "admin" },
      { username: "eliyas", password: "admin123", role: "admin" },
      { username: "amar", password: "admin123", role: "admin" }
    
    ];

    const results = {
      created: [],
      skipped: [],
      errors: []
    };

    for (const userData of usersToCreate) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
          username: userData.username.toLowerCase() 
        });

        if (existingUser) {
          results.skipped.push({
            username: userData.username,
            reason: "Already exists"
          });
          continue;
        }

        // Create user (password will be hashed in register route or manually)
        const user = new User({
          username: userData.username.toLowerCase(),
          password: userData.password,
          role: userData.role
        });

        // Manually hash password since we removed the pre-save middleware
        await user.hashPassword();
        await user.save();

        results.created.push({
          username: userData.username,
          role: userData.role
        });

      } catch (error) {
        results.errors.push({
          username: userData.username,
          error: error.message
        });
      }
    }

    // Display results
    console.log("\n📊 User Creation Summary:");
    console.log("=" .repeat(50));
    
    if (results.created.length > 0) {
      console.log("\n\x1b[32m✓ Created Users:\x1b[0m");
      results.created.forEach(user => {
        console.log(`  • ${user.username} (${user.role})`);
      });
    }

    if (results.skipped.length > 0) {
      console.log("\n\x1b[33m⚠ Skipped Users:\x1b[0m");
      results.skipped.forEach(user => {
        console.log(`  • ${user.username} - ${user.reason}`);
      });
    }

    if (results.errors.length > 0) {
      console.log("\n\x1b[31m✗ Errors:\x1b[0m");
      results.errors.forEach(error => {
        console.log(`  • ${error.username} - ${error.error}`);
      });
    }

    console.log("\n" + "=".repeat(50));
    console.log(`Total: ${results.created.length} created, ${results.skipped.length} skipped, ${results.errors.length} errors`);
    
    process.exit(0);
  } catch (error) {
    console.error("\x1b[31m✗ Fatal error:\x1b[0m", error);
    process.exit(1);
  }
};

createUsers();