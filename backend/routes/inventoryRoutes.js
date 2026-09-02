import express from "express";
import { 
    getLowStockItems, 
    getRestockSuggestions, 
    getProducts, 
    getProduct, 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    updateStock, 
    bulkUpdateStock,
    importProducts,
    downloadProductTemplate
} from "../controllers/inventoryController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";
import { auditLog } from "../middleware/auditMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Download Product import Excel template - requires authentication
router.get("/import-template",
    authenticateToken,
    downloadProductTemplate
);

// Bulk Import products via Excel / CSV - requires authentication & admin role
router.post("/import",
    authenticateToken,
    authorizeRoles("admin"),
    upload.single("file"),
    auditLog('CREATE', 'INVENTORY', 'Bulk products import performed'),
    importProducts
);

// Get low stock items - requires authentication
router.get("/low-stock", 
    authenticateToken,
    getLowStockItems
);

// Get restock suggestions - requires authentication
router.get("/restock-suggestions", 
    authenticateToken,
    getRestockSuggestions
);

// Get all products - requires authentication
router.get("/", 
    authenticateToken,
    getProducts
);

// Get single product - requires authentication
router.get("/:id", 
    authenticateToken,
    getProduct
);

// Create product - requires authentication and admin role
router.post("/", 
    authenticateToken,
    authorizeRoles("admin"),
    auditLog('CREATE', 'INVENTORY', 'New inventory item created'),
    createProduct
);

// Update product - requires authentication and admin role
router.put("/:id", 
    authenticateToken,
    authorizeRoles("admin"),
    auditLog('UPDATE', 'INVENTORY', 'Inventory item updated'),
    updateProduct
);

// Delete product - requires authentication and admin role
router.delete("/:id", 
    authenticateToken,
    authorizeRoles("admin"),
    auditLog('DELETE', 'INVENTORY', 'Inventory item deleted'),
    deleteProduct
);

// Update stock - requires authentication and admin role
router.patch("/:id/stock", 
    authenticateToken,
    authorizeRoles("admin"),
    auditLog('UPDATE', 'INVENTORY', 'Stock level updated'),
    updateStock
);

// Bulk update stock - requires authentication and admin role
router.post("/bulk-update-stock", 
    authenticateToken,
    authorizeRoles("admin"),
    auditLog('UPDATE', 'INVENTORY', 'Bulk stock update performed'),
    bulkUpdateStock
);

export default router;