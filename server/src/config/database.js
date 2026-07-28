import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // Managed Postgres (Neon/Supabase/Render) requires TLS; local dev does not.
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err.message);
});

export const db = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};
