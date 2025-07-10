// Middleware to require date range or period for analytics endpoints
export function requireDateRange(req, res, next) {
  const { period, rollingWindow, startDate, endDate } = req.query;
  if (
    period || rollingWindow || (startDate && endDate)
  ) {
    return next();
  }
  return res.status(400).json({ error: "No period for filtering entered. Add a parameter ?period={months}, where \"months\" can be 1, 3, 6, or 12." });
}
