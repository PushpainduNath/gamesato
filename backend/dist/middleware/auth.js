"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireAdmin = requireAdmin;
exports.requireSuperAdmin = requireSuperAdmin;
exports.optionalAuthenticate = optionalAuthenticate;
exports.authenticateAdmin = authenticateAdmin;
const db_1 = require("../config/db");
// Helper to extract cookie value by name
function getCookie(cookieHeader, name) {
    if (!cookieHeader)
        return null;
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
        const [key, val] = cookie.trim().split('=');
        if (key === name || key === `__Secure-${name}`) {
            return val ? decodeURIComponent(val) : null;
        }
    }
    return null;
}
/**
 * Middleware to authenticate requests based on NextAuth session token
 */
async function authenticate(req, res, next) {
    try {
        // 1. Check Bearer token first (used for Admin Portal API calls)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                const userResult = await db_1.pool.query('SELECT id, name, email, role, is_blocked FROM admin_users WHERE id = $1', [decoded.id]);
                if (userResult.rows.length > 0) {
                    const user = userResult.rows[0];
                    if (user.is_blocked) {
                        return res.status(403).json({ error: 'Your account has been blocked by the administrator.' });
                    }
                    req.user = {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        image: null,
                        role: user.role
                    };
                    return next();
                }
            }
            catch (jwtErr) {
                if (jwtErr?.name === 'TokenExpiredError') {
                    console.warn('JWT token expired in authenticate');
                }
                else {
                    console.error('JWT verification failed in authenticate:', jwtErr);
                }
            }
        }
        // 2. Fallback to NextAuth session cookie (used for public site users)
        const sessionToken = getCookie(req.headers.cookie, 'next-auth.session-token');
        if (sessionToken) {
            try {
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3021';
                const sessionRes = await fetch(`${frontendUrl}/api/auth/session`, {
                    headers: {
                        cookie: req.headers.cookie || '',
                    },
                });
                if (sessionRes.ok) {
                    const sessionData = await sessionRes.json();
                    if (sessionData && sessionData.user && sessionData.user.id) {
                        const userResult = await db_1.pool.query("SELECT id, name, email, image, 'USER'::varchar as role, is_blocked FROM users WHERE id = $1", [sessionData.user.id]);
                        if (userResult.rows.length > 0) {
                            const user = userResult.rows[0];
                            if (user.is_blocked) {
                                return res.status(403).json({ error: 'Your account has been blocked by the administrator.' });
                            }
                            req.user = {
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                image: user.image,
                                role: user.role
                            };
                            return next();
                        }
                    }
                }
            }
            catch (sessionErr) {
                console.error('Error verifying NextAuth session via frontend:', sessionErr);
            }
        }
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing session' });
    }
    catch (err) {
        console.error('Error in authenticate middleware:', err);
        res.status(500).json({ error: 'Internal server error during authentication' });
    }
}
/**
 * Middleware to restrict route to Admin or Super Admin
 */
function requireAdmin(req, res, next) {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
}
/**
 * Middleware to restrict route to Super Admin only
 */
function requireSuperAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Super Admin access required' });
    }
    next();
}
/**
 * Optional middleware to check session but not block unauthenticated users
 */
async function optionalAuthenticate(req, res, next) {
    try {
        const sessionToken = getCookie(req.headers.cookie, 'next-auth.session-token');
        if (!sessionToken) {
            return next();
        }
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3021';
        const sessionRes = await fetch(`${frontendUrl}/api/auth/session`, {
            headers: {
                cookie: req.headers.cookie || '',
            },
        });
        if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            if (sessionData && sessionData.user && sessionData.user.id) {
                const userResult = await db_1.pool.query("SELECT id, name, email, image, 'USER'::varchar as role, is_blocked FROM users WHERE id = $1", [sessionData.user.id]);
                if (userResult.rows.length > 0) {
                    const user = userResult.rows[0];
                    if (!user.is_blocked) {
                        req.user = {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            image: user.image,
                            role: user.role
                        };
                    }
                }
            }
        }
        next();
    }
    catch (err) {
        console.error('Error in optionalAuthenticate middleware:', err);
        next(); // don't block
    }
}
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'gamebite-admin-secret-key-12345';
function authenticateAdmin(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: Admin token missing' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.id,
            name: decoded.name || null,
            email: decoded.email,
            image: null,
            role: decoded.role,
        };
        next();
    }
    catch (err) {
        console.error('Error in authenticateAdmin middleware:', err);
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired admin token' });
    }
}
