import express from "express";
import { 
  createOrder, 
  getOrders, 
  updateOrderStatus, 
  updateOrder,  
  deleteOrder 
} from "../controllers/orderController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";
import { auditLog } from "../middleware/auditMiddleware.js";

const router = express.Router();

// Create order - requires authentication
router.post("/", 
  authenticateToken,
  auditLog('CREATE', 'ORDER', 'New order created'),
  createOrder
);

// Get all orders - requires authentication
router.get("/", 
  authenticateToken,
  getOrders
);

// Update order status - requires authentication and admin role
router.put("/:id/status", 
  authenticateToken,
  authorizeRoles("admin"),
  auditLog('UPDATE', 'ORDER', 'Order status updated'),
  updateOrderStatus
);

// Update order - requires authentication and admin role
router.put("/:id", 
  authenticateToken,
  authorizeRoles("admin"),
  auditLog('UPDATE', 'ORDER', 'Order updated'),
  updateOrder
);

// Delete order - requires authentication and admin role
router.delete("/:id", 
  authenticateToken,
  authorizeRoles("admin"),
  auditLog('DELETE', 'ORDER', 'Order deleted'),
  deleteOrder
);

export default router;