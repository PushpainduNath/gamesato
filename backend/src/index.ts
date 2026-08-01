import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import gamesRouter from './routes/games';
import adminRouter from './routes/admin';
import analyticsRouter from './routes/analytics';
import categoriesRouter from './routes/categories';
import { startAnalyticsWorker, stopAnalyticsWorker } from './workers/analyticsWorker';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const GAMES_DIR = process.env.GAMES_DIR || path.join(__dirname, '../../gb-games');

// CORS configuration to support credentialed requests (cookies) from Next.js
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://gamesato.com',
  'https://gamesato.pushpaindunath.cloud',
  'https://games.hypertechgames.com',
  'https://games.metaplaystudios.com',
  'http://localhost:3021',
  'http://localhost:3000'
].filter(Boolean) as string[];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

// Body parsers
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Serve game H5 builds statically
app.use('/games', express.static(GAMES_DIR));

// Serve thumbnails and uploads statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes mapping
app.use('/api/games', gamesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/categories', categoriesRouter);

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'Gamesato Express' });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`[Gamesato Server] Running on http://localhost:${PORT}`);
  
  // Start the background Redis analytics worker
  startAnalyticsWorker();
});

// Handle graceful shutdown
const gracefulShutdown = () => {
  console.log('Shutting down server gracefully...');
  stopAnalyticsWorker();
  server.close(() => {
    console.log('Express server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
