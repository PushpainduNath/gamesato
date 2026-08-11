import { Router, Response } from 'express';
import { optionalAuthenticate, AuthenticatedRequest } from '../middleware/auth';
import { pool } from '../config/db';
import redis from '../config/redis';

const router = Router();
const QUEUE_KEY = 'gamesato:analytics:queue';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/analytics/event - Send analytics event (play, heartbeat)
 * Buffers event into Redis to keep main server lag-free.
 */
router.post('/event', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { gameId, eventType, sessionId } = req.body;

  if (!gameId || !eventType) {
    return res.status(400).json({ error: 'gameId and eventType are required' });
  }

  if (!UUID_REGEX.test(gameId)) {
    return res.status(400).json({ error: 'Invalid gameId UUID format' });
  }

  if (eventType !== 'play' && eventType !== 'heartbeat') {
    return res.status(400).json({ error: 'Invalid eventType, must be "play" or "heartbeat"' });
  }

  try {
    // Validate game existence to prevent FK errors and bad queue buffering
    const gameCheck = await pool.query('SELECT id FROM games WHERE id = $1', [gameId]);
    if (gameCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found or deleted' });
    }
    const event = {
      gameId,
      userId: req.user?.id || null,
      eventType,
      sessionId: sessionId || null,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || null,
      createdAt: new Date().toISOString(),
    };

    // Push event to Redis queue
    await redis.rpush(QUEUE_KEY, JSON.stringify(event));

    res.status(202).json({ status: 'buffered' });
  } catch (err) {
    console.error('Error buffering analytics event:', err);
    res.status(500).json({ error: 'Failed to buffer event' });
  }
});

export default router;
