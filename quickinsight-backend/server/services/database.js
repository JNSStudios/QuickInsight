import apiService from "./APIService.js";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import pg from 'pg';
import env from "dotenv";

// connect to database
env.config();

async function getDBCreds() {
  console.log('Fetching DB credentials...');
  let user = "";
  let password = "";

  const useLocalProcessing = (process.env.USE_LOCAL_PROCESSING || '').toLowerCase() === 'true';

  if (process.env.RDS_USERPASS) {
    if (useLocalProcessing) {
      
      // Local: RDS_USERPASS is an ARN, fetch from Secrets Manager
      const sm = new SecretsManagerClient({ region: process.env.AWS_REGION });
      const { SecretString } = await sm.send(
        new GetSecretValueCommand({ SecretId: process.env.RDS_USERPASS })
      );
      const secret = JSON.parse(SecretString);
      user = secret.username;
      password = secret.password;
    } else {

      // AWS EB: RDS_USERPASS is the decoded secret JSON string
      try {
        const secret = JSON.parse(process.env.RDS_USERPASS);
        user = secret.username;
        password = secret.password;
      } catch (e) {
        throw new Error('Failed to parse RDS_USERPASS as JSON in AWS environment.');
      }
    }
  }

  if (!user || !password) {
    throw new Error('Database credentials are missing!');
  }
  return { user, password };
}

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

