import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { authenticateToken,  authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Login route
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    // Find user
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    // Send response
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    next(error);
  }
});

// Register route
router.post("/register", async (req, res, next) => {
  try {
    const { username, password, role } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: "Username already exists"
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      username: username.toLowerCase(),
      password: hashedPassword,
      role: role || "user"
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    next(error);
  }
});

// Verify token route
router.get("/verify", authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: "Token is valid",
    user: req.user
  });
});
// Batch user registration (Admin only)
router.post("/register/batch", authenticateToken, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const { users } = req.body;

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        message: "Users array is required"
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const userData of users) {
      try {
        const { username, password, role } = userData;

        // Validate
        if (!username || !password) {
          results.failed.push({
            username: username || "unknown",
            error: "Username and password are required"
          });
          continue;
        }

        // Check if exists
        const existingUser = await User.findOne({ 
          username: username.toLowerCase() 
        });
        
        if (existingUser) {
          results.failed.push({
            username,
            error: "Username already exists"
          });
          continue;
        }

        // Create user
        const user = new User({
          username: username.toLowerCase(),
          password: password,
          role: role || "user"
        });

        await user.hashPassword();
        await user.save();

        results.successful.push({
          username: user.username,
          role: user.role
        });

      } catch (error) {
        results.failed.push({
          username: userData.username || "unknown",
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Created ${results.successful.length} users, ${results.failed.length} failed`,
      results
    });

  } catch (error) {
    next(error);
  }
});
export default router;