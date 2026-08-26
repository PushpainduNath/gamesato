import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { authenticate, requireAdmin, requireSuperAdmin, AuthenticatedRequest } from '../middleware/auth';
import { pool } from '../config/db';
import { cleanOrphanedDirectories, hasGameBuildFiles } from '../utils/fileManager';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import redis from '../config/redis';

const JWT_SECRET = process.env.JWT_SECRET || 'gamesato-admin-secret-key-12345';

const router = Router();

/**
 * POST /api/admin/login - Authenticate admin credentials and return JWT
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body; // username represents the email

  if (!username || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, role, password_hash, is_blocked FROM admin_users WHERE email = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const admin = result.rows[0];
    
    // Verify block status
    if (admin.is_blocked) {
      return res.status(403).json({ error: 'Your account has been blocked by the administrator.' });
    }

    // Verify password hash
    if (!admin.password_hash) {
      return res.status(401).json({ error: 'No password set for this admin account' });
    }

    const isMatch = bcrypt.compareSync(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      }
    });
  } catch (err) {
    console.error('Error logging in admin:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

/**
 * GET /api/admin/dashboard - Fetch visual performance metrics and counters
 */
router.get('/dashboard', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { startDate, endDate } = req.query;
  const cacheKey = `admin:dashboard:${startDate || 'all'}:${endDate || 'all'}`;
  try {
    // 1. Try reading from Redis Cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Auto-unmark featured games that do not have BOTH desktop and mobile featured images
    await pool.query(`
      UPDATE games 
      SET is_featured = FALSE 
      WHERE is_featured = TRUE 
        AND (
          featured_desktop_url IS NULL OR featured_desktop_url = '' 
          OR featured_mobile_url IS NULL OR featured_mobile_url = ''
        )
    `);

    const hasFilter = !!(startDate && endDate);
    const params = hasFilter ? [startDate, endDate] : [];

    // Total Registered Gamers (from users table)
    const totalUsersQuery = hasFilter
      ? "SELECT COUNT(*) FROM users WHERE created_at >= $1::timestamp AND created_at <= $2::timestamp"
      : "SELECT COUNT(*) FROM users";
    const totalUsersRes = await pool.query(totalUsersQuery, params);
    
    // Total Games
    const totalGamesQuery = hasFilter
      ? "SELECT COUNT(*) FROM games WHERE created_at >= $1::timestamp AND created_at <= $2::timestamp"
      : "SELECT COUNT(*) FROM games";
    const totalGamesRes = await pool.query(totalGamesQuery, params);
    
    // Total Gameplay plays
    const totalPlaysQuery = hasFilter
      ? "SELECT COUNT(*) FROM analytics_events WHERE event_type = 'play' AND created_at >= $1::timestamp AND created_at <= $2::timestamp"
      : "SELECT COUNT(*) FROM analytics_events WHERE event_type = 'play'";
    const totalPlaysRes = await pool.query(totalPlaysQuery, params);

    // Global Average Play Duration (seconds)
    const avgDurationQuery = hasFilter
      ? `SELECT COALESCE(AVG(duration_seconds), 0) as avg_duration
         FROM (
           SELECT session_id,
                  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) AS duration_seconds
           FROM analytics_events
           WHERE session_id IS NOT NULL AND created_at >= $1::timestamp AND created_at <= $2::timestamp
           GROUP BY session_id
         ) t`
      : `SELECT COALESCE(AVG(duration_seconds), 0) as avg_duration
         FROM (
           SELECT session_id,
                  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) AS duration_seconds
           FROM analytics_events
           WHERE session_id IS NOT NULL
           GROUP BY session_id
         ) t`;
    const avgDurationRes = await pool.query(avgDurationQuery, params);
    const avgPlayDuration = Math.round(parseFloat(avgDurationRes.rows[0].avg_duration));

    // List of games with metrics including average duration per game
    const gamesStatsQuery = `
       SELECT g.id, g.title, g.slug, g.category, g.thumbnail_url, g.game_url, g.orientation, g.status, g.description, g.how_to_play, g.is_featured,
              g.featured_desktop_url, g.featured_mobile_url, g.new_game_both_url, g.game_page_both_url,
              g.is_popular, g.is_new, g.meta_title, g.meta_description, g.meta_tags,
              g.created_at, g.updated_at,
              GREATEST(COALESCE(g.play_count, 0), COALESCE(p.play_count, 0)) as play_count,
              GREATEST(COALESCE(g.likes_count, 0), COALESCE(l.likes_count, 0)) as likes_count,
              COALESCE(d.avg_duration, 0) as avg_duration
       FROM games g
      LEFT JOIN (
        SELECT "gameId", COUNT(*) as play_count
        FROM analytics_events
        WHERE event_type = 'play' ${hasFilter ? 'AND created_at >= $1::timestamp AND created_at <= $2::timestamp' : ''}
        GROUP BY "gameId"
      ) p ON p."gameId" = g.id
      LEFT JOIN (
        SELECT "gameId", COUNT(*) as likes_count
        FROM likes
        ${hasFilter ? 'WHERE created_at >= $1::timestamp AND created_at <= $2::timestamp' : ''}
        GROUP BY "gameId"
      ) l ON l."gameId" = g.id
      LEFT JOIN (
        SELECT "gameId", ROUND(AVG(duration_seconds)) as avg_duration
        FROM (
          SELECT "gameId", session_id,
                 EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) AS duration_seconds
          FROM analytics_events
          WHERE session_id IS NOT NULL ${hasFilter ? 'AND created_at >= $1::timestamp AND created_at <= $2::timestamp' : ''}
          GROUP BY session_id, "gameId"
        ) sessions
        GROUP BY "gameId"
      ) d ON d."gameId" = g.id
      ORDER BY play_count DESC
    `;
    const gamesStatsRes = await pool.query(gamesStatsQuery, params);

    // Distribution by category
    const categoryDistributionQuery = `
      SELECT g.category, 
             COUNT(DISTINCT g.id) as count, 
             COALESCE(SUM(COALESCE(ae.plays, 0)), 0)::int as total_plays
      FROM games g
      LEFT JOIN (
        SELECT "gameId", COUNT(*) as plays
        FROM analytics_events
        WHERE event_type = 'play' ${hasFilter ? 'AND created_at >= $1::timestamp AND created_at <= $2::timestamp' : ''}
        GROUP BY "gameId"
      ) ae ON ae."gameId" = g.id
      GROUP BY g.category
    `;
    const categoryDistributionRes = await pool.query(categoryDistributionQuery, params);

    // Gameplay Plays Trend
    const dailyPlaysQuery = hasFilter
      ? `SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
         FROM analytics_events 
         WHERE event_type = 'play' AND created_at >= $1::timestamp AND created_at <= $2::timestamp
         GROUP BY DATE_TRUNC('day', created_at)
         ORDER BY date ASC`
      : `SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
         FROM analytics_events 
         WHERE event_type = 'play' AND created_at >= NOW() - INTERVAL '14 days'
         GROUP BY DATE_TRUNC('day', created_at)
         ORDER BY date ASC`;
    const dailyPlaysRes = await pool.query(dailyPlaysQuery, params);

    const payload = {
      summary: {
        totalUsers: parseInt(totalUsersRes.rows[0].count),
        totalGames: parseInt(totalGamesRes.rows[0].count),
        totalPlays: parseInt(totalPlaysRes.rows[0].sum || totalPlaysRes.rows[0].count || '0'),
        avgPlayDuration,
      },
      games: gamesStatsRes.rows.map(row => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        category: row.category,
        thumbnailUrl: row.thumbnail_url,
        gameUrl: row.game_url,
        game_url: row.game_url,
        orientation: row.orientation || 'AUTO',
        hasBuild: hasGameBuildFiles(row.slug),
        playCount: parseInt(row.play_count),
        likesCount: parseInt(row.likes_count),
        avgDuration: Math.round(parseFloat(row.avg_duration)),
        isFeatured: row.is_featured,
        isPopular: row.is_popular,
        isNew: row.is_new,
        metaTitle: row.meta_title,
        metaDescription: row.meta_description,
        metaTags: row.meta_tags,
        status: row.status,
        description: row.description,
        featuredDesktopUrl: row.featured_desktop_url,
        featuredMobileUrl: row.featured_mobile_url,
        newGameBothUrl: row.new_game_both_url,
        gamePageBothUrl: row.game_page_both_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      categories: categoryDistributionRes.rows.map(row => ({
        category: row.category,
        count: parseInt(row.count),
        totalPlays: parseInt(row.total_plays || '0'),
      })),
      dailyPlaysTrend: dailyPlaysRes.rows.map(row => ({
        date: new Date(row.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        count: parseInt(row.count),
      })),
    };

    // Cache the compiled dashboard metrics response for 30 seconds
    await redis.set(cacheKey, JSON.stringify(payload), 'EX', 30);

    res.json(payload);
  } catch (err) {
    console.error('Error fetching admin dashboard metrics:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

/**
 * GET /api/admin/users - Get registered gamer accounts (Admin only, paginated and searchable)
 */
router.get('/users', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || 'all'; // 'all', 'active', 'blocked'
    const provider = (req.query.provider as string) || 'all'; // 'all', 'credentials', 'google', 'facebook', 'discord'
    const sortBy = (req.query.sortBy as string) || 'newest'; // 'newest', 'oldest', 'name_asc', 'name_desc'
    const offset = (page - 1) * limit;

    let queryParams: any[] = [];
    let whereClauses: string[] = [];

    if (search.trim()) {
      queryParams.push(`%${search.trim()}%`);
      whereClauses.push(`(name ILIKE $${queryParams.length} OR email ILIKE $${queryParams.length})`);
    }

    if (status === 'active') {
      whereClauses.push(`is_blocked = FALSE`);
    } else if (status === 'blocked') {
      whereClauses.push(`is_blocked = TRUE`);
    }

    if (provider !== 'all') {
      queryParams.push(provider);
      whereClauses.push(`provider = $${queryParams.length}`);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    let orderByClause = "ORDER BY created_at DESC";
    if (sortBy === 'oldest') {
      orderByClause = "ORDER BY created_at ASC";
    } else if (sortBy === 'name_asc') {
      orderByClause = "ORDER BY LOWER(COALESCE(name, '')) ASC";
    } else if (sortBy === 'name_desc') {
      orderByClause = "ORDER BY LOWER(COALESCE(name, '')) DESC";
    } else if (sortBy === 'email_asc') {
      orderByClause = "ORDER BY LOWER(email) ASC";
    } else if (sortBy === 'email_desc') {
      orderByClause = "ORDER BY LOWER(email) DESC";
    }

    // Get total count matching search & filters
    const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Get paginated users
    const selectQuery = `
      SELECT id, name, email, image, provider, 'USER'::varchar as role, is_blocked, created_at 
      FROM users 
      ${whereClause} 
      ${orderByClause} 
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(limit);
    queryParams.push(offset);

    const result = await pool.query(selectQuery, queryParams);

    res.json({
      users: result.rows,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    });
  } catch (err) {
    console.error('Error listing gamers:', err);
    res.status(500).json({ error: 'Failed to retrieve gamers' });
  }
});

/**
 * PUT /api/admin/users/:id/block - Block or unblock a gamer (Admin only)
 */
router.put('/users/:id/block', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { is_blocked } = req.body;

  if (typeof is_blocked !== 'boolean') {
    return res.status(400).json({ error: 'is_blocked field must be a boolean' });
  }

  try {
    const result = await pool.query(
      "UPDATE users SET is_blocked = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, 'USER'::varchar as role, is_blocked",
      [is_blocked, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Gamer user not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error modifying gamer block status:', err);
    res.status(500).json({ error: 'Failed to modify gamer block status' });
  }
});

/**
 * PUT /api/admin/users/:id/role - Promote gamer to admin (Super Admin only)
 */
router.put('/users/:id/role', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  return res.status(403).json({ error: 'Gamer promotion is disabled. Portal users and admin accounts are strictly separated.' });
});

/**
 * DELETE /api/admin/users/:id - Delete gamer user (Disabled)
 */
router.delete('/users/:id', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  return res.status(403).json({ error: 'User deletion is disabled. Please block the user instead.' });
});


/* ========================================================
   ADMINISTRATOR ACCOUNTS MANAGEMENT (SUPER ADMIN ONLY)
   ======================================================== */

/**
 * GET /api/admin/admins - Get all admin accounts
 */
router.get('/admins', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, plain_password, is_blocked, created_at FROM admin_users ORDER BY role DESC, created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error listing admins:', err);
    res.status(500).json({ error: 'Failed to retrieve administrators' });
  }
});

/**
 * POST /api/admin/admins - Create a new administrator account
 */
router.post('/admins', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { email, name, role, password } = req.body;

  if (!email || !role || !password) {
    return res.status(400).json({ error: 'Email, role, and password are required' });
  }

  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return res.status(400).json({ error: 'Role must be ADMIN or SUPER_ADMIN' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  try {
    const checkUser = await pool.query('SELECT id FROM admin_users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email address already registered' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const result = await pool.query(
      `INSERT INTO admin_users (email, name, role, password_hash, plain_password)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, plain_password, is_blocked, created_at`,
      [email, name || null, role, passwordHash, password]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Error creating admin user:', err);
    res.status(500).json({ error: err.message || 'Failed to create admin user' });
  }
});

/**
 * PUT /api/admin/admins/:id/role - Update an administrator's role or demote them
 */
router.put('/admins/:id/role', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return res.status(400).json({ error: 'Invalid role. Must be ADMIN or SUPER_ADMIN' });
  }

  if (id === req.user!.id) {
    return res.status(400).json({ error: 'Cannot modify your own Super Admin role' });
  }

  try {
    const result = await pool.query(
      'UPDATE admin_users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, role, is_blocked',
      [role, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error modifying admin role:', err);
    res.status(500).json({ error: 'Failed to modify admin role' });
  }
});

/**
 * PUT /api/admin/admins/:id/block - Block or unblock an administrator
 */
router.put('/admins/:id/block', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { is_blocked } = req.body;

  if (typeof is_blocked !== 'boolean') {
    return res.status(400).json({ error: 'is_blocked field must be a boolean' });
  }

  if (id === req.user!.id) {
    return res.status(400).json({ error: 'Cannot block your own administrator account' });
  }

  try {
    const result = await pool.query(
      'UPDATE admin_users SET is_blocked = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, role, is_blocked',
      [is_blocked, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error modifying admin block status:', err);
    res.status(500).json({ error: 'Failed to modify admin block status' });
  }
});

/**
 * DELETE /api/admin/admins/:id - Delete administrator account (Disabled)
 */
router.delete('/admins/:id', authenticate, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  return res.status(403).json({ error: 'User deletion is disabled. Please block the user instead.' });
});


/* ========================================================
   SYSTEM CLEANUP & UTILITIES
   ======================================================== */

/**
 * POST /api/admin/cleanup - Reconcile file system directories (Admin only)
 */
router.post('/cleanup', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const activeGamesRes = await pool.query('SELECT slug FROM games');
    const activeSlugs = activeGamesRes.rows.map(g => g.slug);
    
    await cleanOrphanedDirectories(activeSlugs);
    res.json({ message: 'Orphaned directories cleanup triggered successfully' });
  } catch (err) {
    console.error('Error running manual cleanup:', err);
    res.status(500).json({ error: 'Failed to run orphaned files cleanup' });
  }
});

/**
 * POST /api/admin/cache/flush - Flush Redis cache (Admin only)
 */
router.post('/cache/flush', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await redis.flushdb();
    res.json({ message: 'Redis cache flushed successfully' });
  } catch (err) {
    console.error('Error flushing Redis cache:', err);
    res.status(500).json({ error: 'Failed to flush Redis cache' });
  }
});

/* ========================================================
   CONTENT MANAGEMENT (STATIC PAGES)
   ======================================================== */

/**
 * GET /api/admin/content/pages/public/:slug - Fetch a public static page by slug
 */
router.get('/content/pages/public/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM static_pages WHERE LOWER(slug) = LOWER($1)',
      [slug]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching public static page:', err);
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

/**
 * GET /api/admin/content/pages - Fetch all static pages
 */
router.get('/content/pages', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM static_pages ORDER BY title ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching static pages:', err);
    res.status(500).json({ error: 'Failed to fetch static pages' });
  }
});

/**
 * PUT /api/admin/content/pages/:id - Update a static page
 */
router.put('/content/pages/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, content, status, meta_title, meta_description, meta_tags } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE static_pages 
       SET title = $1, content = $2, status = $3, meta_title = $4, meta_description = $5, meta_tags = $6, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $7 RETURNING *`,
      [title, content || '', status || 'published', meta_title || null, meta_description || null, meta_tags || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Static page not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating static page:', err);
    res.status(500).json({ error: 'Failed to update static page' });
  }
});

/**
 * GET /api/admin/settings - Retrieve global portal settings & social links
 */
router.get('/settings', async (req: Request, res: Response) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
          key VARCHAR(100) PRIMARY KEY,
          value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const result = await pool.query('SELECT key, value FROM site_settings');
    const settingsMap: Record<string, string> = {
      social_twitter: 'https://twitter.com',
      social_facebook: 'https://facebook.com',
      social_youtube: 'https://youtube.com',
      social_instagram: 'https://instagram.com',
      support_email: 'support@gamesato.com',
      site_name: 'Gamesato Portal',
      analytics_id: 'UA-182948123-1',
      maintenance_mode: 'false'
    };

    result.rows.forEach((row) => {
      settingsMap[row.key] = row.value;
    });

    res.json(settingsMap);
  } catch (err) {
    console.error('Error fetching site settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * PUT /api/admin/settings - Update global portal settings & social links
 */
router.put('/settings', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = req.body;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
          key VARCHAR(100) PRIMARY KEY,
          value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === 'string' || typeof value === 'boolean') {
        await pool.query(`
          INSERT INTO site_settings (key, value, updated_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
        `, [key, String(value)]);
      }
    }

    res.json({ message: 'Settings saved successfully' });
  } catch (err) {
    console.error('Error saving site settings:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Configure multer storage for media uploads
const mediaDir = path.join(__dirname, '../../uploads/media');
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir, { recursive: true });
}

const mediaStorage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, mediaDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const uniqueSuffix = Date.now();
    cb(null, `${cleanName || 'image'}-${uniqueSuffix}${ext}`);
  },
});

const uploadMedia = multer({
  storage: mediaStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

/**
 * GET /api/admin/media - List all uploaded media images
 */
router.get('/media', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uploadsBase = path.join(__dirname, '../../uploads');
    
    function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
      if (!fs.existsSync(dirPath)) return arrayOfFiles;
      const files = fs.readdirSync(dirPath);

      files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
          if (file !== 'temp') {
            getAllFiles(fullPath, arrayOfFiles);
          }
        } else {
          const ext = path.extname(file).toLowerCase();
          if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'].includes(ext)) {
            arrayOfFiles.push(fullPath);
          }
        }
      });

      return arrayOfFiles;
    }

    const allFilePaths = getAllFiles(uploadsBase);
    
    const mediaFiles = allFilePaths.map((filePath) => {
      const relativePath = path.relative(uploadsBase, filePath).replace(/\\/g, '/');
      const stats = fs.statSync(filePath);
      return {
        name: path.basename(filePath),
        relativePath: `/uploads/${relativePath}`,
        url: `/uploads/${relativePath}`,
        size: stats.size,
        mtime: stats.mtime,
      };
    }).sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime());

    res.json({ success: true, files: mediaFiles });
  } catch (err) {
    console.error('Error fetching media files:', err);
    res.status(500).json({ error: 'Failed to fetch media files' });
  }
});

/**
 * POST /api/admin/media/upload - Upload new image file
 */
router.post('/media/upload', authenticate, requireAdmin, uploadMedia.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/media/${req.file.filename}`;
    res.json({
      success: true,
      message: 'File uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
    });
  } catch (err: any) {
    console.error('Error uploading media file:', err);
    res.status(500).json({ error: err.message || 'Failed to upload media file' });
  }
});

/**
 * DELETE /api/admin/media - Delete uploaded media image
 */
router.delete('/media', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { relativePath } = req.body;
    if (!relativePath || !relativePath.startsWith('/uploads/')) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    const cleanRelative = relativePath.replace(/^\/uploads\//, '');
    const uploadsBase = path.join(__dirname, '../../uploads');
    const targetPath = path.resolve(uploadsBase, cleanRelative);

    if (!targetPath.startsWith(uploadsBase)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      res.json({ success: true, message: 'Media file deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (err) {
    console.error('Error deleting media file:', err);
    res.status(500).json({ error: 'Failed to delete media file' });
  }
});

export default router;

