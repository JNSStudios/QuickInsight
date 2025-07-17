import express from "express";
import apiService from "../services/APIService.js";
import { requireDateRange } from "./requireDateRange.js";

const router = express.Router();

/**
 * GET /revenue-and-purchases
 * Returns { revenue: 1259.27, purchases: 73 }
 */
router.get("/", async (req, res, next) => {
  try {
    const { period } = req.query;
    const { stripeData } = await apiService.getAllData();
    // Filter summary by period in code
    const summary = await apiService.getStripeSummary({ period });
    res.json({ ok: true, data: summary });
  } catch (err) {
    next(err);
  }
});

export default router;
