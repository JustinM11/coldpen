import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Managed Postgres (Neon/Supabase/Render) requires TLS; local dev does not.
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

const migration = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tables must be created before anything that references them (indexes,
-- triggers, ALTERs). email is intentionally nullable so social-login users
-- without an email can sign in; uniqueness is enforced by the partial index
-- below, not by a column constraint.
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255) DEFAULT '',
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    generations_today       INT DEFAULT 0,
    last_generation_date    DATE,
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW()
  );

-- For databases first created under an older schema where email was
-- NOT NULL / UNIQUE, relax those so social-login users without an email
-- can sign in. No-ops on a freshly created table.
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Enforce email uniqueness only for non-null, non-empty values.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
  ON users(email) WHERE email IS NOT NULL AND email <> '';

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

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

  -- Every list query filters by user_id and orders by created_at DESC, so the
  -- composite index serves both the filter and the sort in one pass.
  CREATE INDEX IF NOT EXISTS idx_emails_user_created ON emails(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_emails_favorited ON emails(user_id, is_favorited) WHERE is_favorited = true;

  -- Drop indexes from earlier schema versions that are now redundant:
  -- user_id alone is a prefix of the composite above; created_at alone is
  -- never queried without user_id; clerk_id already has a UNIQUE constraint
  -- (which creates its own index).
  DROP INDEX IF EXISTS idx_emails_user_id;
  DROP INDEX IF EXISTS idx_emails_created_at;
  DROP INDEX IF EXISTS idx_users_clerk;

  -- Older databases carry duplicate UNIQUE constraints on the Stripe columns
  -- (a named one plus the column constraint) — each is a second index that
  -- every user write must maintain. Keep the column-constraint versions.
  ALTER TABLE users DROP CONSTRAINT IF EXISTS unique_stripe_customer;
  ALTER TABLE users DROP CONSTRAINT IF EXISTS unique_stripe_subscription;
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
