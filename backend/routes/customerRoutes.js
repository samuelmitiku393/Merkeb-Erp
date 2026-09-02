import express from "express";
import {
  createCustomer,
  getCustomers, 
  searchCustomers,
  downloadCustomerTemplate,
  importCustomers
} from "../controllers/customerController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";
import { auditLog } from "../middleware/auditMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Download customer import Excel template
router.get("/import-template", authenticateToken, downloadCustomerTemplate);

// Bulk import customers via Excel/CSV (Admin only)
router.post(
  "/import",
  authenticateToken,
  authorizeRoles("admin"),
  upload.single("file"),
  auditLog("CREATE", "SETTINGS", "Bulk customers import performed"),
  importCustomers
);

router.post("/", authenticateToken, createCustomer);
router.get("/", authenticateToken, getCustomers);
router.get("/search", authenticateToken, searchCustomers);

export default router;