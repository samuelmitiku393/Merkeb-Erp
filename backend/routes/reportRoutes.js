import express from "express";
import { 
  generateMonthlyReport, 
  generateYearlyReport 
} from "../controllers/reportController.js";

const router = express.Router();

// GET /api/reports/monthly?month=1&year=2024
router.get("/monthly", generateMonthlyReport);

// GET /api/reports/yearly?year=2024
router.get("/yearly", generateYearlyReport);

export default router;