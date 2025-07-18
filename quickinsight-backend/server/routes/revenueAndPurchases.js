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
          // Make this route period-aware
          const { period } = req.query;
          const summary = await apiService.getStripeSummary({ period });
          res.json({ ok: true, data: summary });
  } catch (err) {
    next(err);
  }
});

export default router;
