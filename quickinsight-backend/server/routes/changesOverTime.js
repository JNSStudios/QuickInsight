import express from "express";
import { getTimeSeries } from "../services/gaService.js";
import { requireDateRange } from "./requireDateRange.js";

const router = express.Router();

/**
 * GET /changes-over-time
 * Returns [{ date: "2024-07-01", users: 123, purchases: 8, revenue: 259.99 }, …]
 */
router.get("/", requireDateRange, async (req, res, next) => {
  try {
    const { startDate, endDate, rollingWindow, period } = req.query;
    const data = await getTimeSeries({ startDate, endDate, rollingWindow: rollingWindow === 'true', period });
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
