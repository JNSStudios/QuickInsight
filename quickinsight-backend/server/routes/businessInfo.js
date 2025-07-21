import express from "express";
import db from "../services/database.js";
import env from "dotenv";

env.config();

const router = express.Router();

// GET /api/business-info
// Returns the business name and industry from the PostgreSQL database
router.get("/", async (req, res) => {
    console.log("[businessInfo.js] Fetching business info... with key ", process.env.MOCK_USER_KEY);
  try {
    // Query the database for business information
    // Get the business info for the mock user (you may want to make this dynamic based on user authentication)
    const query = 'SELECT business_name, business_industry FROM "CachedData" WHERE user_id = $1';
    const result = await db.query(query, [process.env.MOCK_USER_KEY]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Business information not found." });
    }
    
    const businessInfo = result.rows[0];
    res.json({
      business_name: businessInfo.business_name,
      business_industry: businessInfo.business_industry
    });
  } catch (err) {
    console.error("[businessInfo.js] Error fetching business info:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
