import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Allow build-time import in environments without DB configured yet.
  console.warn("DATABASE_URL is not set. Database calls will fail at runtime.");
}

const sql = neon(connectionString || "postgresql://placeholder:placeholder@placeholder/placeholder");
export const db = drizzle(sql, { schema });
