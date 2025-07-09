// Traffic sources gets data from Google Analytics only.

import express from "express";
import { getTrafficSources } from "../services/gaService.js";

const router = express.Router();

/**
 * GET /traffic-sources
 * Returns an array of objects like:
 * [{ channel: "Organic Search", users: 1234, percent: 42.7 }, …]
 */
router.get("/", async (req, res, next) => {
  try {
    const { startDate, endDate, rollingWindow, period } = req.query;
    const data = await getTrafficSources({ startDate, endDate, rollingWindow: rollingWindow === 'true', period });
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
