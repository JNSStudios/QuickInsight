import express from "express";
import apiService from "../services/APIService.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { period, latestDay } = req.query;
    const gaSummary = await apiService.getGASummary({ period });
    if (latestDay === 'true') {
      const timeSeries = await apiService.getGATimeSeries({ period });
      const visitors = timeSeries && timeSeries.length > 0 ? timeSeries[timeSeries.length - 1].users : 0;
      return res.json({
        value: visitors,
        unit: '',
        updatedAt: new Date().toISOString()
      });
    }
    const { visitors } = gaSummary;
    res.json({
      value: visitors,
      unit: "",
      updatedAt: new Date().toISOString()
    });
  } catch (e) { next(e); }
});

export default router;