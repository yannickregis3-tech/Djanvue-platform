import "server-only";
import { Pool } from "pg";
const connectionString = process.env.DATABASE_URL;
if (!connectionString && process.env.NODE_ENV === "production") throw new Error("DATABASE_URL must be configured on the server.");
declare global { var __djanvuePgPool: Pool | undefined; }
export const db = globalThis.__djanvuePgPool ?? new Pool({ connectionString, max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : undefined });
if (process.env.NODE_ENV !== "production") globalThis.__djanvuePgPool = db;
