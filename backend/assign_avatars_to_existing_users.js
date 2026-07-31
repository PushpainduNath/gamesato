require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://pushpaindunath@localhost:5432/gamebite'
});

async function assignRandomAvatars() {
  try {
    console.log('Connecting to database...');
    
    // Find users with no custom image or with default profile icon
    const res = await pool.query(`
      SELECT id, name, email, image 
      FROM users 
      WHERE image IS NULL OR image = '' OR image = '/defaultprofileicon.jpeg'
    `);

    console.log(`Found ${res.rows.length} existing users without a custom avatar.`);

    let updatedCount = 0;
    for (const user of res.rows) {
      const randomAvatarNum = Math.floor(Math.random() * 20) + 1;
      const avatarUrl = `/avatars/memo_${randomAvatarNum}.png`;

      await pool.query(
        'UPDATE users SET image = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [avatarUrl, user.id]
      );
      updatedCount++;
    }

    console.log(`Successfully assigned random memo avatars (1-20) to ${updatedCount} users!`);
  } catch (err) {
    console.error('Error assigning avatars:', err);
  } finally {
    await pool.end();
  }
}

assignRandomAvatars();
