import express from "express";
import { getStripeSummary } from "../services/stripeService.js";

const router = express.Router();

/**
 * GET /revenue-and-purchases
 * Returns { revenue: 1259.27, purchases: 73 }
 */
router.get("/", async (req, res, next) => {
  try {
    const { startDate, endDate, rollingWindow, period } = req.query;
    const data = await getStripeSummary({ startDate, endDate, rollingWindow: rollingWindow === 'true', period });
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
