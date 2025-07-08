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


// function for loading a JSON file representative of an API response
export async function loadJson(filename) {
  const full = path.join(mockDir, filename);
  return JSON.parse(await fs.readFile(full, "utf-8"));
}

// handy cents➜dollars helper for Stripe
export const toDollars = (cents) => +(cents / 100).toFixed(2);
