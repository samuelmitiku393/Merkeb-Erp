import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { createBackup, listBackups } from "../services/backupService.js";
import { auditLog } from "../middleware/auditMiddleware.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import AuditLog from "../models/AuditLog.js";
import User from "../models/User.js";

const router = express.Router();

// Middleware to ensure user has admin role
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Admin privileges required",
    });
  }
  next();
};

// Trigger manual backup
router.post(
  "/backup",
  authenticateToken,
  requireAdmin,
  auditLog("CREATE", "SETTINGS", "Manual database backup triggered"),
  async (req, res) => {
    try {
      const summary = await createBackup();
      res.json({
        success: true,
        message: "Database backup completed successfully",
        summary,
      });
    } catch (error) {
      console.error("Manual backup error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to trigger backup",
        error: error.message,
      });
    }
  }
);

// List existing backups
router.get(
  "/backups",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const backups = listBackups();
      res.json({
        success: true,
        backups,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve backups list",
        error: error.message,
      });
    }
  }
);

// Get current database record counts
router.get(
  "/database-stats",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const [orders, products, customers, auditLogs, nonAdminUsers] = await Promise.all([
        Order.countDocuments(),
        Product.countDocuments(),
        Customer.countDocuments(),
        AuditLog.countDocuments(),
        User.countDocuments({ role: { $ne: "admin" } }),
      ]);

      res.json({
        success: true,
        stats: {
          orders,
          products,
          customers,
          auditLogs,
          nonAdminUsers,
        },
      });
    } catch (error) {
      console.error("Error fetching database stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch database stats",
        error: error.message,
      });
    }
  }
);

// Full Database Reset (deletes test orders, products, customers, audit logs; preserves admin accounts)
router.post(
  "/reset-database",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { createBackupBeforeReset = true, deleteNonAdminUsers = false } = req.body;

      let backupSummary = null;
      if (createBackupBeforeReset) {
        try {
          backupSummary = await createBackup();
        } catch (backupErr) {
          console.warn("Pre-reset backup failed or skipped:", backupErr.message);
        }
      }

      // Count records before wipe
      const [ordersBefore, productsBefore, customersBefore, auditLogsBefore, nonAdminUsersBefore] = await Promise.all([
        Order.countDocuments(),
        Product.countDocuments(),
        Customer.countDocuments(),
        AuditLog.countDocuments(),
        deleteNonAdminUsers ? User.countDocuments({ role: { $ne: "admin" } }) : Promise.resolve(0),
      ]);

      // Wipe transactional test data
      await Promise.all([
        Order.deleteMany({}),
        Product.deleteMany({}),
        Customer.deleteMany({}),
        AuditLog.deleteMany({}),
        deleteNonAdminUsers ? User.deleteMany({ role: { $ne: "admin" } }) : Promise.resolve(),
      ]);

      // Create a fresh clean audit log documenting the reset action
      try {
        await AuditLog.create({
          action: "DELETE",
          entity: "SETTINGS",
          performedBy: req.user.id || req.user._id,
          performedByUsername: req.user.username || "admin",
          performedByRole: req.user.role || "admin",
          description: `Full database reset performed by ${req.user.username || "admin"}. Wiped ${ordersBefore} orders, ${productsBefore} products, ${customersBefore} customers, and ${auditLogsBefore} audit logs.`,
          timestamp: new Date(),
        });
      } catch (logErr) {
        console.warn("Could not log reset in AuditLog:", logErr.message);
      }

      res.json({
        success: true,
        message: "Database reset completed successfully. Test data has been cleared.",
        deletedCounts: {
          orders: ordersBefore,
          products: productsBefore,
          customers: customersBefore,
          auditLogs: auditLogsBefore,
          nonAdminUsers: nonAdminUsersBefore,
        },
        backup: backupSummary ? { created: true, name: backupSummary.fileName || backupSummary.backupName } : { created: false },
      });
    } catch (error) {
      console.error("Database reset error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reset database",
        error: error.message,
      });
    }
  }
);

export default router;

