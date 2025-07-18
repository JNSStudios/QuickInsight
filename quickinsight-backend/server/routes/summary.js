import express from "express";
import apiService from "../services/APIService.js";

const router = express.Router();

// GET /api/summary?period=x
// Returns the OpenAI summary for the requested period (1MO, 3MO, 6MO, 12MO)
router.get("/", async (req, res) => {
  let { period } = req.query;
  if (!period) {
    return res.status(400).json({ error: "Missing period query parameter. Use one of: 1MO, 3MO, 6MO, 12MO or 1, 3, 6, 12." });
  }
  // Allow both '1', '3', '6', '12' and '1MO', '3MO', ...
  period = period.toString().toUpperCase();
  if (["1", "3", "6", "12"].includes(period)) {
    period = period + "MO";
  }
  if (!["1MO", "3MO", "6MO", "12MO"].includes(period)) {
    return res.status(400).json({ error: "Invalid period. Use one of: 1MO, 3MO, 6MO, 12MO or 1, 3, 6, 12." });
  }
  try {
    const summary = await apiService.getSummaryByPeriod(period);
    if (summary == null) {
      return res.status(404).json({ error: "Summary not found for requested period." });
    }
    res.json({ period, summary });
  } catch (err) {
    console.error("[summary.js] Error fetching summary:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
