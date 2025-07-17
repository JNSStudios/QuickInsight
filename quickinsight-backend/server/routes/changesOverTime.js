import express from "express";
import apiService from "../services/APIService.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { period } = req.query;
    const data = await apiService.getGATimeSeries({ period });
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
