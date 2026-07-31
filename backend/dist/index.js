"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const games_1 = __importDefault(require("./routes/games"));
const admin_1 = __importDefault(require("./routes/admin"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const categories_1 = __importDefault(require("./routes/categories"));
const analyticsWorker_1 = require("./workers/analyticsWorker");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const GAMES_DIR = process.env.GAMES_DIR || path_1.default.join(__dirname, '../../gb-games');
// CORS configuration to support credentialed requests (cookies) from Next.js
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use((0, cors_1.default)({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));
// Body parsers
app.use(express_1.default.json({ limit: '500mb' }));
app.use(express_1.default.urlencoded({ limit: '500mb', extended: true }));
// Serve game H5 builds statically
app.use('/games', express_1.default.static(GAMES_DIR));
// Serve thumbnails and uploads statically
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Routes mapping
app.use('/api/games', games_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api/categories', categories_1.default);
// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', server: 'Gamebite Express' });
});
// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Application Error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});
// Start server
const server = app.listen(PORT, () => {
    console.log(`[Gamebite Server] Running on http://localhost:${PORT}`);
    // Start the background Redis analytics worker
    (0, analyticsWorker_1.startAnalyticsWorker)();
});
// Handle graceful shutdown
const gracefulShutdown = () => {
    console.log('Shutting down server gracefully...');
    (0, analyticsWorker_1.stopAnalyticsWorker)();
    server.close(() => {
        console.log('Express server closed.');
        process.exit(0);
    });
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
