const { Client } = require('pg');
require('dotenv').config({ path: '/Users/pushpaindunath/Desktop/Gamesato/gb-project/backend/.env' });

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database');
    await client.query('DROP TABLE IF EXISTS favorites CASCADE;');
    console.log('Successfully dropped favorites table');
  } catch (err) {
    console.error('Error dropping favorites table:', err);
  } finally {
    await client.end();
  }
}

run();
