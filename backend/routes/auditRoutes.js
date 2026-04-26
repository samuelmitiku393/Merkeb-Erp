import express from "express";
import AuditLog from "../models/AuditLog.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Get all audit logs (admin only)
router.get("/", authenticateToken, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      action, 
      entity, 
      performedBy, 
      startDate, 
      endDate,
      search 
    } = req.query;

    const query = {};

    // Add filters
    if (action) query.action = action;
    if (entity) query.entity = entity;
    if (performedBy) query.performedBy = performedBy;
    
    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Search filter
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { performedByUsername: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { entity: { $regex: search, $options: 'i' } }
      ];
    }

    const totalLogs = await AuditLog.countDocuments(query);
    const totalPages = Math.ceil(totalLogs / limit);

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('performedBy', 'username role')
      .lean();

    // Get unique values for filters
    const [actions, entities, users] = await Promise.all([
      AuditLog.distinct('action'),
      AuditLog.distinct('entity'),
      AuditLog.find().distinct('performedByUsername')
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalLogs,
          limit: parseInt(limit)
        },
        filters: {
          actions,
          entities,
          users
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get audit log by ID (admin only)
router.get("/:id", authenticateToken, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('performedBy', 'username role');

    if (!log) {
      return res.status(404).json({ message: "Audit log not found" });
    }

    res.json({
      success: true,
      data: log
    });

  } catch (error) {
    next(error);
  }
});

// Get user-specific audit logs
router.get("/user/:userId", authenticateToken, async (req, res, next) => {
  try {
    // Users can only see their own logs, admins can see all
    if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { page = 1, limit = 20 } = req.query;

    const logs = await AuditLog.find({ performedBy: req.params.userId })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await AuditLog.countDocuments({ performedBy: req.params.userId });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get audit statistics (admin only)
router.get("/stats/overview", authenticateToken, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [todayCount, weekCount, monthCount, actionBreakdown, userActions] = await Promise.all([
      AuditLog.countDocuments({ timestamp: { $gte: today } }),
      AuditLog.countDocuments({ timestamp: { $gte: weekAgo } }),
      AuditLog.countDocuments({ timestamp: { $gte: monthAgo } }),
      AuditLog.aggregate([
        { $group: { _id: "$action", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      AuditLog.aggregate([
        { $group: { _id: "$performedByUsername", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        todayCount,
        weekCount,
        monthCount,
        actionBreakdown,
        topUsers: userActions
      }
    });

  } catch (error) {
    next(error);
  }
});

export default router;