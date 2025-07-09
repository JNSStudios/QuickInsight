import express from "express";
import { getTopItems } from "../services/gaService.js";

const router = express.Router();

/**
 * GET /top-item
 * Returns the single best-selling item or ?limit=N for N items.
 */
router.get("/", async (req, res, next) => {
  try {
    const { limit = 1, startDate, endDate, rollingWindow, period } = req.query;
    const items = await getTopItems(Number(limit), { startDate, endDate, rollingWindow: rollingWindow === 'true', period });
    res.json({ ok: true, data: items });
  } catch (err) {
    next(err);
  }
});

export default router;