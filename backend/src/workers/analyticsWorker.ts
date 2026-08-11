import redis from '../config/redis';
import { pool } from '../config/db';

const QUEUE_KEY = 'gamesato:analytics:queue';
const BATCH_SIZE = 100;
const TICK_INTERVAL = 10000; // 10 seconds
const MAX_RETRIES = 3;

export async function processAnalyticsBatch(): Promise<number> {
  try {
    const len = await redis.llen(QUEUE_KEY);
    if (len === 0) {
      return 0;
    }

    const batchSize = Math.min(len, BATCH_SIZE);
    
    // Pop batchSize items from the left of the queue
    const pipeline = redis.pipeline();
    for (let i = 0; i < batchSize; i++) {
      pipeline.lpop(QUEUE_KEY);
    }
    
    const results = await pipeline.exec();
    if (!results) return 0;

    const rawEvents: any[] = [];
    for (const result of results) {
      const [err, val] = result;
      if (!err && typeof val === 'string') {
        try {
          rawEvents.push(JSON.parse(val));
        } catch (parseErr) {
          console.error('Failed to parse analytics event JSON:', val);
        }
      }
    }

    if (rawEvents.length === 0) {
      return 0;
    }

    // 1. Extract unique gameIds and validate against database games table
    const uniqueGameIds = Array.from(new Set(rawEvents.map(e => e.gameId).filter(Boolean)));
    
    let validGameIdsSet = new Set<string>();
    if (uniqueGameIds.length > 0) {
      try {
        const dbCheckRes = await pool.query(
          'SELECT id FROM games WHERE id = ANY($1::uuid[])',
          [uniqueGameIds]
        );
        validGameIdsSet = new Set(dbCheckRes.rows.map(r => r.id));
      } catch (checkErr) {
        console.error('Error checking valid gameIds in analytics worker:', checkErr);
      }
    }

    // Filter out any events with invalid/deleted gameIds
    const validEvents = rawEvents.filter(e => e.gameId && validGameIdsSet.has(e.gameId));
    const droppedCount = rawEvents.length - validEvents.length;
    if (droppedCount > 0) {
      console.warn(`[Analytics Worker] Filtered out and dropped ${droppedCount} events with non-existent gameId(s).`);
    }

    if (validEvents.length === 0) {
      return rawEvents.length;
    }

    // 2. Bulk Insert valid events into database
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const values: any[] = [];
      const placeholders: string[] = [];
      
      validEvents.forEach((event, index) => {
        const offset = index * 7;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`);
        
        values.push(
          event.gameId,
          event.userId || null,
          event.eventType,
          event.sessionId || null,
          event.ipAddress || null,
          event.userAgent || null,
          event.createdAt ? new Date(event.createdAt) : new Date()
        );
      });

      const insertQuery = `
        INSERT INTO analytics_events ("gameId", "userId", event_type, session_id, ip_address, user_agent, created_at)
        VALUES ${placeholders.join(', ')}
      `;
      await client.query(insertQuery, values);

      // Increment play counts in games table for 'play' events
      const playEvents = validEvents.filter(e => e.eventType === 'play');
      if (playEvents.length > 0) {
        const playCountsByGame: { [gameId: string]: number } = {};
        playEvents.forEach(e => {
          playCountsByGame[e.gameId] = (playCountsByGame[e.gameId] || 0) + 1;
        });

        for (const [gameId, count] of Object.entries(playCountsByGame)) {
          await client.query(
            'UPDATE games SET play_count = play_count + $1 WHERE id = $2',
            [count, gameId]
          );
        }
      }

      await client.query('COMMIT');
      console.log(`[Analytics Worker] Successfully processed ${validEvents.length} valid events.`);
    } catch (dbErr) {
      await client.query('ROLLBACK');
      console.error('[Analytics Worker] Error executing database batch transaction:', dbErr);
      
      // Re-queue events back to Redis with retry limit
      const retryableEvents = validEvents.map(e => ({
        ...e,
        retryCount: (e.retryCount || 0) + 1
      })).filter(e => e.retryCount <= MAX_RETRIES);

      const expiredCount = validEvents.length - retryableEvents.length;
      if (expiredCount > 0) {
        console.warn(`[Analytics Worker] Permanently dropped ${expiredCount} events exceeding max retries (${MAX_RETRIES}).`);
      }

      if (retryableEvents.length > 0) {
        const reQueuePipeline = redis.pipeline();
        retryableEvents.forEach(event => {
          reQueuePipeline.rpush(QUEUE_KEY, JSON.stringify(event));
        });
        await reQueuePipeline.exec();
      }
    } finally {
      client.release();
    }

    return rawEvents.length;
  } catch (err) {
    console.error('Error in analytics background worker batch loop:', err);
    return 0;
  }
}

let workerInterval: NodeJS.Timeout | null = null;

export function startAnalyticsWorker() {
  if (workerInterval) return;
  
  console.log(`Starting Analytics Background Buffer Worker (Ticking every ${TICK_INTERVAL / 1000}s)`);
  workerInterval = setInterval(async () => {
    let processed = 0;
    do {
      processed = await processAnalyticsBatch();
    } while (processed >= BATCH_SIZE); // Keep pulling if queue has more than BATCH_SIZE items
  }, TICK_INTERVAL);
}

export function stopAnalyticsWorker() {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log('Analytics Background Buffer Worker stopped.');
  }
}
