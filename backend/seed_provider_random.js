const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database.');

    // Fetch all users to update their provider field if it is null
    const res = await client.query('SELECT id, provider FROM users');
    const users = res.rows;
    console.log(`Found ${users.length} users in database.`);

    const providers = ['google', 'facebook', 'discord'];
    let updateCount = 0;

    for (const user of users) {
      if (!user.provider) {
        const randomProvider = providers[Math.floor(Math.random() * providers.length)];
        await client.query('UPDATE users SET provider = $1 WHERE id = $2', [randomProvider, user.id]);
        updateCount++;
      }
    }

    console.log(`Successfully updated ${updateCount} users with random providers.`);
  } catch (err) {
    console.error('Error running random provider update:', err);
  } finally {
    await client.end();
  }
}

run();
