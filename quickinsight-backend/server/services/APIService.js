import { loadJson, toDollars } from "./utilities.js";
import env from "dotenv";
import { formatISO, fromUnixTime, parse, subMonths, subYears, endOfDay, startOfMonth } from "date-fns";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import Stripe from "stripe";
import db from "./database.js";


env.config();

// Centralized API service that replaces gaService and stripeService
export class APIService {
  constructor() {
    this.MOCK_USER_KEY = process.env.MOCK_USER_KEY || 'MOCKUSER';
  }

  // Main method: get all API data (cached or fresh)
  async getAllData() {
    // 1. Check if user exists in database
    let cachedEntry = null;
    try {
      const result = await db.query(
        'SELECT ga_data, stripe_data, last_saved FROM "CachedData" WHERE user_id = $1',
        [this.MOCK_USER_KEY]
      );
      if (result.rows.length > 0) {
        cachedEntry = result.rows[0];
      }
    } catch (err) {
      console.error('Error reading cache from database:', err);
    }
    // 2. Determine if we need fresh data
    if (this.shouldFetchFreshData(cachedEntry)) {
      // 3. Fetch fresh data from APIs
      const freshData = await this.fetchFreshAPIData();
      // 4. Write fresh data to database
      await this.writeToDatabase(freshData);
      return {
        gaData: freshData.gaData,
        stripeData: freshData.stripeData,
        cached: false,
        timestamp: new Date()
      };
    } else {
      // 3. Return cached data
      return {
        gaData: cachedEntry.ga_data,
        stripeData: cachedEntry.stripe_data,
        cached: true,
        timestamp: cachedEntry.last_saved
      };
    }
  }

  // Check if we should fetch fresh data based on hour comparison
  shouldFetchFreshData(cachedEntry) {
    // Force cache bypass if USE_CACHE_BYPASS is set to 'true'
    if (process.env.USE_CACHE_BYPASS === 'true') {
      console.log('[CACHE] USE_CACHE_BYPASS is true, forcing cache refresh');
      return true;
    }
    // If no cached entry exists, we need fresh data
    if (!cachedEntry) {
      return true;
    }
    const now = new Date();
    const lastSaved = new Date(cachedEntry.last_saved);
    // Compare by hour: if same year, month, date, and hour -> use cache
    if (
      lastSaved.getFullYear() === now.getFullYear() &&
      lastSaved.getMonth() === now.getMonth() &&
      lastSaved.getDate() === now.getDate() &&
      lastSaved.getHours() === now.getHours()
    ) {
      return false; // Use cached data
    }
    return true; // Need fresh data
  }

  // Fetch fresh data from both GA and Stripe APIs
  async fetchFreshAPIData() {
    console.log('Fetching fresh API data...');
    const [gaData, stripeData] = await Promise.all([
      this.fetchGAData(),
      this.fetchStripeData()
    ]);
    return { gaData, stripeData };
  }

  // ===== GA DATA METHODS =====
  async fetchGAData() {
    const [summary, trafficSources, timeSeries, topItems] = await Promise.all([
      this.getGASummary(),
      this.getGATrafficSources(),
      this.getGATimeSeries(),
      this.getGATopItems(10)
    ]);
    return {
      summary,
      trafficSources,
      timeSeries,
      topItems
    };
  }

  async fetchStripeData() {
    const [summary, refundRate, timeSeries, topItem] = await Promise.all([
      this.getStripeSummary(),
      this.getStripeRefundRate(),
      this.getStripeTimeSeries(),
      this.getStripeTopItem()
    ]);
    return {
      summary,
      refundRate,
      timeSeries,
      topItem
    };
  }

  // ===== CONVENIENCE METHODS FOR CACHED DATA ACCESS =====
  async getGAData() {
    const { gaData } = await this.getAllData();
    return gaData;
  }

  async getStripeData() {
    const { stripeData } = await this.getAllData();
    return stripeData;
  }

  // ===== DIRECT API METHODS =====

  async getGASummary({ period } = {}) {
    const useMock = (process.env.USE_MOCK || '').toLowerCase() === 'true';
    return useMock ? this.getGAMockSummary({ period }) : this.getGALiveSummary({ period });
  }

  async getGATrafficSources({ period } = {}) {
    const useMock = (process.env.USE_MOCK || '').toLowerCase() === 'true';
    return useMock ? this.getGAMockTrafficSources({ period }) : this.getGALiveTrafficSources({ period });
  }

  async getGATimeSeries({ period } = {}) {
    const useMock = (process.env.USE_MOCK || '').toLowerCase() === 'true';
    return useMock ? this.getGAMockTimeSeries({ period }) : this.getGALiveTimeSeries({ period });
  }

  async getGATopItems(limit = 10, { period } = {}) {
    const useMock = (process.env.USE_MOCK || '').toLowerCase() === 'true';
    return useMock ? this.getGAMockTopItems(limit, { period }) : this.getGALiveTopItems(limit, { period });
  }

  // ===== STRIPE DATA METHODS =====
  async getStripeSummary(options = {}) {
    const useMock = (process.env.USE_MOCK || '').toLowerCase() === 'true';
    return useMock ? this.getStripeMockSummary(options) : this.getStripeLiveSummary(options);
  }

  async getStripeRefundRate(options = {}) {
    const useMock = (process.env.USE_MOCK || '').toLowerCase() === 'true';
    return useMock ? this.getStripeMockRefundRate(options) : this.getStripeLiveRefundRate(options);
  }

  async getStripeTimeSeries(options = {}) {
    const useMock = (process.env.USE_MOCK || '').toLowerCase() === 'true';
    return useMock ? this.getStripeMockTimeSeries(options) : this.getStripeLiveTimeSeries(options);
  }

  async getStripeTopItem(options = {}) {
    const useMock = (process.env.USE_MOCK || '').toLowerCase() === 'true';
    return useMock ? this.getStripeMockTopItem(options) : this.getStripeLiveTopItem(options);
  }

  // ===== GA MOCK DATA METHODS =====
  async getGAMockSummary(options = {}) {
    try {
      const { startDate, endDate, period } = options || {};
      const ts = await loadJson("ga4_runReport_timeSeries.json");
      // Find the last date in the mock data
      const allDates = ts.rows.map(r => r.dimensionValues && r.dimensionValues[0] && r.dimensionValues[0].value).filter(Boolean);
      const lastDateStr = allDates.sort().slice(-1)[0];
      const lastDate = lastDateStr ? parse(lastDateStr, "yyyyMMdd", new Date()) : new Date();
      // Use lastDate as 'today' for mock calculations
      let start, end;
      if (period) {
        let days;
        switch (period) {
          case "1": days = 30; break;
          case "3": days = 90; break;
          case "6": days = 180; break;
          case "12": days = 365; break;
          default: days = 30;
        }
        end = formatISO(lastDate, { representation: "date" });
        const endDateObj = lastDate;
        const startDateObj = new Date(endDateObj.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
        start = formatISO(startDateObj, { representation: "date" });
        console.log(`[GA MOCK][getGAMockSummary] period: ${period}, start: ${start}, end: ${end}`);
      } else {
        const maxStart = new Date(lastDate.getTime() - 89 * 24 * 60 * 60 * 1000); // 90 days ago
        start = startDate ? new Date(startDate) : maxStart;
        end = endDate ? new Date(endDate) : lastDate;
        if (start < maxStart) start = maxStart;
        if (end > lastDate) end = lastDate;
        start = formatISO(start, { representation: "date" });
        end = formatISO(end, { representation: "date" });
        console.log(`[GA MOCK][getGAMockSummary] custom range, start: ${start}, end: ${end}`);
      }
      // Filter rows by date
      const filteredRows = ts.rows.filter(r => {
        if (!r.dimensionValues || r.dimensionValues.length === 0) return false;
        const d = parse(r.dimensionValues[0].value, "yyyyMMdd", new Date());
        const dISO = formatISO(d, { representation: "date" });
        return dISO >= start && dISO <= end;
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
  }

  async getGAMockTrafficSources(options = {}) {
    try {
      const { startDate, endDate, period } = options || {};
      const raw = await loadJson("ga4_runReport_trafficSources.json");
      // Find the last date in the mock data
      const allDates = raw.rows.map(r => r.dimensionValues && r.dimensionValues[0] && r.dimensionValues[0].value).filter(Boolean);
      const lastDateStr = allDates.sort().slice(-1)[0];
      const lastDate = lastDateStr ? parse(lastDateStr, "yyyyMMdd", new Date()) : new Date();
      let start, end;
      if (period) {
        let days;
        switch (period) {
          case "1": days = 30; break;
          case "3": days = 90; break;
          case "6": days = 180; break;
          case "12": days = 365; break;
          default: days = 30;
        }
        end = formatISO(lastDate, { representation: "date" });
        const endDateObj = lastDate;
        const startDateObj = new Date(endDateObj.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
        start = formatISO(startDateObj, { representation: "date" });
        console.log(`[GA MOCK][getGAMockTrafficSources] period: ${period}, start: ${start}, end: ${end}`);
      } else {
        const maxStart = new Date(lastDate.getTime() - 89 * 24 * 60 * 60 * 1000);
        start = startDate ? new Date(startDate) : maxStart;
        end = endDate ? new Date(endDate) : lastDate;
        if (start < maxStart) start = maxStart;
        if (end > lastDate) end = lastDate;
        start = formatISO(start, { representation: "date" });
        end = formatISO(end, { representation: "date" });
        console.log(`[GA MOCK][getGAMockTrafficSources] custom range, start: ${start}, end: ${end}`);
      }
      // Aggregate by source for the date range
      const agg = {};
      raw.rows.forEach(r => {
        if (!r.dimensionValues || r.dimensionValues.length < 2) return;
        const dateStr = r.dimensionValues[0].value;
        const source = r.dimensionValues[1].value;
        const d = parse(dateStr, "yyyyMMdd", new Date());
        const dISO = formatISO(d, { representation: "date" });
        if (dISO >= start && dISO <= end) {
          if (!agg[source]) agg[source] = { source, users: 0, purchases: 0 };
          if (r.metricValues && r.metricValues.length >= 2) {
            agg[source].users += +r.metricValues[0].value;
            agg[source].purchases += +r.metricValues[1].value;
          }
        }
      });
      return Object.values(agg);
    } catch (err) {
      console.error("Mock data error:", err);
      throw new Error("Unable to load mock GA traffic sources data");
    }
  }

  async getGAMockTimeSeries(options = {}) {
    try {
      const { period } = options || {};
      const ts = await loadJson("ga4_runReport_timeSeries.json");
      const allDates = ts.rows.map(r => r.dimensionValues && r.dimensionValues[0] && r.dimensionValues[0].value).filter(Boolean);
      const lastDateStr = allDates.sort().slice(-1)[0];
      const lastDate = lastDateStr ? parse(lastDateStr, "yyyyMMdd", new Date()) : new Date();
      let start, end;
      if (period) {
        ({ start, end } = this.getRollingWindowDates(period, lastDate));
        console.log(`[GA MOCK][getGAMockTimeSeries] period: ${period}, start: ${start}, end: ${end}`);
      } else {
        const maxStart = new Date(lastDate.getTime() - 89 * 24 * 60 * 60 * 1000);
        start = formatISO(maxStart, { representation: "date" });
        end = formatISO(lastDate, { representation: "date" });
        console.log(`[GA MOCK][getGAMockTimeSeries] custom range, start: ${start}, end: ${end}`);
      }
      return ts.rows
        .filter(r => {
          if (!r.dimensionValues || r.dimensionValues.length === 0) return false;
          const d = parse(r.dimensionValues[0].value, "yyyyMMdd", new Date());
          const dISO = formatISO(d, { representation: "date" });
          return dISO >= start && dISO <= end;
        })
        .map(r => {
          const d = parse(r.dimensionValues[0].value, "yyyyMMdd", new Date());
          return {
            date: formatISO(d, { representation: "date" }),
            users: r.metricValues && r.metricValues.length >= 1 ? +r.metricValues[0].value : 0,
            purchases: r.metricValues && r.metricValues.length >= 2 ? +r.metricValues[1].value : 0,
            revenue: r.metricValues && r.metricValues.length >= 3 ? +r.metricValues[2].value : 0,
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (err) {
      console.error("Mock data error:", err);
      throw new Error("Unable to load mock GA time series data");
    }
  }

  async getGAMockTopItems(limit = 10, options = {}) {
    try {
      const { period } = options || {};
      const raw = await loadJson("ga4_runReport_topItems.json");
      const allDates = raw.rows.map(r => r.dimensionValues && r.dimensionValues[0] && r.dimensionValues[0].value).filter(Boolean);
      const lastDateStr = allDates.sort().slice(-1)[0];
      const lastDate = lastDateStr ? parse(lastDateStr, "yyyyMMdd", new Date()) : new Date();
      let start, end;
      if (period) {
        ({ start, end } = this.getRollingWindowDates(period, lastDate));
        console.log(`[GA MOCK][getGAMockTopItems] period: ${period}, start: ${start}, end: ${end}`);
      } else {
        const maxStart = new Date(lastDate.getTime() - 89 * 24 * 60 * 60 * 1000);
        start = formatISO(maxStart, { representation: "date" });
        end = formatISO(lastDate, { representation: "date" });
        console.log(`[GA MOCK][getGAMockTopItems] custom range, start: ${start}, end: ${end}`);
      }
      const agg = {};
      raw.rows.forEach(r => {
        if (!r.dimensionValues || r.dimensionValues.length < 2) return;
        const dateStr = r.dimensionValues[0].value;
        const itemName = r.dimensionValues[1].value;
        if (itemName === '(not set)') return;
        const d = parse(dateStr, "yyyyMMdd", new Date());
        const dISO = formatISO(d, { representation: "date" });
        if (dISO >= start && dISO <= end) {
          if (!agg[itemName]) agg[itemName] = { name: itemName, quantity: 0, revenue: 0 };
          if (r.metricValues && r.metricValues.length >= 2) {
            agg[itemName].quantity += +r.metricValues[0].value;
            agg[itemName].revenue += +r.metricValues[1].value;
          }
        }
      });
      return Object.values(agg)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, limit);
    } catch (err) {
      console.error("Mock data error:", err);
      throw new Error("Unable to load mock GA top items data");
    }
  }

  // ===== STRIPE MOCK DATA METHODS =====
  async getStripeMockSummary(options = {}) {
    try {
      const { start, end } = await this.getStripeDateRange(options);
      const { period } = options || {};
      if (period) {
        console.log(`[STRIPE MOCK][getStripeMockSummary] period: ${period}, start: ${start}, end: ${end}`);
      } else {
        console.log(`[STRIPE MOCK][getStripeMockSummary] custom range, start: ${start}, end: ${end}`);
      }
      const charges = await loadJson("stripe_charges_nov-jan.json");
      const refunds = await loadJson("stripe_refunds.json");
      // Find first charge with currency
      const firstCharge = charges.data.find(c => c.currency);
      const currency = firstCharge ? firstCharge.currency : 'usd';
      // Find the earliest and latest charge dates in the mock data
      const allDates = charges.data.map(c => formatISO(fromUnixTime(c.created), { representation: "date" }));
      const minDate = allDates.sort()[0];
      const maxDate = allDates.sort().slice(-1)[0];
      // Calculate the number of days in the requested range and in the mock data
      const rangeDays = Math.max(1, Math.round((new Date(end) - new Date(start)) / (24 * 60 * 60 * 1000)) + 1);
      const mockDays = Math.max(1, Math.round((new Date(maxDate) - new Date(minDate)) / (24 * 60 * 60 * 1000)) + 1);
      const scale = Math.min(1, rangeDays / mockDays);
      // Scale the gross, refunded, and orders by the date range
      const gross    = Math.round(this.sumAmounts(charges) * scale);
      const refunded = Math.round(this.sumAmounts(refunds) * scale);
      const orders   = Math.round(charges.data.length * scale);
      return {
        gross:    toDollars(gross),
        refunded: toDollars(refunded),
        net:      toDollars(gross - refunded),
        orders,
        currency,
      };
    } catch (err) {
      console.error("Mock data error:", err);
      throw new Error("Unable to load mock Stripe data");
    }
  }

  async getStripeMockRefundRate(options = {}) {
    try {
      const { start, end } = await this.getStripeDateRange(options);
      const { period } = options || {};
      if (period) {
        console.log(`[STRIPE MOCK][getStripeMockRefundRate] period: ${period}, start: ${start}, end: ${end}`);
      } else {
        console.log(`[STRIPE MOCK][getStripeMockRefundRate] custom range, start: ${start}, end: ${end}`);
      }
      const [charges, refunds] = await Promise.all([
        loadJson("stripe_charges_nov-jan.json"),
        loadJson("stripe_refunds.json"),
      ]);
      // Find first charge with currency
      const firstCharge = charges.data.find(c => c.currency);
      const currency = firstCharge ? firstCharge.currency : 'usd';
      // Filter charges and refunds by date range
      const filteredCharges = charges.data.filter(c => {
        const day = formatISO(fromUnixTime(c.created), { representation: "date" });
        return (!start || day >= start) && (!end || day <= end);
      });
      const filteredRefunds = refunds.data.filter(r => {
        const day = formatISO(fromUnixTime(r.created), { representation: "date" });
        return (!start || day >= start) && (!end || day <= end);
      });
      const chargeCount = filteredCharges.length;
      const refundCount = filteredRefunds.length;
      const rate = chargeCount > 0 ? +(refundCount / chargeCount * 100).toFixed(2) : 0;
      return { refundCount, chargeCount, rate, currency };
    } catch (err) {
      console.error("Mock data error:", err);
      throw new Error("Unable to load mock refund data");
    }
  }

  async getStripeMockTimeSeries(options = {}) {
    try {
      const { start, end } = await this.getStripeDateRange(options);
      const { period } = options || {};
      if (period) {
        console.log(`[STRIPE MOCK][getStripeMockTimeSeries] period: ${period}, start: ${start}, end: ${end}`);
      } else {
        console.log(`[STRIPE MOCK][getStripeMockTimeSeries] custom range, start: ${start}, end: ${end}`);
      }
      const charges = await loadJson("stripe_charges_nov-jan.json");
      const firstCharge = charges.data.find(c => c.currency);
      const currency = firstCharge ? firstCharge.currency : 'usd';
      const buckets = {};          // key: ISO-date → { revenue, orders }
      for (const c of charges.data) {
        const day = formatISO(fromUnixTime(c.created), { representation: "date" });
        if ((!start || day >= start) && (!end || day <= end)) {
          if (!buckets[day]) buckets[day] = { revenue: 0, orders: 0 };
          buckets[day].revenue += c.amount;
          buckets[day].orders  += 1;
        }
      }
      // return an array sorted by date for easy plotting
      return Object.entries(buckets)
                   .sort(([d1], [d2]) => d1.localeCompare(d2))
                   .map(([date, { revenue, orders }]) => ({
                     date,
                     revenue: toDollars(revenue),
                     orders,
                     currency,
                   }));
    } catch (err) {
      console.error("Mock data error:", err);
      throw new Error("Unable to load mock time series data");
    }
  }

  async getStripeMockTopItem(options = {}) {
    try {
      const { start, end } = await this.getStripeDateRange(options);
      const { period } = options || {};
      if (period) {
        console.log(`[STRIPE MOCK][getStripeMockTopItem] period: ${period}, start: ${start}, end: ${end}`);
      } else {
        console.log(`[STRIPE MOCK][getStripeMockTopItem] custom range, start: ${start}, end: ${end}`);
      }
      const pis = await loadJson("stripe_paymentIntents_items.json");
      // Find first payment intent with currency
      const firstPI = pis.data.find(pi => pi.currency);
      const currency = firstPI ? firstPI.currency : 'usd';
      // SKU count → units sold (filtered by payment intent date)
      const counts = new Map();
      for (const pi of pis.data) {
        const day = formatISO(fromUnixTime(pi.created), { representation: "date" });
        if ((!start || day >= start) && (!end || day <= end)) {
          for (const li of pi.line_items) {
            counts.set(li.description, (counts.get(li.description) || 0) + 1);
          }
        }
      }
      if (counts.size === 0) return { sku: null, units: 0, currency };
      const [sku, units] = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])[0];                   // max by units
      return { sku, units, currency };               // "Zip Hoodie", 256
    } catch (err) {
      console.error("Mock data error:", err);
      throw new Error("Unable to load mock top item data");
    }
  }

  // ===== STRIPE HELPER METHODS =====
  async getStripeMockTodayISO() {
    const charges = await loadJson("stripe_charges_nov-jan.json");
    const maxCreated = Math.max(...charges.data.map(c => c.created));
    return formatISO(fromUnixTime(maxCreated), { representation: "date" });
  }

  async getStripeDateRange(options = {}) {
    const { startDate, endDate, period } = options || {};
    const today = await this.getStripeMockTodayISO();
    let start = startDate, end = endDate;
    if (period) {
      let days;
      switch (period) {
        case "1": days = 30; break;
        case "3": days = 90; break;
        case "6": days = 180; break;
        case "12": days = 365; break;
        default: days = 30;
      }
      end = today;
      const endDateObj = new Date(end);
      const startDateObj = new Date(endDateObj.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
      start = formatISO(startDateObj, { representation: "date" });
      console.log(`[STRIPE MOCK] period: ${period}, start: ${start}, end: ${end}`);
    } else {
      console.log(`[STRIPE MOCK] custom range, start: ${start}, end: ${end}`);
    }
    return { start, end };
  }

  sumAmounts(list) {
    return list.data.reduce((sum, item) => sum + item.amount, 0);
  }

  // ===== GA HELPER METHODS =====
  getRollingWindowDates(period, todayOverride) {
    // Use todayOverride for mock mode, otherwise use endOfDay(new Date())
    const today = todayOverride ? endOfDay(todayOverride) : endOfDay(new Date());
    let start;
    switch (period) {
      case "1":
        start = startOfMonth(subMonths(today, 0));
        break;
      case "3":
        start = startOfMonth(subMonths(today, 2));
        break;
      case "6":
        start = startOfMonth(subMonths(today, 5));
        break;
      case "12":
        start = startOfMonth(subMonths(today, 11));
        break;
      default:
        start = startOfMonth(subMonths(today, 0));
        break;
    }
    today.setHours(23,59,59,999);
    const startISO = formatISO(start, { representation: "date" });
    const endISO = formatISO(today, { representation: "date" });
    return { start: startISO, end: endISO };
  }

  // ===== LIVE DATA METHODS (PLACEHOLDER) =====
  async getGALiveSummary(options = {}) {
    // Placeholder for live GA implementation
    throw new Error("Live GA data not implemented");
  }

  async getGALiveTrafficSources(options = {}) {
    // Placeholder for live GA implementation
    throw new Error("Live GA data not implemented");
  }

  async getGALiveTimeSeries(options = {}) {
    // Placeholder for live GA implementation
    throw new Error("Live GA data not implemented");
  }

  async getGALiveTopItems(limit = 10, options = {}) {
    // Placeholder for live GA implementation
    throw new Error("Live GA data not implemented");
  }

  async getStripeLiveSummary(options = {}) {
    // Placeholder for live Stripe implementation
    throw new Error("Live Stripe data not implemented");
  }

  async getStripeLiveRefundRate(options = {}) {
    // Placeholder for live Stripe implementation
    throw new Error("Live Stripe data not implemented");
  }

  async getStripeLiveTimeSeries(options = {}) {
    // Placeholder for live Stripe implementation
    throw new Error("Live Stripe data not implemented");
  }

  async getStripeLiveTopItem(options = {}) {
    // Placeholder for live Stripe implementation
    throw new Error("Live Stripe data not implemented");
  }

  // Write fresh data to database
  async writeToDatabase({ gaData, stripeData }) {
    try {
      await db.query(
        `INSERT INTO "CachedData" (user_id, last_saved, ga_data, stripe_data)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) DO UPDATE
         SET last_saved = $2, ga_data = $3, stripe_data = $4`,
        [this.MOCK_USER_KEY, new Date(), gaData, stripeData]
      );
      console.log('Fresh data written to database');
    } catch (err) {
      console.error('Error writing to database:', err);
      throw err;
    }
  }

  // Helper methods for individual service data (if needed)
  async getGAData(options = {}) {
    const allData = await this.getAllData(options);
    return allData.gaData;
  }
}

export const apiService = new APIService();
export default apiService;
