"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const redis_1 = __importDefault(require("../config/redis"));
const router = (0, express_1.Router)();
const QUEUE_KEY = 'gamebite:analytics:queue';
/**
 * POST /api/analytics/event - Send analytics event (play, heartbeat)
 * Buffers event into Redis to keep main server lag-free.
 */
router.post('/event', auth_1.optionalAuthenticate, async (req, res) => {
    const { gameId, eventType, sessionId } = req.body;
    if (!gameId || !eventType) {
        return res.status(400).json({ error: 'gameId and eventType are required' });
    }
    if (eventType !== 'play' && eventType !== 'heartbeat') {
        return res.status(400).json({ error: 'Invalid eventType, must be "play" or "heartbeat"' });
    }
    try {
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
        await redis_1.default.rpush(QUEUE_KEY, JSON.stringify(event));
        res.status(202).json({ status: 'buffered' });
    }
    catch (err) {
        console.error('Error buffering analytics event:', err);
        res.status(500).json({ error: 'Failed to buffer event' });
    }
});
exports.default = router;
