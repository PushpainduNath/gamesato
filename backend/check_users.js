const { Client } = require('pg');
require('dotenv').config({ path: '/Users/pushpaindunath/Desktop/Gamesato/gb-project/backend/.env' });

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    const result = await client.query('SELECT id, name, email, image FROM users');
    console.log('Registered gamers:');
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error('Error fetching users:', err);
  } finally {
    await client.end();
  }
}

run();
