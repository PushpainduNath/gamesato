const { Client } = require('pg');
require('dotenv').config({ path: '/Users/pushpaindunath/Desktop/Gamebite/gb-project/backend/.env' });

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database.');

    const query = `
      EXPLAIN ANALYZE
      SELECT g.id, g.title, g.slug, g.category, g.thumbnail_url, g.status, g.description, g.is_featured,
              g.featured_desktop_url, g.featured_mobile_url, g.game_page_icon_url,
              COALESCE(p.play_count, 0) as play_count,
              COALESCE(l.likes_count, 0) as likes_count,
              COALESCE(d.avg_duration, 0) as avg_duration
       FROM games g
       LEFT JOIN (
         SELECT "gameId", COUNT(*) as play_count
         FROM analytics_events
         WHERE event_type = 'play'
         GROUP BY "gameId"
       ) p ON p."gameId" = g.id
       LEFT JOIN (
         SELECT "gameId", COUNT(*) as likes_count
         FROM likes
         GROUP BY "gameId"
       ) l ON l."gameId" = g.id
       LEFT JOIN (
         SELECT "gameId", ROUND(AVG(duration_seconds)) as avg_duration
         FROM (
           SELECT "gameId", session_id,
                  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) AS duration_seconds
           FROM analytics_events
           WHERE session_id IS NOT NULL
           GROUP BY session_id, "gameId"
         ) sessions
         GROUP BY "gameId"
       ) d ON d."gameId" = g.id
       ORDER BY play_count DESC;
    `;

    const start = Date.now();
    const res = await client.query(query);
    const duration = Date.now() - start;
    
    console.log(`Query ran in ${duration}ms`);
    console.log('Explain plan:');
    res.rows.forEach(r => console.log(r['QUERY PLAN']));

  } catch (err) {
    console.error('Error running explain:', err);
  } finally {
    await client.end();
  }
}

run();
