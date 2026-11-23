import { Pool } from 'pg';

// Prevent multiple Pool instances in development due to hot module reloading
const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://afridi:afridi123@localhost:5432/afridi_inn',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}

export default pool;
