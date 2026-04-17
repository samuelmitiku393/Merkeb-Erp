import express from "express";
import {
  createCustomer,
  getCustomers, searchCustomers
} from "../controllers/customerController.js";

const router = express.Router();

router.post("/", createCustomer);
router.get("/", getCustomers);
router.get("/search", searchCustomers);
export default router;