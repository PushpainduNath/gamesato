const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables dynamically
dotenv.config({ path: path.join(__dirname, '.env') });

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database.');

    // 1. Optimize Database with Indexes
    console.log('Creating database indexes for query optimization...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
      CREATE INDEX IF NOT EXISTS idx_games_is_featured ON games(is_featured);
      CREATE INDEX IF NOT EXISTS idx_likes_gameId ON likes("gameId");
      CREATE INDEX IF NOT EXISTS idx_likes_userId ON likes("userId");
      CREATE INDEX IF NOT EXISTS idx_analytics_gameId ON analytics_events("gameId");
      CREATE INDEX IF NOT EXISTS idx_analytics_eventType ON analytics_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_analytics_sessionId ON analytics_events(session_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_createdAt ON analytics_events(created_at);
    `);
    console.log('Indexes created successfully.');

    // 2. Clear Old Test Data (leaving games & admin_users intact)
    console.log('Clearing old analytics, likes, and users...');
    await client.query('DELETE FROM analytics_events;');
    await client.query('DELETE FROM likes;');
    await client.query('DELETE FROM users;');
    console.log('Data cleared.');

    // 3. Seed 1100 Dummy Users
    console.log('Seeding 1100 dummy users...');
    await client.query(`
      INSERT INTO users (id, name, email, created_at, updated_at)
      SELECT 
        gen_random_uuid(),
        'User ' || i,
        'user' || i || '@example.com',
        NOW() - (random() * 30 || ' days')::interval,
        NOW() - (random() * 30 || ' days')::interval
      FROM generate_series(1, 1100) i;
    `);
    console.log('1100 users seeded successfully.');

    // 4. Seed Likes with custom count distribution
    console.log('Seeding likes with custom count distribution...');
    const usersResForLikes = await client.query('SELECT id, created_at FROM users ORDER BY created_at ASC');
    const usersForLikes = usersResForLikes.rows;
    
    const gamesResForLikes = await client.query('SELECT id, slug FROM games');
    const gamesForLikes = gamesResForLikes.rows;
    console.log('Games in DB:', gamesForLikes);

    if (gamesForLikes.length >= 3) {
      const cutCandy = gamesForLikes.find(g => g.slug === 'cut-the-candy') || gamesForLikes[0];
      const headSoccer = gamesForLikes.find(g => g.slug === 'head-soccer') || gamesForLikes[1];
      const subwayRiders = gamesForLikes.find(g => g.slug === 'subway-riders') || gamesForLikes[2];

      console.log(`Matching games:`);
      console.log(`- Cut The Candy: ID=${cutCandy.id}, Slug=${cutCandy.slug}`);
      console.log(`- Head Soccer: ID=${headSoccer.id}, Slug=${headSoccer.slug}`);
      console.log(`- Subway Riders: ID=${subwayRiders.id}, Slug=${subwayRiders.slug}`);

      const likesToInsert = [];

      // 1050 likes for Cut The Candy
      for (let i = 0; i < 1050; i++) {
        const u = usersForLikes[i];
        likesToInsert.push({
          userId: u.id,
          gameId: cutCandy.id,
          createdAt: new Date(new Date(u.created_at).getTime() + Math.random() * (Date.now() - new Date(u.created_at).getTime()))
        });
      }

      // 750 likes for Head Soccer
      for (let i = 0; i < 750; i++) {
        const u = usersForLikes[i];
        likesToInsert.push({
          userId: u.id,
          gameId: headSoccer.id,
          createdAt: new Date(new Date(u.created_at).getTime() + Math.random() * (Date.now() - new Date(u.created_at).getTime()))
        });
      }

      // 950 likes for Subway Riders
      for (let i = 0; i < 950; i++) {
        const u = usersForLikes[i];
        likesToInsert.push({
          userId: u.id,
          gameId: subwayRiders.id,
          createdAt: new Date(new Date(u.created_at).getTime() + Math.random() * (Date.now() - new Date(u.created_at).getTime()))
        });
      }

      // Bulk insert likes in batches of 1000
      const batchSize = 1000;
      for (let i = 0; i < likesToInsert.length; i += batchSize) {
        const batch = likesToInsert.slice(i, i + batchSize);
        const valueParams = [];
        const valuePlaceholders = [];
        
        batch.forEach((like, idx) => {
          const offset = idx * 3;
          valuePlaceholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
          valueParams.push(like.userId, like.gameId, like.createdAt);
        });

        await client.query(
          `INSERT INTO likes ("userId", "gameId", created_at) VALUES ${valuePlaceholders.join(', ')}`,
          valueParams
        );
      }
      console.log(`Successfully seeded ${likesToInsert.length} likes with customized distributions.`);
    } else {
      console.warn('Fewer than 3 games found. Seeding with basic CROSS JOIN instead.');
      await client.query(`
        INSERT INTO likes ("userId", "gameId", created_at)
        SELECT 
          u.id, 
          g.id,
          u.created_at + (random() * (NOW() - u.created_at))::interval
        FROM users u
        CROSS JOIN games g;
      `);
    }

    // 5. Seed Analytics Events
    console.log('Generating gameplay analytics sessions for the last 30 days...');
    
    const gamesRes = await client.query('SELECT id, slug FROM games');
    const gamesRows = gamesRes.rows;

    const usersRes = await client.query('SELECT id, created_at FROM users');
    const users = usersRes.rows;

    if (gamesRows.length === 0) {
      console.warn('Warning: No games in the database. Skipping analytics events seeding.');
      return;
    }

    const cutCandyId = gamesRows.find(g => g.slug === 'cut-the-candy')?.id || gamesRows[0]?.id;
    const headSoccerId = gamesRows.find(g => g.slug === 'head-soccer')?.id || gamesRows[1]?.id;
    const subwayRidersId = gamesRows.find(g => g.slug === 'subway-riders')?.id || gamesRows[2]?.id;

    const sessionCount = 800; // Number of sessions to generate
    const eventsToInsert = [];

    for (let s = 0; s < sessionCount; s++) {
      // Weighted distribution:
      // Cut Candy: ~60%
      // Head Soccer: ~30%
      // Subway Riders: ~10%
      let gameId;
      const rand = Math.random();
      if (rand < 0.60 && cutCandyId) {
        gameId = cutCandyId;
      } else if (rand < 0.90 && headSoccerId) {
        gameId = headSoccerId;
      } else {
        gameId = subwayRidersId || gamesRows[0]?.id;
      }
      
      const isAnonymous = Math.random() < 0.2;
      let userId = null;
      let userCreatedAt = null;

      if (!isAnonymous && users.length > 0) {
        const userIndex = Math.floor(Math.random() * users.length);
        userId = users[userIndex].id;
        userCreatedAt = new Date(users[userIndex].created_at);
      }

      const sessionId = uuidv4();
      
      const baseTime = userCreatedAt ? userCreatedAt.getTime() : Date.now() - 30 * 24 * 60 * 60 * 1000;
      const minStart = Math.max(baseTime, Date.now() - 30 * 24 * 60 * 60 * 1000);
      const startTimeMs = minStart + Math.random() * (Date.now() - minStart);
      const startTime = new Date(startTimeMs);

      // Duration: 1 to 20 pings (30 seconds to 10 minutes)
      const durationSeconds = 30 + Math.floor(Math.random() * 570);
      const pingCount = Math.floor(durationSeconds / 30);

      // 'play' event
      eventsToInsert.push({
        gameId,
        userId,
        event_type: 'play',
        session_id: sessionId,
        ip_address: `192.168.1.${Math.floor(Math.random() * 254)}`,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        created_at: startTime
      });

      // 'ping' events
      for (let p = 1; p <= pingCount; p++) {
        const pingTime = new Date(startTime.getTime() + p * 30 * 1000);
        if (pingTime.getTime() < Date.now()) {
          eventsToInsert.push({
            gameId,
            userId,
            event_type: 'ping',
            session_id: sessionId,
            ip_address: `192.168.1.${Math.floor(Math.random() * 254)}`,
            user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            created_at: pingTime
          });
        }
      }
    }

    console.log(`Generated ${eventsToInsert.length} total event records. Inserting into database in batches...`);

    const batchSize = 1000;
    for (let i = 0; i < eventsToInsert.length; i += batchSize) {
      const batch = eventsToInsert.slice(i, i + batchSize);
      const valueParams = [];
      const valuePlaceholders = [];
      
      batch.forEach((event, index) => {
        const offset = index * 7;
        valuePlaceholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`);
        valueParams.push(
          event.gameId,
          event.userId,
          event.event_type,
          event.session_id,
          event.ip_address,
          event.user_agent,
          event.created_at
        );
      });

      const queryText = `
        INSERT INTO analytics_events ("gameId", "userId", event_type, session_id, ip_address, user_agent, created_at)
        VALUES ${valuePlaceholders.join(', ')}
      `;

      await client.query(queryText, valueParams);
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(eventsToInsert.length / batchSize)}`);
    }

    console.log('Analytics events seeded successfully!');

    // 6. Sync cached play_counts in games table
    console.log('Syncing cached play_count in games table...');
    await client.query(`
      UPDATE games g
      SET play_count = COALESCE((
        SELECT COUNT(*)::int
        FROM analytics_events
        WHERE "gameId" = g.id AND event_type = 'play'
      ), 0)
    `);
    console.log('Games play_count cache synced.');
    
    console.log('Optimization and seeding completed successfully!');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await client.end();
  }
}

run();
