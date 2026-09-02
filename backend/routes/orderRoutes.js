import express from "express";
import {
  createOrder,
  getOrders,
  updateOrderStatus,
  updateOrder,
  cancelOrder,
  deleteOrder
} from "../controllers/orderController.js";
import { authenticateToken } from "../middleware/auth.js";
import { auditLog } from "../middleware/auditMiddleware.js";

const router = express.Router();

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