import express from "express";
import { getLowStockItems, getRestockSuggestions, getProducts, getProduct, createProduct, updateProduct, deleteProduct, updateStock, bulkUpdateStock } from "../controllers/inventoryController.js";

const router = express.Router();

router.get("/low-stock", getLowStockItems);
router.get("/restock-suggestions", getRestockSuggestions);
router.get("/", getProducts);
router.get("/:id", getProduct);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.patch("/:id/stock", updateStock);
router.post("/bulk-update-stock", bulkUpdateStock);
export default router;