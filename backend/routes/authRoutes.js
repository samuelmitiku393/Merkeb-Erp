import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";
import { auditLog } from "../middleware/auditMiddleware.js";

const router = express.Router();

// ─── Telegram Mini App Login ────────────────────────────────────────────────
// Validates Telegram initData using HMAC-SHA256 per Telegram's spec:
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
router.post("/telegram-login", async (req, res, next) => {
  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({ message: "initData is required" });
    }

    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return res.status(503).json({ message: "Telegram authentication is not configured on this server" });
    }

    // 1. Parse the initData query string
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) {
      return res.status(400).json({ message: "Invalid initData: missing hash" });
    }

    // 2. Build the data-check-string (all fields except hash, sorted alphabetically)
    params.delete("hash");
    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${key}=${val}`)
      .join("\n");

    // 3. Compute the HMAC-SHA256 signature
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(process.env.TELEGRAM_BOT_TOKEN)
      .digest();

    const computedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    if (computedHash !== hash) {
      return res.status(401).json({ message: "Invalid Telegram initData signature" });
    }

    // 4. Check auth_date to prevent replay attacks (allow up to 24h)
    const authDate = parseInt(params.get("auth_date") || "0", 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      return res.status(401).json({ message: "initData has expired" });
    }

    // 5. Parse the user object from initData
    const tgUserRaw = params.get("user");
    if (!tgUserRaw) {
      return res.status(400).json({ message: "No user data in initData" });
    }

    let tgUser;
    try {
      tgUser = JSON.parse(tgUserRaw);
    } catch {
      return res.status(400).json({ message: "Malformed user data in initData" });
    }

    const { id: telegramId, username: telegramUsername, first_name, last_name, photo_url } = tgUser;

    if (!telegramId) {
      return res.status(400).json({ message: "Missing Telegram user ID" });
    }

    // 6. Find or create user
    let user = await User.findOne({ telegramId });

    if (!user) {
      // Auto-register new Telegram user
      const generatedUsername = telegramUsername
        ? `tg_${telegramUsername}`.toLowerCase()
        : `tg_${telegramId}`;

      // Ensure username is unique
      let finalUsername = generatedUsername;
      let counter = 1;
      while (await User.findOne({ username: finalUsername })) {
        finalUsername = `${generatedUsername}_${counter++}`;
      }

      user = new User({
        username: finalUsername,
        password: null,
        role: "user",
        telegramId,
        telegramUsername: telegramUsername || null,
        firstName: first_name || null,
        lastName: last_name || null,
        photoUrl: photo_url || null,
      });

      await user.save();

      // Audit log new registration
      try {
        await AuditLog.create({
          action: "REGISTER_TELEGRAM",
          entity: "AUTH",
          performedBy: user._id,
          performedByUsername: user.username,
          performedByRole: user.role,
          description: `Telegram user ${finalUsername} (ID: ${telegramId}) registered via Mini App`,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get("user-agent"),
          timestamp: new Date(),
        });
      } catch (auditError) {
        console.error("Failed to create audit log:", auditError.message);
      }
    } else {
      // Update Telegram profile fields in case they changed
      user.telegramUsername = telegramUsername || user.telegramUsername;
      user.firstName = first_name || user.firstName;
      user.lastName = last_name || user.lastName;
      user.photoUrl = photo_url || user.photoUrl;
      await user.save();
    }

    // 7. Issue JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    // Audit successful login
    try {
      await AuditLog.create({
        action: "LOGIN_TELEGRAM",
        entity: "AUTH",
        performedBy: user._id,
        performedByUsername: user.username,
        performedByRole: user.role,
        description: `Telegram user ${user.username} logged in via Mini App`,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get("user-agent"),
        timestamp: new Date(),
      });
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError.message);
    }

    return res.json({
      success: true,
      message: "Telegram login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        telegramUsername: user.telegramUsername,
        photoUrl: user.photoUrl,
      },
    });

  } catch (error) {
    next(error);
  }
});


// Login route - no authentication needed, but we log manually
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
      // Log failed login attempt
      try {
        await AuditLog.create({
          action: 'LOGIN_FAILED',
          entity: 'AUTH',
          performedByUsername: username,
          performedByRole: 'unknown',
          description: `Failed login attempt for username: ${username}`,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('user-agent'),
          timestamp: new Date()
        });
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError.message);
      }
      
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    // Guard: Telegram-only accounts have no password set
    if (!user.password) {
      return res.status(401).json({
        message: "This account uses Telegram login. Please open the app via Telegram."
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Log failed password attempt
      try {
        await AuditLog.create({
          action: 'LOGIN_FAILED',
          entity: 'AUTH',
          performedBy: user._id,
          performedByUsername: username,
          performedByRole: user.role,
          description: `Failed password attempt for user: ${username}`,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('user-agent'),
          timestamp: new Date()
        });
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError.message);
      }
      
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

    // Log successful login
    try {
      await AuditLog.create({
        action: 'LOGIN',
        entity: 'AUTH',
        performedBy: user._id,
        performedByUsername: user.username,
        performedByRole: user.role,
        description: `User ${user.username} logged in successfully`,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        timestamp: new Date()
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError.message);
    }

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

// Register - Requires authentication and admin role
router.post("/register", 
  authenticateToken,           // 1. First authenticate
  authorizeRoles("admin"),     // 2. Then check role
  auditLog('CREATE', 'USER', 'New user registered'), // 3. Then audit (now has user info)
  async (req, res, next) => {
    try {
      const { username, password, role } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          message: "Username and password are required"
        });
      }

      const existingUser = await User.findOne({ username: username.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          message: "Username already exists"
        });
      }

      const user = new User({
        username: username.toLowerCase(),
        password: password,
        role: role || "user"
      });

      await user.hashPassword();
      await user.save();

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

// Batch user registration - Requires authentication and admin role
router.post("/register/batch", 
  authenticateToken,           // 1. First authenticate
  authorizeRoles("admin"),     // 2. Then check role
  auditLog('CREATE', 'USER', 'Batch user registration'), // 3. Then audit
  async (req, res, next) => {
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

          if (!username || !password) {
            results.failed.push({
              username: username || "unknown",
              error: "Username and password are required"
            });
            continue;
          }

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

// Change password - Requires authentication
router.post("/change-password", 
  authenticateToken,           // 1. First authenticate
  auditLog('PASSWORD_CHANGE', 'AUTH', 'Password changed'), // 2. Then audit
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          message: "Current and new passwords are required"
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      user.password = newPassword;
      await user.hashPassword();
      await user.save();

      res.json({
        success: true,
        message: "Password changed successfully"
      });

    } catch (error) {
      next(error);
    }
});

// Update profile - Requires authentication
router.put("/update-profile", 
  authenticateToken,           // 1. First authenticate
  auditLog('PROFILE_UPDATE', 'PROFILE', 'Profile updated'), // 2. Then audit
  async (req, res, next) => {
    try {
      const { username, email, phone, location, bio } = req.body;
      
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Track changes for audit
      const changes = {};
      if (email !== undefined && email !== user.email) changes.email = { from: user.email, to: email };
      if (phone !== undefined && phone !== user.phone) changes.phone = { from: user.phone, to: phone };
      if (location !== undefined && location !== user.location) changes.location = { from: user.location, to: location };
      if (bio !== undefined && bio !== user.bio) changes.bio = { from: user.bio, to: bio };

      // Update fields
      if (email !== undefined) user.email = email;
      if (phone !== undefined) user.phone = phone;
      if (location !== undefined) user.location = location;
      if (bio !== undefined) user.bio = bio;

      await user.save();

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          location: user.location,
          bio: user.bio,
          role: user.role
        }
      });

    } catch (error) {
      next(error);
    }
});

// Token verification route
router.get("/verify", authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: "Token is valid",
    user: req.user
  });
});

export default router;