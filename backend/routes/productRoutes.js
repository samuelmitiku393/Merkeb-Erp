import express from "express";
import {
    createProduct,
    getProducts,
    searchProducts,
    getProduct,
    updateProduct,
    deleteProduct
} from "../controllers/productController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";
import { auditLog } from "../middleware/auditMiddleware.js";

const router = express.Router();

// Create product - requires authentication and admin role
router.post("/", 
    authenticateToken,
    authorizeRoles("admin"),
    auditLog('CREATE', 'PRODUCT', 'New product created'),
    createProduct
);

// Get all products - requires authentication
router.get("/", 
    authenticateToken,
    getProducts
);

// Search products - requires authentication
router.get("/search", 
    authenticateToken,
    searchProducts
);

// Get single product - requires authentication
router.get("/:id", 
    authenticateToken,
    getProduct
);

// Update product - requires authentication and admin role
router.put("/:id", 
    authenticateToken,
    authorizeRoles("admin"),
    auditLog('UPDATE', 'PRODUCT', 'Product updated'),
    updateProduct
);

// Delete product - requires authentication and admin role
router.delete("/:id", 
    authenticateToken,
    authorizeRoles("admin"),
    auditLog('DELETE', 'PRODUCT', 'Product deleted'),
    deleteProduct
);

export default router;