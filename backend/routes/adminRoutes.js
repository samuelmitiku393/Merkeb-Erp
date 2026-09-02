import express from "express";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";
import { createBackup, listBackups } from "../services/backupService.js";
import { auditLog } from "../middleware/auditMiddleware.js";

const router = express.Router();

// Trigger manual backup (Admin only)
router.post(
  "/backup",
  authenticateToken,
  authorizeRoles("admin"),
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

// List existing backups (Admin only)
router.get(
  "/backups",
  authenticateToken,
  authorizeRoles("admin"),
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

export default router;
