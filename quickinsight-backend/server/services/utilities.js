import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import 'dotenv/config';

// are we using the mock data? 
export const USE_MOCK = process.env.USE_MOCK === 'true';

// get the directory of this file's parent directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// path to the mock data directory 
const mockDir   = path.join(__dirname, "..", "mockData");   // adjust if renamed

// Cache for loaded JSON files to prevent repeated disk reads
const jsonCache = new Map();

// function for loading a JSON file representative of an API response
export async function loadJson(filename) {
  // Check if file is already cached
  if (jsonCache.has(filename)) {
    console.log(`[JSON CACHE] Using cached data for ${filename}`);
    return jsonCache.get(filename);
  }
  
  console.log(`[JSON CACHE] Loading fresh data for ${filename}`);
  const full = path.join(mockDir, filename);
  const data = JSON.parse(await fs.readFile(full, "utf-8"));
  
  // Cache the data
  jsonCache.set(filename, data);
  
  return data;
}

// Function to clear the JSON cache (useful for testing or when fresh data is needed)
export function clearJsonCache() {
  console.log('[JSON CACHE] Clearing cache');
  jsonCache.clear();
}

// handy cents➜dollars helper for Stripe
export const toDollars = (cents) => +(cents / 100).toFixed(2);
