const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables dynamically
dotenv.config({ path: path.join(__dirname, '.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database.');

    console.log('Adding "provider" column to "users" table...');
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(50);
    `);
    console.log('Column "provider" added successfully.');

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

run();
