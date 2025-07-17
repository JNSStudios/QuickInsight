import apiService from "./APIService.js";

// Centralized cache logic for demo: checks DB, updates if needed, returns data
export async function getOrUpdateCache(options = {}) {
  return await apiService.getAllData(options);
}
import pg from 'pg';
import env from "dotenv";

// connect to database
env.config();

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

db.connect()  
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error', err.stack));

export default db;

