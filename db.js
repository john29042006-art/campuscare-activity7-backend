const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Add it to .env locally or the Render environment.');
}

// Render's internal Postgres URL generally doesn't need SSL. For providers
// requiring TLS, set DATABASE_SSL=true. Never disable certificate validation.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(process.env.DATABASE_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {})
});

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
    // The metadata marker prevents deleted records from reappearing at restart.
    // Only first deployment receives the eight sample records.
    const result = await client.query(
      "INSERT INTO app_metadata (key, value) VALUES ('initial_seed_complete', 'yes') " +
      'ON CONFLICT (key) DO NOTHING RETURNING key'
    );
    if (result.rowCount === 1) {
      const existing = await client.query('SELECT COUNT(*)::int AS count FROM records');
      if (existing.rows[0].count === 0) {
        await client.query(fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8'));
        console.log('Added eight demonstration records.');
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { pool, initializeDatabase };
