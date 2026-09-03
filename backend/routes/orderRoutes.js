import express from "express";
import {
  createOrder,
  getOrders,
  updateOrderStatus,
  updateOrder,
  cancelOrder,
  deleteOrder,
  downloadOrderTemplate,
  importOrders
} from "../controllers/orderController.js";
import { authenticateToken } from "../middleware/auth.js";
import { auditLog } from "../middleware/auditMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Download Order import Excel template
router.get("/import-template",
  authenticateToken,
  downloadOrderTemplate
);

// Bulk Import orders via Excel / CSV
router.post("/import",
  authenticateToken,
  upload.single("file"),
  auditLog('CREATE', 'ORDER', 'Bulk orders import performed'),
  importOrders
);

// Create order
router.post("/",
  authenticateToken,
  auditLog('CREATE', 'ORDER', 'New order created'),
  createOrder
);

// Get all orders
router.get("/",
  authenticateToken,
  getOrders
);

// Update order status
router.put("/:id/status",
  authenticateToken,
  auditLog('UPDATE', 'ORDER', 'Order status updated'),
  updateOrderStatus
);

// Cancel order
router.post("/:id/cancel",
  authenticateToken,
  auditLog('UPDATE', 'ORDER', 'Order cancelled'),
  cancelOrder
);

// Update order
router.put("/:id",
  authenticateToken,
  auditLog('UPDATE', 'ORDER', 'Order updated'),
  updateOrder
);

// Delete order
router.delete("/:id",
  authenticateToken,
  auditLog('DELETE', 'ORDER', 'Order deleted'),
  deleteOrder
);

export default router;