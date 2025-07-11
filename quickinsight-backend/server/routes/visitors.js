import express from "express";
import { getGaSummary, getLatestDayVisitors } from "../services/gaService.js";
import { requireDateRange } from "./requireDateRange.js";

const router = express.Router();

router.get("/", requireDateRange, async (req, res, next) => {
  try {
    const { startDate, endDate, rollingWindow, period, latestDay } = req.query;
    const options = {
      startDate,
      endDate,
      rollingWindow: rollingWindow === 'true',
      period
    };
    if (latestDay === 'true') {
      const { visitors } = await getLatestDayVisitors(options);
      return res.json({
        value: visitors,
        unit: '',
        updatedAt: new Date().toISOString()
      });
    }
    console.log("Calling getGaSummary with options:", options);
    const { visitors } = await getGaSummary(options);
    res.json({
      value: visitors,
      unit: "",
      updatedAt: new Date().toISOString()
    });
  } catch (e) { next(e); }
});

export default router;