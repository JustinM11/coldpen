import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const migration = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) DEFAULT '',
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    generations_today       INT DEFAULT 0,
    last_generation_date    DATE,
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS emails (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID REFERENCES users(id) ON DELETE CASCADE,
    product_description   TEXT NOT NULL,
    target_audience       TEXT NOT NULL,
    tone                  VARCHAR(50) NOT NULL,
    cta_goal              TEXT NOT NULL,
    variations            JSONB NOT NULL,
    is_favorited          BOOLEAN DEFAULT false,
    copied_count          INT DEFAULT 0,
    created_at            TIMESTAMP DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
  CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_emails_favorited ON emails(user_id, is_favorited) WHERE is_favorited = true;
  CREATE INDEX IF NOT EXISTS idx_users_clerk ON users(clerk_id);
`;

async function run() {
  console.log("Running database migration...");
  try {
    await pool.query(migration);
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
