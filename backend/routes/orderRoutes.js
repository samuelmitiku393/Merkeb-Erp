import express from "express";
import { createOrder, getOrders, updateOrderStatus, updateOrder,  deleteOrder } from "../controllers/orderController.js";

const router = express.Router();

router.post("/", createOrder);
router.get("/", getOrders);
router.put("/:id/status", updateOrderStatus);
router.put("/:id", updateOrder);      // Add this line
router.delete("/:id", deleteOrder); 
export default router;