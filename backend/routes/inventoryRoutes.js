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
import { authenticateToken } from "../middleware/auth.js";
import { auditLog } from "../middleware/auditMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Download Product import Excel template
router.get("/import-template",
    authenticateToken,
    downloadProductTemplate
);

// Bulk Import products via Excel / CSV
router.post("/import",
    authenticateToken,
    upload.single("file"),
    auditLog('CREATE', 'INVENTORY', 'Bulk products import performed'),
    importProducts
);

// Get low stock items
router.get("/low-stock", 
    authenticateToken,
    getLowStockItems
);

// Get restock suggestions
router.get("/restock-suggestions", 
    authenticateToken,
    getRestockSuggestions
);

// Get all products
router.get("/", 
    authenticateToken,
    getProducts
);

// Get single product
router.get("/:id", 
    authenticateToken,
    getProduct
);

// Create product
router.post("/", 
    authenticateToken,
    auditLog('CREATE', 'INVENTORY', 'New inventory item created'),
    createProduct
);

// Update product
router.put("/:id", 
    authenticateToken,
    auditLog('UPDATE', 'INVENTORY', 'Inventory item updated'),
    updateProduct
);

// Delete product
router.delete("/:id", 
    authenticateToken,
    auditLog('DELETE', 'INVENTORY', 'Inventory item deleted'),
    deleteProduct
);

// Update stock
router.patch("/:id/stock", 
    authenticateToken,
    auditLog('UPDATE', 'INVENTORY', 'Stock level updated'),
    updateStock
);

// Bulk update stock
router.post("/bulk-update-stock", 
    authenticateToken,
    auditLog('UPDATE', 'INVENTORY', 'Bulk stock update performed'),
    bulkUpdateStock
);

export default router;