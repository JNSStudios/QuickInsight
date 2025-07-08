import { USE_MOCK, loadJson } from "./utilities.js";
import { formatISO, parse } from "date-fns";
import { BetaAnalyticsDataClient } from "@google-analytics/data";


// STANDARD FUNCTIONS

// returns a summary of Google Analytics activity (either mock or live depending on USE_MOCK)
export async function getGaSummary() {
  return USE_MOCK ? mock.getSummary() : live.getSummary();
}

// returns traffic source data (either mock or live depending on USE_MOCK)
export async function getTrafficSources() {
  return USE_MOCK ? mock.getTrafficSources() : live.getTrafficSources();
}

// returns a time series of daily users, purchases, and revenue (either mock or live depending on USE_MOCK)
export async function getTimeSeries() {
  return USE_MOCK ? mock.getTimeSeries() : live.getTimeSeries();
}

// returns top items by quantity (either mock or live depending on USE_MOCK)
export async function getTopItems(limit = 10) {
  return USE_MOCK ? mock.getTopItems(limit) : live.getTopItems(limit);
}


// mock data from local JSON files
const mock = {
  async getSummary() {
    try {
      const ts = await loadJson("ga4_runReport_timeSeries.json");
      let visitors = 0, purchases = 0;
      
      // map the data from the JSON to the summary totals
      ts.rows.forEach(r => {
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

  async getTrafficSources() {
    try {
      const raw = await loadJson("ga4_runReport_trafficSources.json");
      return raw.rows.map(r => ({
        source:     r.dimensionValues[0].value,       // "google", "(direct)", …
        users:      +r.metricValues[0].value,
        purchases:  +r.metricValues[1].value,
      }));
    } catch (err) {
      console.error("Mock data error:", err);
      throw new Error("Unable to load mock GA traffic sources data");
    }
  },

  async getTimeSeries() {
    try {
      const ts = await loadJson("ga4_runReport_timeSeries.json");
      return ts.rows
        .filter(r => r.dimensionValues && r.dimensionValues.length > 0 && r.metricValues && r.metricValues.length >= 3)
        .map(r => {
          // GA date comes as "YYYYMMDD"
          const day = parse(r.dimensionValues[0].value, "yyyyMMdd", new Date());
          return {
            date:       formatISO(day, { representation: "date" }),
            users:      +r.metricValues[0].value,
            purchases:  +r.metricValues[1].value,
            revenue:    +r.metricValues[2].value,      // already dollars
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (err) {
      console.error("Mock data error:", err);
      throw new Error("Unable to load mock GA time series data");
    }
  },

  async getTopItems(limit) {
    try {
      const raw = await loadJson("ga4_runReport_topItems.json");
      return raw.rows.slice(0, limit).map(r => ({
        name:     r.dimensionValues[0].value,
        quantity: +r.metricValues[0].value,
        revenue:  +r.metricValues[1].value,
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

const live = {
  async getSummary() {
    try {
      const [resp] = await gaClient.runReport({
        property: propertyPath(),
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics:    [{ name: "totalUsers" }, { name: "purchases" }],
      });
      
      const visitors  = resp.rows.length > 0 ? +resp.rows[0].metricValues[0].value : 0;
      const purchases = resp.rows.length > 0 ? +resp.rows[0].metricValues[1].value : 0;
      
      return { visitors, purchases };
    } catch (err) {
      console.error("Google Analytics error:", err);
      throw new Error("Unable to fetch GA summary data");
    }
  },

  async getTrafficSources() {
    try {
      const [resp] = await gaClient.runReport({
        property: propertyPath(),
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "sessionSource" }],
        metrics:    [{ name: "totalUsers" }, { name: "purchases" }],
        limit: 100,
      });
      
      return resp.rows.map(r => ({
        source:     r.dimensionValues[0].value,
        users:      +r.metricValues[0].value,
        purchases:  +r.metricValues[1].value,
      }));
    } catch (err) {
      console.error("Google Analytics error:", err);
      throw new Error("Unable to fetch GA traffic sources data");
    }
  },

  async getTimeSeries() {
    try {
      const [resp] = await gaClient.runReport({
        property: propertyPath(),
        dateRanges: [{ startDate: "90daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics:    [
          { name: "totalUsers" },
          { name: "purchases" },
          { name: "purchaseRevenue" },
        ],
        limit: 10000,
      });
      
      return resp.rows.map(row => ({
        date:      formatISO(parse(row.dimensionValues[0].value, "yyyyMMdd", new Date()), { representation: "date" }),
        users:     +row.metricValues[0].value,
        purchases: +row.metricValues[1].value,
        revenue:   +row.metricValues[2].value,
      }));
    } catch (err) {
      console.error("Google Analytics error:", err);
      throw new Error("Unable to fetch GA time series data");
    }
  },

  async getTopItems(limit) {
    try {
      const [resp] = await gaClient.runReport({
        property: propertyPath(),
        dateRanges: [{ startDate: "90daysAgo", endDate: "today" }],
        dimensions: [{ name: "itemName" }],
        metrics:    [{ name: "itemQuantity" }, { name: "itemRevenue" }],
        orderBys:   [{ metric: { metricName: "itemQuantity" }, desc: true }],
        limit,
      });
      
      return resp.rows.map(r => ({
        name:     r.dimensionValues[0].value,
        quantity: +r.metricValues[0].value,
        revenue:  +r.metricValues[1].value,
      }));
    } catch (err) {
      console.error("Google Analytics error:", err);
      throw new Error("Unable to fetch GA top items data");
    }
  },
};
