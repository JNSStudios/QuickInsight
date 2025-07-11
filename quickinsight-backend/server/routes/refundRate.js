import express from "express";
import { getRefundRate, getRefundRateChange } from "../services/stripeService.js";
import { requireDateRange } from "./requireDateRange.js";

const router = express.Router();

/**
 * GET /refund-rate
 * Returns { refundRatePct: 1.37 }
 */
router.get("/", requireDateRange, async (req, res, next) => {
  try {
    const { startDate, endDate, rollingWindow, period } = req.query;
    const data = await getRefundRate({ startDate, endDate, rollingWindow: rollingWindow === 'true', period });
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;

// GET /refund-rate-change
// Returns { current, previous, percentChange }
router.get("/change", requireDateRange, async (req, res, next) => {
  try {
    const { startDate, endDate, period } = req.query;
    const data = await getRefundRateChange({ startDate, endDate, period });
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
});
