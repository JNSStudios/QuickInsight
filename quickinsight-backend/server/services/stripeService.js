import { USE_MOCK, loadJson, toDollars } from "./utilities.js";
import { fromUnixTime, formatISO } from "date-fns";
import Stripe from "stripe";


// STANDARD FUNCTIONS

// returns a summary of Stripe activity (either mock or live depending on USE_MOCK)
export async function getStripeSummary() {
  return USE_MOCK ? mock.getSummary() : live.getSummary();
}

// calculates and returns the refund rate (either mock or live depending on USE_MOCK)
export async function getRefundRate() {
  return USE_MOCK ? mock.getRefundRate() : live.getRefundRate();
}

// returns a time series of daily revenue and orders (either mock or live depending on USE_MOCK)
export async function getTimeSeries() {
  return USE_MOCK ? mock.getTimeSeries() : live.getTimeSeries();
}

// identifies and returns the top-sold item (either mock or live depending on USE_MOCK)
export async function getTopItem() {
  return USE_MOCK ? mock.getTopItem() : live.getTopItem();
}

//--------------------------------------------------------------

// mock data from local JSON files
const mock = {
  async getSummary() {
    try {
      // get the charge and refund data from local files
      const charges = await loadJson("stripe_charges_nov-jan.json");
      const refunds = await loadJson("stripe_refunds.json");

      // calculate gross, refunded, net amounts (in cents) and number of orders
      const gross    = sumAmounts(charges);
      const refunded = sumAmounts(refunds);
      const orders   = charges.data.length;

      // return the summary with amounts converted to dollars
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

  async getRefundRate() {
    try {
      const [charges, refunds] = await Promise.all([
        loadJson("stripe_charges_nov-jan.json"),
        loadJson("stripe_refunds.json"),
      ]);

      const chargeCount  = charges.data.length;
      const refundCount  = refunds.data.length;
      const rate         = +(refundCount / chargeCount * 100).toFixed(2);

      return { refundCount, chargeCount, rate };
    } catch (err) {
      console.error("Mock data error:", err);
      throw new Error("Unable to load mock refund data");
    }
  },

  async getTimeSeries() {
    try {
      const charges = await loadJson("stripe_charges_nov-jan.json");

      const buckets = {};          // key: ISO-date → { revenue, orders }
      for (const c of charges.data) {
        const day = formatISO(fromUnixTime(c.created), { representation: "date" });
        if (!buckets[day]) buckets[day] = { revenue: 0, orders: 0 };
        buckets[day].revenue += c.amount;
        buckets[day].orders  += 1;
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

  async getTopItem() {
    try {
      const pis = await loadJson("stripe_paymentIntents_items.json");

      // SKU count → units sold
      const counts = new Map();          
      for (const pi of pis.data) {
        for (const li of pi.line_items) {
          counts.set(li.description, (counts.get(li.description) || 0) + 1);
        }
      }

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
if (!USE_MOCK && !process.env.STRIPE_SECRET) {
  throw new Error("STRIPE_SECRET is required when USE_MOCK=false");
}
const stripe = new Stripe(process.env.STRIPE_SECRET);

const live = {
  async getSummary() {
    try {
      const charges = await stripe.charges
        .list({ limit: 100 /* , created: { gte, lte } */ })
        .autoPagingToArray();
      const refunds = await stripe.refunds
        .list({ limit: 100 /* , created: { gte, lte } */ })
        .autoPagingToArray();

      const gross    = sumAmounts({ data: charges });
      const refunded = sumAmounts({ data: refunds });

      return {
        gross:    toDollars(gross),
        refunded: toDollars(refunded),
        net:      toDollars(gross - refunded),
        orders:   charges.length,
      };
    } catch (err) {
      console.error("Stripe error:", err);
      throw new Error("Unable to fetch Stripe data");
    }
  },

  async getRefundRate() {
    try {
      const charges = await stripe.charges
        .list({ limit: 100 /* , created: { gte, lte } */ })
        .autoPagingToArray();
      const refunds = await stripe.refunds
        .list({ limit: 100 /* , created: { gte, lte } */ })
        .autoPagingToArray();

      const chargeCount  = charges.length;
      const refundCount  = refunds.length;
      const rate         = +(refundCount / chargeCount * 100).toFixed(2);

      return { refundCount, chargeCount, rate };
    } catch (err) {
      console.error("Stripe error:", err);
      throw new Error("Unable to fetch Stripe refund data");
    }
  },

  async getTimeSeries() {
    try {
      const charges = await stripe.charges
        .list({ limit: 100 /* , created: { gte, lte } */ })
        .autoPagingToArray();

      const buckets = {};          // key: ISO-date → { revenue, orders }
      for (const c of charges) {
        const day = formatISO(fromUnixTime(c.created), { representation: "date" });
        if (!buckets[day]) buckets[day] = { revenue: 0, orders: 0 };
        buckets[day].revenue += c.amount;
        buckets[day].orders  += 1;
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
      console.error("Stripe error:", err);
      throw new Error("Unable to fetch Stripe time series data");
    }
  },

  async getTopItem() {
    try {
      // Note: This is a simplified implementation
      // In practice, you'd need to fetch payment intents with line items
      // which requires additional API calls or different endpoints
      const paymentIntents = await stripe.paymentIntents
        .list({ limit: 100 /* , created: { gte, lte } */ })
        .autoPagingToArray();

      console.warn("Live getTopItem() is simplified - full implementation would require fetching line items");
      return { sku: "Live data not fully implemented", units: 0 };
    } catch (err) {
      console.error("Stripe error:", err);
      throw new Error("Unable to fetch Stripe top item data");
    }
  },
};

// helper functions
function sumAmounts(list) {
  return list.data.reduce((sum, item) => sum + item.amount, 0);
}
