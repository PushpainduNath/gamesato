const { Client } = require('pg');
require('dotenv').config({ path: '/Users/pushpaindunath/Desktop/Gamesato/gb-project/backend/.env' });

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    const result = await client.query('SELECT id, title, slug, thumbnail_url FROM games');
    console.log('Games catalogue:');
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error('Error fetching games:', err);
  } finally {
    await client.end();
  }
}

run();
