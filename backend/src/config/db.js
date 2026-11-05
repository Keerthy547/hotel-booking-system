
import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function connectPostgres() {
  const result = await pool.query("SELECT NOW()");

  console.log(
    "PostgreSQL connected successfully:",
    result.rows[0].now
  );
}
