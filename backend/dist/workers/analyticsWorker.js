"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAnalyticsBatch = processAnalyticsBatch;
exports.startAnalyticsWorker = startAnalyticsWorker;
exports.stopAnalyticsWorker = stopAnalyticsWorker;
const redis_1 = __importDefault(require("../config/redis"));
const db_1 = require("../config/db");
const QUEUE_KEY = 'gamebite:analytics:queue';
const BATCH_SIZE = 100;
const TICK_INTERVAL = 10000; // 10 seconds
async function processAnalyticsBatch() {
    try {
        const len = await redis_1.default.llen(QUEUE_KEY);
        if (len === 0) {
            return 0;
        }
        const batchSize = Math.min(len, BATCH_SIZE);
        // Pop batchSize items from the left of the queue
        const pipeline = redis_1.default.pipeline();
        for (let i = 0; i < batchSize; i++) {
            pipeline.lpop(QUEUE_KEY);
        }
        const results = await pipeline.exec();
        if (!results)
            return 0;
        const events = [];
        for (const result of results) {
            const [err, val] = result;
            if (!err && typeof val === 'string') {
                try {
                    events.push(JSON.parse(val));
                }
                catch (parseErr) {
                    console.error('Failed to parse analytics event:', val, parseErr);
                }
            }
        }
        if (events.length === 0) {
            return 0;
        }
        // Insert events in batch
        const client = await db_1.pool.connect();
        try {
            await client.query('BEGIN');
            // 1. Bulk Insert into analytics_events
            // SQL: INSERT INTO analytics_events ("gameId", "userId", event_type, session_id, ip_address, user_agent, created_at) VALUES ($1, $2, ...)
            const values = [];
            const placeholders = [];
            events.forEach((event, index) => {
                const offset = index * 7;
                placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`);
                values.push(event.gameId, event.userId || null, event.eventType, event.sessionId || null, event.ipAddress || null, event.userAgent || null, event.createdAt ? new Date(event.createdAt) : new Date());
            });
            const insertQuery = `
        INSERT INTO analytics_events ("gameId", "userId", event_type, session_id, ip_address, user_agent, created_at)
        VALUES ${placeholders.join(', ')}
      `;
            await client.query(insertQuery, values);
            // 2. Increment play counts in games table for 'play' events
            const playEvents = events.filter(e => e.eventType === 'play');
            if (playEvents.length > 0) {
                // Group by gameId and increment
                const playCountsByGame = {};
                playEvents.forEach(e => {
                    playCountsByGame[e.gameId] = (playCountsByGame[e.gameId] || 0) + 1;
                });
                for (const [gameId, count] of Object.entries(playCountsByGame)) {
                    await client.query('UPDATE games SET play_count = play_count + $1 WHERE id = $2', [count, gameId]);
                }
            }
            await client.query('COMMIT');
            console.log(`Successfully processed ${events.length} analytics events from Redis buffer.`);
        }
        catch (dbErr) {
            await client.query('ROLLBACK');
            console.error('Error executing database batch transaction in analytics worker:', dbErr);
            // Re-queue events back to Redis to prevent loss
            console.log(`Re-queuing ${events.length} events back to Redis...`);
            const reQueuePipeline = redis_1.default.pipeline();
            events.forEach(event => {
                reQueuePipeline.rpush(QUEUE_KEY, JSON.stringify(event));
            });
            await reQueuePipeline.exec();
        }
        finally {
            client.release();
        }
        return events.length;
    }
    catch (err) {
        console.error('Error in analytics background worker batch loop:', err);
        return 0;
    }
}
let workerInterval = null;
function startAnalyticsWorker() {
    if (workerInterval)
        return;
    console.log(`Starting Analytics Background Buffer Worker (Ticking every ${TICK_INTERVAL / 1000}s)`);
    workerInterval = setInterval(async () => {
        let processed = 0;
        do {
            processed = await processAnalyticsBatch();
        } while (processed >= BATCH_SIZE); // Keep pulling if queue has more than BATCH_SIZE items
    }, TICK_INTERVAL);
}
function stopAnalyticsWorker() {
    if (workerInterval) {
        clearInterval(workerInterval);
        workerInterval = null;
        console.log('Analytics Background Buffer Worker stopped.');
    }
}
