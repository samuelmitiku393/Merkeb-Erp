import express from "express";
import {
    createProduct,
    getProducts,
    searchProducts,
    getProduct,
    updateProduct,
    deleteProduct
} from "../controllers/productController.js";
import { authenticateToken } from "../middleware/auth.js";
import { auditLog } from "../middleware/auditMiddleware.js";

const router = express.Router();

// Create product
router.post("/", 
    authenticateToken,
    auditLog('CREATE', 'PRODUCT', 'New product created'),
    createProduct
);

// Get all products
router.get("/", 
    authenticateToken,
    getProducts
);

// Search products
router.get("/search", 
    authenticateToken,
    searchProducts
);

// Get single product
router.get("/:id", 
    authenticateToken,
    getProduct
);

// Update product
router.put("/:id", 
    authenticateToken,
    auditLog('UPDATE', 'PRODUCT', 'Product updated'),
    updateProduct
);

// Delete product
router.delete("/:id", 
    authenticateToken,
    auditLog('DELETE', 'PRODUCT', 'Product deleted'),
    deleteProduct
);

export default router;