import { USE_MOCK, loadJson, toDollars } from "./utilities.js";
import { fromUnixTime, formatISO } from "date-fns";
import Stripe from "stripe";


// STANDARD FUNCTIONS

// returns a summary of Stripe activity (either mock or live depending on USE_MOCK)
export async function getStripeSummary(options = {}) {
  return USE_MOCK ? mock.getSummary() : live.getSummary(options);
}

// calculates and returns the refund rate (either mock or live depending on USE_MOCK)
export async function getRefundRate(options = {}) {
  return USE_MOCK ? mock.getRefundRate() : live.getRefundRate(options);
}

// returns a time series of daily revenue and orders (either mock or live depending on USE_MOCK)
export async function getTimeSeries(options = {}) {
  return USE_MOCK ? mock.getTimeSeries() : live.getTimeSeries(options);
}

// identifies and returns the top-sold item (either mock or live depending on USE_MOCK)
export async function getTopItem(options = {}) {
  return USE_MOCK ? mock.getTopItem() : live.getTopItem(options);
}

//--------------------------------------------------------------

// mock data from local JSON files
const mock = {
  // Helper to get the last date in the mock charges data (used as 'today')
  async getMockTodayISO() {
    const charges = await loadJson("stripe_charges_nov-jan.json");
    const maxCreated = Math.max(...charges.data.map(c => c.created));
    return formatISO(fromUnixTime(maxCreated), { representation: "date" });
  },

  // Helper to get start/end dates from options, using mock 'today'
  async getDateRange(options = {}) {
    const { startDate, endDate, rollingWindow, period } = options || {};
    const today = await this.getMockTodayISO();
    let start = startDate, end = endDate;
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
      const endDateObj = new Date(end);
      const startDateObj = new Date(endDateObj.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
      start = formatISO(startDateObj, { representation: "date" });
    }
    return { start, end };
  },

  async getSummary(options = {}) {
    try {
      const { start, end } = await this.getDateRange(options);
      const charges = await loadJson("stripe_charges_nov-jan.json");
      const refunds = await loadJson("stripe_refunds.json");
      // Find the earliest and latest charge dates in the mock data
      const allDates = charges.data.map(c => formatISO(fromUnixTime(c.created), { representation: "date" }));
      const minDate = allDates.sort()[0];
      const maxDate = allDates.sort().slice(-1)[0];
      // Calculate the number of days in the requested range and in the mock data
      const rangeDays = Math.max(1, Math.round((new Date(end) - new Date(start)) / (24 * 60 * 60 * 1000)) + 1);
      const mockDays = Math.max(1, Math.round((new Date(maxDate) - new Date(minDate)) / (24 * 60 * 60 * 1000)) + 1);
      const scale = Math.min(1, rangeDays / mockDays);
      // Scale the gross, refunded, and orders by the date range
      const gross    = Math.round(sumAmounts(charges) * scale);
      const refunded = Math.round(sumAmounts(refunds) * scale);
      const orders   = Math.round(charges.data.length * scale);
      return {
        gross:    toDollars(gross),
        refunded: toDollars(refunded),
        net:      toDollars(gross - refunded),
        orders,
      };
    } catch (err) {
      console.error("Mock data error:", err);
      throw new Error("Unable to load mock Stripe data");
    }
  },

  async getRefundRate(options = {}) {
    try {
      const { start, end } = await this.getDateRange(options);
      const [charges, refunds] = await Promise.all([
        loadJson("stripe_charges_nov-jan.json"),
        loadJson("stripe_refunds.json"),
      ]);
      const filteredCharges = charges.data.filter(c => {
        const day = formatISO(fromUnixTime(c.created), { representation: "date" });
        return (!start || day >= start) && (!end || day <= end);
      });
      const filteredRefunds = refunds.data.filter(r => {
        const day = formatISO(fromUnixTime(r.created), { representation: "date" });
        return (!start || day >= start) && (!end || day <= end);
      });
      const chargeCount  = filteredCharges.length;
      const refundCount  = filteredRefunds.length;
      const rate         = chargeCount > 0 ? +(refundCount / chargeCount * 100).toFixed(2) : 0;
      return { refundCount, chargeCount, rate };
    } catch (err) {
      console.error("Mock data error:", err);
      throw new Error("Unable to load mock refund data");
    }
  },

  async getTimeSeries(options = {}) {
    try {
      const { start, end } = await this.getDateRange(options);
      const charges = await loadJson("stripe_charges_nov-jan.json");
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
                   }));
    } catch (err) {
      console.error("Mock data error:", err);
      throw new Error("Unable to load mock time series data");
    }
  },

  async getTopItem(options = {}) {
    try {
      const { start, end } = await this.getDateRange(options);
      const pis = await loadJson("stripe_paymentIntents_items.json");
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
      if (counts.size === 0) return { sku: null, units: 0 };
      const [sku, units] = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])[0];                   // max by units
      return { sku, units };                               // "Zip Hoodie", 256
    } catch (err) {
      console.error("Mock data error:", err);
      throw new Error("Unable to load mock top item data");
    }
  },
};

// ------------------------------------------------------------

// live data from Stripe API (not used in demo, but here for completeness)
// Initialize Stripe only when needed (lazy loading)
let stripe = null;
function getStripeInstance() {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET) {
      throw new Error("STRIPE_SECRET is required when USE_MOCK=false");
    }
    stripe = new Stripe(process.env.STRIPE_SECRET);
  }
  return stripe;
}

// --- LIVE MODE CACHING ---
let stripeCache = null;
let stripeCachePromise = null;

async function fetchAndCacheStripeData() {
  if (stripeCache) return stripeCache;
  if (stripeCachePromise) return stripeCachePromise;
  stripeCachePromise = (async () => {
    const stripeInstance = getStripeInstance();
    const startUnix = getUnixNDaysAgo(395); // 13 months ≈ 395 days
    const endUnix = Math.floor(Date.now() / 1000);
    // Fetch all charges
    const charges = await stripeInstance.charges.list({ limit: 10000, created: { gte: startUnix, lte: endUnix } }).autoPagingToArray();
    // Fetch all refunds
    const refunds = await stripeInstance.refunds.list({ limit: 10000, created: { gte: startUnix, lte: endUnix } }).autoPagingToArray();
    // Fetch all payment intents (for top item)
    const paymentIntents = await stripeInstance.paymentIntents.list({ limit: 10000, created: { gte: startUnix, lte: endUnix } }).autoPagingToArray();
    // Note: To get line items, you would need to fetch each payment intent's line items separately (not implemented here)
    // Build time series
    const buckets = {};
    for (const c of charges) {
      const day = formatISO(fromUnixTime(c.created), { representation: "date" });
      if (!buckets[day]) buckets[day] = { revenue: 0, orders: 0, date: day };
      buckets[day].revenue += c.amount;
      buckets[day].orders += 1;
    }
    const timeSeries = Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date)).map(row => ({
      date: row.date,
      revenue: toDollars(row.revenue),
      orders: row.orders,
    }));
    return stripeCache = { charges, refunds, paymentIntents, timeSeries };
  })();
  return stripeCachePromise;
}

const live = {
  async getSummary(options = {}) {
    const cache = await fetchAndCacheStripeData();
    let { startDate, endDate, rollingWindow, period } = options;
    if (rollingWindow && period) {
      ({ start: startDate, end: endDate } = getRollingWindowDatesStripe(period));
    }
    const filtered = filterByDateRangeStripe(cache.timeSeries, startDate, endDate);
    const gross = filtered.reduce((sum, r) => sum + (parseFloat(r.revenue) || 0), 0);
    // Refunds: filter by date range
    // (Assume refund date is in created field)
    const refundBuckets = {};
    for (const r of cache.refunds) {
      const day = formatISO(fromUnixTime(r.created), { representation: "date" });
      if (day >= startDate && day <= endDate) {
        if (!refundBuckets[day]) refundBuckets[day] = 0;
        refundBuckets[day] += r.amount;
      }
    }
    const refunded = Object.values(refundBuckets).reduce((sum, amt) => sum + amt, 0) / 100;
    const net = gross - refunded;
    const orders = filtered.reduce((sum, r) => sum + (r.orders || 0), 0);
    return { gross, refunded, net, orders };
  },
  async getRefundRate(options = {}) {
    const cache = await fetchAndCacheStripeData();
    let { startDate, endDate, rollingWindow, period } = options;
    if (rollingWindow && period) {
      ({ start: startDate, end: endDate } = getRollingWindowDatesStripe(period));
    }
    // Charges and refunds in range
    const charges = cache.charges.filter(c => {
      const day = formatISO(fromUnixTime(c.created), { representation: "date" });
      return day >= startDate && day <= endDate;
    });
    const refunds = cache.refunds.filter(r => {
      const day = formatISO(fromUnixTime(r.created), { representation: "date" });
      return day >= startDate && day <= endDate;
    });
    const chargeCount = charges.length;
    const refundCount = refunds.length;
    const rate = chargeCount > 0 ? +(refundCount / chargeCount * 100).toFixed(2) : 0;
    return { refundCount, chargeCount, rate };
  },
  async getTimeSeries(options = {}) {
    const cache = await fetchAndCacheStripeData();
    let { startDate, endDate, rollingWindow, period } = options;
    if (rollingWindow && period) {
      ({ start: startDate, end: endDate } = getRollingWindowDatesStripe(period));
    }
    return filterByDateRangeStripe(cache.timeSeries, startDate, endDate);
  },
  async getTopItem(options = {}) {
    // Not fully implemented: would require fetching line items for each payment intent
    return { sku: "Live data not fully implemented", units: 0 };
  },
};

// Helper: get date N days ago in unix timestamp
function getUnixNDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return Math.floor(d.getTime() / 1000);
}
// Helper: get ISO date string for today
function getTodayISO() {
  return formatISO(new Date(), { representation: "date" });
}
// Helper: filter by date range
function filterByDateRangeStripe(data, startDate, endDate) {
  return data.filter(row => row.date >= startDate && row.date <= endDate);
}
// Helper: parse rolling window
function getRollingWindowDatesStripe(period) {
  const today = new Date();
  let days;
  switch (period) {
    case "1m": days = 30; break;
    case "3m": days = 90; break;
    case "6m": days = 180; break;
    case "12m": days = 365; break;
    default: days = 30;
  }
  const end = getTodayISO();
  const start = formatISO(new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000), { representation: "date" });
  return { start, end };
}

// helper functions
function sumAmounts(list) {
  return list.data.reduce((sum, item) => sum + item.amount, 0);
}
