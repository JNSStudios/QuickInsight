import express from "express";
import apiService from "../services/APIService.js";
import { requireDateRange } from "./requireDateRange.js";

const router = express.Router();

/**
 * GET /top-item
 * Returns the single best-selling item or ?limit=N for N items.
 */
router.get("/", async (req, res, next) => {
  try {
    const { limit = 1, period } = req.query;
    const items = await apiService.getGATopItems(Number(limit), { period });
    res.json({ ok: true, data: items });
  } catch (err) {
    next(err);
  }
});

export default router;