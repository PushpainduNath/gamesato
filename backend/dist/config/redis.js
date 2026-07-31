"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new ioredis_1.default(redisUrl);
redis.on('connect', () => {
    console.log('Successfully connected to Redis');
});
redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});
exports.default = redis;
