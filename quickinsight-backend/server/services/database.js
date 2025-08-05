import apiService from "./APIService.js";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import pg from 'pg';
import env from "dotenv";

// connect to database
env.config();

async function getDBCreds() {
  let user = process.env.PG_USER;
  let password = process.env.PG_PASSWORD;

  // If you provided an ARN, fetch the JSON secret { username, password }
  if ((!user || !password) && process.env.RDS_SECRET_ARN) {
    const sm = new SecretsManagerClient({ region: process.env.AWS_REGION });
    const { SecretString } = await sm.send(
      new GetSecretValueCommand({ SecretId: process.env.RDS_SECRET_ARN })
    );
    const secret = JSON.parse(SecretString);
    user = secret.username;
    password = secret.password;
  }

  if (!user || !password) {
    throw new Error('Database credentials are missing!');
  }
  return { user, password };
}

// Top-level await works in ESM (Node 18+)
const { user, password } = await getDBCreds();

const db = new pg.Client({
  user,
  password,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  port: process.env.PG_PORT,
  ssl: { require: true, rejectUnauthorized: false },
});

// Centralized cache logic for demo: checks DB, updates if needed, returns data
export async function getOrUpdateCache(options = {}) {
  return await apiService.getAllData(options);
}

await db.connect();
console.log('Connected to PostgreSQL on RDS');

export default db;

