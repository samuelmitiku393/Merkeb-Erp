import express from "express";
import { getDashboardStats, getProductPerformance, getProfitStats } from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/dashboard", getDashboardStats);
router.get("/products", getProductPerformance);
router.get("/profit", getProfitStats);
export default router;