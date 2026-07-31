"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error('DATABASE_URL is not set in environment variables');
    process.exit(1);
}
exports.pool = new pg_1.Pool({
    connectionString: databaseUrl,
});
exports.pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
});
const query = (text, params) => {
    return exports.pool.query(text, params);
};
exports.query = query;
