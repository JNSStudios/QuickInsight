import express from "express";
import { getRefundRate } from "../services/stripeService.js";

const router = express.Router();

/**
 * GET /refund-rate
 * Returns { refundRatePct: 1.37 }
 */
router.get("/", async (req, res, next) => {
  try {
    const { startDate, endDate, rollingWindow, period } = req.query;
    const data = await getRefundRate({ startDate, endDate, rollingWindow: rollingWindow === 'true', period });
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
