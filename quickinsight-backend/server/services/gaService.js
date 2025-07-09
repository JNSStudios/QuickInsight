import { USE_MOCK, loadJson } from "./utilities.js";
import { formatISO, parse } from "date-fns";
import { BetaAnalyticsDataClient } from "@google-analytics/data";


// STANDARD FUNCTIONS

// returns a summary of Google Analytics activity (either mock or live depending on USE_MOCK)
export async function getGaSummary(options = {}) {
  return USE_MOCK ? mock.getSummary(options) : live.getSummary(options);
}

// returns traffic source data (either mock or live depending on USE_MOCK)
export async function getTrafficSources(options = {}) {
  return USE_MOCK ? mock.getTrafficSources(options) : live.getTrafficSources(options);
}

// returns a time series of daily users, purchases, and revenue (either mock or live depending on USE_MOCK)
export async function getTimeSeries(options = {}) {
  return USE_MOCK ? mock.getTimeSeries(options) : live.getTimeSeries(options);
}

// returns top items by quantity (either mock or live depending on USE_MOCK)
export async function getTopItems(limit = 10, options = {}) {
  return USE_MOCK ? mock.getTopItems(limit, options) : live.getTopItems(limit, options);
}


// mock data from local JSON files
const mock = {
  async getSummary(options = {}) {
    try {
      const { startDate, endDate, rollingWindow, period } = options || {};
      // console.log("Mock getSummary options:", options);
      const ts = await loadJson("ga4_runReport_timeSeries.json");
      // Find the last date in the mock data
      const allDates = ts.rows.map(r => r.dimensionValues && r.dimensionValues[0] && r.dimensionValues[0].value).filter(Boolean);
      const lastDateStr = allDates.sort().slice(-1)[0];
      const lastDate = lastDateStr ? parse(lastDateStr, "yyyyMMdd", new Date()) : new Date();
      // Use lastDate as 'today' for mock calculations
      let today = lastDate;
      let start, end;
      if (period) {
        // Use period to compute days
        let days;
        switch (period) {
          case "1m": days = 30; break;
          case "3m": days = 90; break;
          case "6m": days = 180; break;
          case "12m": days = 365; break;
          default: days = 30;
        }
        end = today;
        start = new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
      } else {
        console.log("No rolling window, using explicit dates or last 90 days");
        const maxStart = new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000); // 90 days ago
        start = startDate ? new Date(startDate) : maxStart;
        end = endDate ? new Date(endDate) : today;
        if (start < maxStart) start = maxStart;
        if (end > today) end = today;
      }
      // Filter rows by date
      const filteredRows = ts.rows.filter(r => {
        if (!r.dimensionValues || r.dimensionValues.length === 0) return false;
        const d = parse(r.dimensionValues[0].value, "yyyyMMdd", new Date());
        return d >= start && d <= end;
      });
      let visitors = 0, purchases = 0;
      filteredRows.forEach(r => {
        if (r.metricValues && r.metricValues.length >= 2) {
          visitors  += +r.metricValues[0].value;        // totalUsers
          purchases += +r.metricValues[1].value;        // purchases
        }
      });
      return { visitors, purchases };
    } catch (err) {
      console.error("Mock data error:", err);
      throw new Error("Unable to load mock GA summary data");
    }
  },

  async getTrafficSources(options = {}) {
    try {
      // Support date filtering for up to 3 months (90 days)
      const { startDate, endDate, rollingWindow, period } = options || {};
      // Load time series and traffic sources
      const ts = await loadJson("ga4_runReport_timeSeries.json");
      const raw = await loadJson("ga4_runReport_trafficSources.json");
      // Find the last date in the mock data
      const allDates = ts.rows.map(r => r.dimensionValues && r.dimensionValues[0] && r.dimensionValues[0].value).filter(Boolean);
      const lastDateStr = allDates.sort().slice(-1)[0];
      const lastDate = lastDateStr ? parse(lastDateStr, "yyyyMMdd", new Date()) : new Date();
      let today = lastDate;
      let start, end;
      if (period) {
        let days;
        switch (period) {
          case "1m": days = 30; break;
          case "3m": days = 90; break;
          case "6m": days = 180; break;
          case "12m": days = 365; break;
          default: days = 30;
        }
        end = today;
        start = new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
      } else {
        const maxStart = new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000); // 90 days ago
        start = startDate ? new Date(startDate) : maxStart;
        end = endDate ? new Date(endDate) : today;
        if (start < maxStart) start = maxStart;
        if (end > today) end = today;
      }
      // Simulate per-date aggregation by scaling users/purchases by the date range
      const rangeDays = Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1);
      const scale = Math.min(1, rangeDays / 90); // 90 days is the full mock period
      return raw.rows.map(r => ({
        source:     r.dimensionValues[0].value,
        users:      Math.round(+r.metricValues[0].value * scale),
        purchases:  Math.round(+r.metricValues[1].value * scale),
      }));
    } catch (err) {
      console.error("Mock data error:", err);
      throw new Error("Unable to load mock GA traffic sources data");
    }
  },

  async getTimeSeries(options = {}) {
    try {
      const { startDate, endDate, period } = options || {};
      const ts = await loadJson("ga4_runReport_timeSeries.json");
      // Find the last date in the mock data
      const allDates = ts.rows.map(r => r.dimensionValues && r.dimensionValues[0] && r.dimensionValues[0].value).filter(Boolean);
      const lastDateStr = allDates.sort().slice(-1)[0];
      const lastDate = lastDateStr ? parse(lastDateStr, "yyyyMMdd", new Date()) : new Date();
      let today = lastDate;
      let start, end;
      if (period) {
        let days;
        switch (period) {
          case "1m": days = 30; break;
          case "3m": days = 90; break;
          case "6m": days = 180; break;
          case "12m": days = 365; break;
          default: days = 30;
        }
        end = today;
        start = new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
      } else {
        const maxStart = new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000);
        start = startDate ? new Date(startDate) : maxStart;
        end = endDate ? new Date(endDate) : today;
        if (start < maxStart) start = maxStart;
        if (end > today) end = today;
      }
      return ts.rows
        .filter(r => {
          if (!r.dimensionValues || r.dimensionValues.length === 0 || r.metricValues.length < 3) return false;
          const d = parse(r.dimensionValues[0].value, "yyyyMMdd", new Date());
          return d >= start && d <= end;
        })
        .map(r => {
          const day = parse(r.dimensionValues[0].value, "yyyyMMdd", new Date());
          return {
            date: formatISO(day, { representation: "date" }),
            users: +r.metricValues[0].value,
            purchases: +r.metricValues[1].value,
            revenue: +r.metricValues[2].value,
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (err) {
      console.error("Mock data error:", err);
      throw new Error("Unable to load mock GA time series data");
    }
  },

  async getTopItems(limit = 10, options = {}) {
    try {
      const { startDate, endDate, period } = options || {};
      const ts = await loadJson("ga4_runReport_timeSeries.json");
      const raw = await loadJson("ga4_runReport_topItems.json");
      // Find the last date in the mock data
      const allDates = ts.rows.map(r => r.dimensionValues && r.dimensionValues[0] && r.dimensionValues[0].value).filter(Boolean);
      const lastDateStr = allDates.sort().slice(-1)[0];
      const lastDate = lastDateStr ? parse(lastDateStr, "yyyyMMdd", new Date()) : new Date();
      let today = lastDate;
      let start, end;
      if (period) {
        let days;
        switch (period) {
          case "1m": days = 30; break;
          case "3m": days = 90; break;
          case "6m": days = 180; break;
          case "12m": days = 365; break;
          default: days = 30;
        }
        end = today;
        start = new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
      } else {
        const maxStart = new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000);
        start = startDate ? new Date(startDate) : maxStart;
        end = endDate ? new Date(endDate) : today;
        if (start < maxStart) start = maxStart;
        if (end > today) end = today;
      }
      // If your top items mock has per-date data, filter and aggregate here.
      // For now, simulate per-date aggregation using the time series data if possible.
      // We'll use the topItems mock as a static list of possible items, and randomly assign sales to dates in the range.
      // But if you want more realism, you need per-date item sales in the mock.
      // Here, we'll just return the top N from the static mock, but scaled by the number of days in the range.
      // ---
      // If you want to simulate different results, shuffle or scale quantities by the date range length.
      // For now, let's scale the quantity and revenue by the fraction of the date range to 90 days (mock max).
      const rangeDays = Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1);
      const scale = Math.min(1, rangeDays / 90); // 90 days is the full mock period
      return raw.rows.slice(0, limit).map(r => ({
        name: r.dimensionValues[0].value,
        quantity: Math.round(+r.metricValues[0].value * scale),
        revenue: Math.round(+r.metricValues[1].value * scale),
      }));
    } catch (err) {
      console.error("Mock data error:", err);
      throw new Error("Unable to load mock GA top items data");
    }
  },
};

// live data from Google Analytics API (not used in demo, but here for completeness)
if (!USE_MOCK && !process.env.GA_PROPERTY_ID) {
  throw new Error("GA_PROPERTY_ID is required when USE_MOCK=false");
}
const gaClient = !USE_MOCK ? new BetaAnalyticsDataClient() : null;

const propertyPath = () => `properties/${process.env.GA_PROPERTY_ID}`;

// --- LIVE MODE CACHING ---
let gaCache = null;
let gaCachePromise = null;

async function fetchAndCacheGAData() {
  if (gaCache) return gaCache;
  if (gaCachePromise) return gaCachePromise;
  gaCachePromise = (async () => {
    const startDate = getDateNDaysAgo(395); // 13 months ≈ 395 days
    const endDate = formatISO(new Date(), { representation: "date" });
    // Fetch time series
    const [tsResp] = await gaClient.runReport({
      property: propertyPath(),
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "totalUsers" },
        { name: "purchases" },
        { name: "purchaseRevenue" },
      ],
      limit: 15000,
    });
    const timeSeries = tsResp.rows.map(row => ({
      date: formatISO(parse(row.dimensionValues[0].value, "yyyyMMdd", new Date()), { representation: "date" }),
      users: +row.metricValues[0].value,
      purchases: +row.metricValues[1].value,
      revenue: +row.metricValues[2].value,
    }));
    // Fetch top items
    const [itemsResp] = await gaClient.runReport({
      property: propertyPath(),
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "itemName" }],
      metrics: [{ name: "itemQuantity" }, { name: "itemRevenue" }],
      orderBys: [{ metric: { metricName: "itemQuantity" }, desc: true }],
      limit: 100,
    });
    const topItems = itemsResp.rows.map(r => ({
      name: r.dimensionValues[0].value,
      quantity: +r.metricValues[0].value,
      revenue: +r.metricValues[1].value,
    }));
    // Fetch traffic sources
    const [srcResp] = await gaClient.runReport({
      property: propertyPath(),
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionSource" }],
      metrics: [{ name: "totalUsers" }, { name: "purchases" }],
      limit: 1000,
    });
    const trafficSources = srcResp.rows.map(r => ({
      source: r.dimensionValues[0].value,
      users: +r.metricValues[0].value,
      purchases: +r.metricValues[1].value,
    }));
    return gaCache = { timeSeries, topItems, trafficSources };
  })();
  return gaCachePromise;
}

const live = {
  async getSummary(options = {}) {
    const cache = await fetchAndCacheGAData();
    let { startDate, endDate, rollingWindow, period } = options;
    if (rollingWindow && period) {
      ({ start: startDate, end: endDate } = getRollingWindowDates(period));
    }
    const filtered = filterByDateRange(cache.timeSeries, startDate, endDate);
    const visitors = filtered.reduce((sum, r) => sum + (r.users || 0), 0);
    const purchases = filtered.reduce((sum, r) => sum + (r.purchases || 0), 0);
    return { visitors, purchases };
  },
  async getTrafficSources(options = {}) {
    const cache = await fetchAndCacheGAData();
    // Optionally filter by date range if needed (not implemented in mock)
    return cache.trafficSources;
  },
  async getTimeSeries(options = {}) {
    const cache = await fetchAndCacheGAData();
    let { startDate, endDate, rollingWindow, period } = options;
    if (rollingWindow && period) {
      ({ start: startDate, end: endDate } = getRollingWindowDates(period));
    }
    return filterByDateRange(cache.timeSeries, startDate, endDate);
  },
  async getTopItems(limit = 10, options = {}) {
    const cache = await fetchAndCacheGAData();
    return cache.topItems.slice(0, limit);
  },
};

// Helper: get date N days ago in yyyy-MM-dd
function getDateNDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return formatISO(d, { representation: "date" });
}

// Helper: filter time series by date range
function filterByDateRange(data, startDate, endDate) {
  return data.filter(row => row.date >= startDate && row.date <= endDate);
}

// Helper: parse rolling window
function getRollingWindowDates(period) {
  const today = new Date();
  let days;
  switch (period) {
    case "1m": days = 30; break;
    case "3m": days = 90; break;
    case "6m": days = 180; break;
    case "12m": days = 365; break;
    default: days = 30;
  }
  const end = formatISO(today, { representation: "date" });
  const start = getDateNDaysAgo(days - 1);
  return { start, end };
}
