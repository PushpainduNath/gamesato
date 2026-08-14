import { Router, Response } from 'express';
import { authenticate, optionalAuthenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { upload, extractGameBuild, saveThumbnail, deleteGameFiles, deleteLocalImage, getGameFilesInfo } from '../utils/fileManager';
import { pool } from '../config/db';
import redis from '../config/redis';

const router = Router();

// Cache Helper
const CACHE_TTL = 3600; // 1 hour
async function invalidateGameCache(slug: string) {
  try {
    await redis.del(`game:${slug}`);
    await redis.del('games:all');
    
    // Invalidate all admin dashboard cache keys (including any dates/variations)
    const dashboardKeys = await redis.keys('admin:dashboard*');
    if (dashboardKeys.length > 0) {
      await redis.del(...dashboardKeys);
    }
  } catch (err) {
    console.error('Error invalidating Redis cache:', err);
  }
}

/**
 * GET /api/games - List all published games
 */
router.get('/', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
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

    const { category, status } = req.query;
    let queryText = 'SELECT * FROM games WHERE 1=1';
    const queryParams: any[] = [];

    // Filter by status (Admins can view drafts, regular users only published)
    const isAdmin = req.user && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN');
    if (status && isAdmin) {
      queryText += ' AND status = $1';
      queryParams.push(status);
    } else {
      queryText += ' AND status = \'published\'';
    }

    if (category) {
      queryText += ` AND category = $${queryParams.length + 1}`;
      queryParams.push(category);
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await pool.query(queryText, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching games:', err);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

/**
 * GET /api/games/favorites - Get logged-in user's favorites
 */
router.get('/favorites', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await pool.query(
      `SELECT g.* FROM games g
       JOIN likes l ON g.id = l."gameId"
       WHERE l."userId" = $1 AND g.status = 'published'
       ORDER BY l.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

/**
 * GET /api/games/slug/:slug - Get a single game detail (ISR helper, but checks user actions)
 */
router.get('/slug/:slug', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const userId = req.user?.id;

    // Try reading cache if not authenticated (static queries)
    const cacheKey = `game:${slug}`;
    if (!userId) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    }

    // Get game metadata
    const gameResult = await pool.query(
      'SELECT * FROM games WHERE slug = $1',
      [slug]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = gameResult.rows[0];

    // Fetch Likes count
    const likesCountResult = await pool.query(
      'SELECT COUNT(*) FROM likes WHERE "gameId" = $1',
      [game.id]
    );

    // Check if the current user has liked
    let isLiked = false;

    if (userId) {
      const userLikeResult = await pool.query(
        'SELECT 1 FROM likes WHERE "userId" = $1 AND "gameId" = $2',
        [userId, game.id]
      );
      isLiked = userLikeResult.rows.length > 0;
    }

    const gameDetails = {
      ...game,
      likesCount: parseInt(likesCountResult.rows[0].count, 10),
      isLiked,
    };

    // Cache detailed response (only if public visitor)
    if (!userId && game.status === 'published') {
      await redis.set(cacheKey, JSON.stringify(gameDetails), 'EX', CACHE_TTL);
    }

    res.json(gameDetails);
  } catch (err) {
    console.error('Error fetching game details:', err);
    res.status(500).json({ error: 'Failed to fetch game details' });
  }
});

function parseEmbedUrl(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (trimmed.includes('<iframe') || trimmed.startsWith('<iframe')) {
    const match = trimmed.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return trimmed;
}

/**
 * POST /api/games - Admin upload a new H5 game
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  upload.fields([
    { name: 'zip', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
    { name: 'featured_desktop', maxCount: 1 },
    { name: 'featured_mobile', maxCount: 1 },
    { name: 'new_game_both', maxCount: 1 },
    { name: 'game_page_both', maxCount: 1 },
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const { title, slug, description, category, status } = req.body;
    const rawEmbed = req.body.embed_url || req.body.embedUrl || req.body.game_url || '';
    const embedUrl = parseEmbedUrl(rawEmbed);
    const hasZip = !!(files && files.zip && files.zip[0]);

    if (!title || !slug || !category || !files || !files.thumbnail || (!hasZip && !embedUrl)) {
      if (files?.zip?.[0]) await deleteTempFile(files.zip[0].path);
      if (files?.thumbnail?.[0]) await deleteTempFile(files.thumbnail[0].path);
      if (files?.featured_desktop?.[0]) await deleteTempFile(files.featured_desktop[0].path);
      if (files?.featured_mobile?.[0]) await deleteTempFile(files.featured_mobile[0].path);
      if (files?.new_game_both?.[0]) await deleteTempFile(files.new_game_both[0].path);
      if (files?.game_page_both?.[0]) await deleteTempFile(files.game_page_both[0].path);
      return res.status(400).json({ error: 'Missing required game fields or files (title, slug, category, thumbnail, and either a ZIP build or an Embed URL)' });
    }

    // Pre-check if slug already exists in DB BEFORE processing any files!
    const slugCheck = await pool.query('SELECT 1 FROM games WHERE slug = $1', [slug]);
    if (slugCheck.rows.length > 0) {
      if (files.zip?.[0]) await deleteTempFile(files.zip[0].path);
      if (files.thumbnail?.[0]) await deleteTempFile(files.thumbnail[0].path);
      if (files.featured_desktop?.[0]) await deleteTempFile(files.featured_desktop[0].path);
      if (files.featured_mobile?.[0]) await deleteTempFile(files.featured_mobile[0].path);
      if (files.new_game_both?.[0]) await deleteTempFile(files.new_game_both[0].path);
      if (files.game_page_both?.[0]) await deleteTempFile(files.game_page_both[0].path);
      return res.status(400).json({ error: `A game with slug "${slug}" already exists in the database. Please use a different title or slug.` });
    }

    // Pre-check featured image requirement BEFORE processing any files!
    let isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true || false;
    if (isFeatured && !files.featured_desktop?.[0] && !files.featured_mobile?.[0]) {
      if (files.zip?.[0]) await deleteTempFile(files.zip[0].path);
      if (files.thumbnail?.[0]) await deleteTempFile(files.thumbnail[0].path);
      if (files.new_game_both?.[0]) await deleteTempFile(files.new_game_both[0].path);
      if (files.game_page_both?.[0]) await deleteTempFile(files.game_page_both[0].path);
      return res.status(400).json({ error: 'Cannot mark game as Featured without uploading at least one Featured Image (Desktop or Mobile).' });
    }

    try {
      // 1. Save Thumbnail Locally
      const thumbnailFile = files.thumbnail[0];
      const thumbnailUrl = await saveThumbnail(thumbnailFile.path, slug, thumbnailFile.originalname);

      // Save optional files if uploaded
      let featuredDesktopUrl: string | null = null;
      if (files.featured_desktop?.[0]) {
        const file = files.featured_desktop[0];
        featuredDesktopUrl = await saveThumbnail(file.path, slug, file.originalname);
      }

      let featuredMobileUrl: string | null = null;
      if (files.featured_mobile?.[0]) {
        const file = files.featured_mobile[0];
        featuredMobileUrl = await saveThumbnail(file.path, slug, file.originalname);
      }

      let newGameBothUrl: string | null = null;
      if (files.new_game_both?.[0]) {
        const file = files.new_game_both[0];
        newGameBothUrl = await saveThumbnail(file.path, slug, file.originalname);
      }

      let gamePageBothUrl: string | null = null;
      if (files.game_page_both?.[0]) {
        const file = files.game_page_both[0];
        gamePageBothUrl = await saveThumbnail(file.path, slug, file.originalname);
      }

      // 2. Determine Game URL (Extract ZIP or use Embed Link)
      let gameUrl = '';
      if (hasZip) {
        const zipFile = files.zip[0];
        await extractGameBuild(zipFile.path, slug);
        await deleteTempFile(zipFile.path);
        gameUrl = `/games/${slug}/index.html`;
      } else {
        gameUrl = embedUrl;
      }

      // 3. Insert into Database
      const isPopular = req.body.isPopular === 'true' || req.body.isPopular === true || false;
      const isNew = req.body.isNew === 'true' || req.body.isNew === true || false;
      const metaTitle = req.body.metaTitle || null;
      const metaDescription = req.body.metaDescription || null;
      const metaTags = req.body.metaTags || null;
      const howToPlay = req.body.howToPlay || req.body.how_to_play || null;
      const createdAt = req.body.createdAt ? req.body.createdAt : new Date();
      const likesCount = req.body.likesCount !== undefined ? parseInt(req.body.likesCount, 10) : (req.body.likes_count !== undefined ? parseInt(req.body.likes_count, 10) : 0);
      const playCount = req.body.playCount !== undefined ? parseInt(req.body.playCount, 10) : (req.body.play_count !== undefined ? parseInt(req.body.play_count, 10) : 0);
      const orientation = (req.body.orientation || 'AUTO').toUpperCase();

      const result = await pool.query(
        `INSERT INTO games (title, slug, description, category, thumbnail_url, game_url, status, is_featured, featured_desktop_url, featured_mobile_url, new_game_both_url, game_page_both_url, is_popular, is_new, meta_title, meta_description, meta_tags, how_to_play, created_at, likes_count, play_count, orientation)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
         RETURNING *`,
        [title, slug, description || '', category, thumbnailUrl, gameUrl, status || 'published', isFeatured, featuredDesktopUrl, featuredMobileUrl, newGameBothUrl, gamePageBothUrl, isPopular, isNew, metaTitle, metaDescription, metaTags, howToPlay, createdAt, likesCount, playCount, orientation]
      );

      await invalidateGameCache(slug);

      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      console.error('Error creating game:', err);
      // Clean up temp files
      if (files?.zip?.[0]) await deleteTempFile(files.zip[0].path);
      if (files?.thumbnail?.[0]) await deleteTempFile(files.thumbnail[0].path);
      if (files?.featured_desktop?.[0]) await deleteTempFile(files.featured_desktop[0].path);
      if (files?.featured_mobile?.[0]) await deleteTempFile(files.featured_mobile[0].path);
      if (files?.new_game_both?.[0]) await deleteTempFile(files.new_game_both[0].path);
      if (files?.game_page_both?.[0]) await deleteTempFile(files.game_page_both[0].path);

      // Clean up extracted build directory & thumbnail files on disk so failed state doesn't block future uploads
      try {
        await deleteGameFiles(slug, null);
      } catch (cleanErr) {
        console.error('Error cleaning up files after failed upload:', cleanErr);
      }

      res.status(500).json({ error: err.message || 'Failed to create game' });
    }
  }
);

/**
 * GET /api/games/:id - Fetch single game by ID
 */
router.get('/:id', async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM games WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching game by ID:', err);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

/**
 * PUT /api/games/:id - Admin update game metadata or assets
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  upload.fields([
    { name: 'zip', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
    { name: 'featured_desktop', maxCount: 1 },
    { name: 'featured_mobile', maxCount: 1 },
    { name: 'new_game_both', maxCount: 1 },
    { name: 'game_page_both', maxCount: 1 },
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { title, slug, description, category, status } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    try {
      // Check if game exists
      const checkResult = await pool.query('SELECT * FROM games WHERE id = $1', [id]);
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Game not found' });
      }
      const existingGame = checkResult.rows[0];
      const targetSlug = slug || existingGame.slug;

      let thumbnailUrl = existingGame.thumbnail_url;
      let gameUrl = existingGame.game_url;
      const isSharedImage = (url: string | null) => {
        if (!url) return false;
        return url === existingGame.thumbnail_url;
      };

      let featuredDesktopUrl = req.body.clear_featured_desktop === 'true' ? null : existingGame.featured_desktop_url;
      if (req.body.clear_featured_desktop === 'true' && existingGame.featured_desktop_url && !isSharedImage(existingGame.featured_desktop_url)) {
        await deleteLocalImage(existingGame.featured_desktop_url);
      }

      let featuredMobileUrl = req.body.clear_featured_mobile === 'true' ? null : existingGame.featured_mobile_url;
      if (req.body.clear_featured_mobile === 'true' && existingGame.featured_mobile_url && !isSharedImage(existingGame.featured_mobile_url)) {
        await deleteLocalImage(existingGame.featured_mobile_url);
      }

      let newGameBothUrl = req.body.clear_new_game_both === 'true' ? null : existingGame.new_game_both_url;
      if (req.body.clear_new_game_both === 'true' && existingGame.new_game_both_url && !isSharedImage(existingGame.new_game_both_url)) {
        await deleteLocalImage(existingGame.new_game_both_url);
      }

      let gamePageBothUrl = req.body.clear_game_page_both === 'true' ? null : existingGame.game_page_both_url;
      if (req.body.clear_game_page_both === 'true' && existingGame.game_page_both_url && !isSharedImage(existingGame.game_page_both_url)) {
        await deleteLocalImage(existingGame.game_page_both_url);
      }

      // 1. Process new thumbnail if uploaded
      if (files?.thumbnail?.[0]) {
        const thumbnailFile = files.thumbnail[0];
        // Clean up old thumbnail if not shared
        if (existingGame.thumbnail_url.startsWith('/uploads/thumbnails/')) {
          const oldPath = path.join(__dirname, '../../', existingGame.thumbnail_url);
          try {
            await fsPromises.unlink(oldPath);
          } catch {}
        }
        thumbnailUrl = await saveThumbnail(thumbnailFile.path, targetSlug, thumbnailFile.originalname);
      }

      // 1.1 Process new featured_desktop if uploaded
      if (files?.featured_desktop?.[0]) {
        const file = files.featured_desktop[0];
        // Clean up old featured_desktop if not shared
        if (existingGame.featured_desktop_url && !isSharedImage(existingGame.featured_desktop_url)) {
          await deleteLocalImage(existingGame.featured_desktop_url);
        }
        featuredDesktopUrl = await saveThumbnail(file.path, targetSlug, file.originalname);
      }

      // 1.2 Process new featured_mobile (16:9 mobile banner) if uploaded
      if (files?.featured_mobile?.[0]) {
        const file = files.featured_mobile[0];
        // Clean up old featured_mobile if not shared
        if (existingGame.featured_mobile_url && !isSharedImage(existingGame.featured_mobile_url)) {
          await deleteLocalImage(existingGame.featured_mobile_url);
        }
        featuredMobileUrl = await saveThumbnail(file.path, targetSlug, file.originalname);
      }

      // 1.2.5 Process new new_game_both (1:1.4 image) if uploaded
      if (files?.new_game_both?.[0]) {
        const file = files.new_game_both[0];
        // Clean up old new_game_both if not shared
        if (existingGame.new_game_both_url && !isSharedImage(existingGame.new_game_both_url)) {
          await deleteLocalImage(existingGame.new_game_both_url);
        }
        newGameBothUrl = await saveThumbnail(file.path, targetSlug, file.originalname);
      }

      // 1.3 Process new game_page_both (4:3 cover) if uploaded
      if (files?.game_page_both?.[0]) {
        const file = files.game_page_both[0];
        // Clean up old game_page_both if not shared
        if (existingGame.game_page_both_url && !isSharedImage(existingGame.game_page_both_url)) {
          await deleteLocalImage(existingGame.game_page_both_url);
        }
        gamePageBothUrl = await saveThumbnail(file.path, targetSlug, file.originalname);
      }

      const rawEmbed = req.body.embed_url || req.body.embedUrl || req.body.game_url || '';
      const embedUrl = parseEmbedUrl(rawEmbed);

      // 2. Process new ZIP build or Embed URL if uploaded
      if (files?.zip?.[0]) {
        const zipFile = files.zip[0];
        // Extract new build
        await extractGameBuild(zipFile.path, targetSlug);
        await deleteTempFile(zipFile.path);
        gameUrl = `/games/${targetSlug}/index.html`;
      } else if (embedUrl) {
        gameUrl = embedUrl;
      } else if (slug && slug !== existingGame.slug && !existingGame.game_url.startsWith('http://') && !existingGame.game_url.startsWith('https://')) {
        // If slug changed but no zip was uploaded, rename the folder!
        const oldPath = path.join(process.env.GAMES_DIR || path.join(__dirname, '../../../gb-games'), existingGame.slug);
        const newPath = path.join(process.env.GAMES_DIR || path.join(__dirname, '../../../gb-games'), slug);
        try {
          if (fsSync.existsSync(oldPath)) {
            await fsPromises.rename(oldPath, newPath);
          }
          gameUrl = `/games/${slug}/index.html`;
        } catch (err) {
          console.error('Error renaming game build directory:', err);
        }
      }

      // 3. Update Database
      let isFeatured = req.body.isFeatured !== undefined ? (req.body.isFeatured === 'true' || req.body.isFeatured === true) : existingGame.is_featured;
      // Strict rule: Featured Game requires BOTH featured_desktop_url AND featured_mobile_url
      if (isFeatured && (!featuredDesktopUrl || !featuredMobileUrl)) {
        isFeatured = false;
      }
      const isPopular = req.body.isPopular !== undefined ? (req.body.isPopular === 'true' || req.body.isPopular === true) : existingGame.is_popular;
      const isNew = req.body.isNew !== undefined ? (req.body.isNew === 'true' || req.body.isNew === true) : existingGame.is_new;
      const metaTitle = req.body.metaTitle !== undefined ? req.body.metaTitle : existingGame.meta_title;
      const metaDescription = req.body.metaDescription !== undefined ? req.body.metaDescription : existingGame.meta_description;
      const metaTags = req.body.metaTags !== undefined ? req.body.metaTags : existingGame.meta_tags;
      const howToPlay = req.body.howToPlay !== undefined ? req.body.howToPlay : (req.body.how_to_play !== undefined ? req.body.how_to_play : existingGame.how_to_play);
      const createdAt = req.body.createdAt !== undefined ? req.body.createdAt : existingGame.created_at;
      const likesCount = req.body.likesCount !== undefined ? parseInt(req.body.likesCount, 10) : (req.body.likes_count !== undefined ? parseInt(req.body.likes_count, 10) : existingGame.likes_count);
      const playCount = req.body.playCount !== undefined ? parseInt(req.body.playCount, 10) : (req.body.play_count !== undefined ? parseInt(req.body.play_count, 10) : existingGame.play_count);
      const orientation = req.body.orientation !== undefined ? (req.body.orientation || 'AUTO').toUpperCase() : (existingGame.orientation || 'AUTO');

      const result = await pool.query(
        `UPDATE games 
         SET title = $1, slug = $2, description = $3, category = $4, thumbnail_url = $5, game_url = $6, status = $7, is_featured = $8, featured_desktop_url = $9, featured_mobile_url = $10, new_game_both_url = $11, game_page_both_url = $12, is_popular = $13, is_new = $14, meta_title = $15, meta_description = $16, meta_tags = $17, how_to_play = $18, created_at = $19, likes_count = $20, play_count = $21, orientation = $22, updated_at = CURRENT_TIMESTAMP
         WHERE id = $23
         RETURNING *`,
        [title || existingGame.title, targetSlug, description ?? existingGame.description, category || existingGame.category, thumbnailUrl, gameUrl, status || existingGame.status, isFeatured, featuredDesktopUrl, featuredMobileUrl, newGameBothUrl, gamePageBothUrl, isPopular, isNew, metaTitle, metaDescription, metaTags, howToPlay, createdAt, likesCount, playCount, orientation, id]
      );

      await invalidateGameCache(existingGame.slug);
      if (slug) await invalidateGameCache(slug);

      res.json(result.rows[0]);
    } catch (err: any) {
      console.error('Error updating game:', err);
      if (files?.zip?.[0]) await deleteTempFile(files.zip[0].path);
      if (files?.thumbnail?.[0]) await deleteTempFile(files.thumbnail[0].path);
      if (files?.featured_desktop?.[0]) await deleteTempFile(files.featured_desktop[0].path);
      if (files?.featured_mobile?.[0]) await deleteTempFile(files.featured_mobile[0].path);
      if (files?.new_game_both?.[0]) await deleteTempFile(files.new_game_both[0].path);
      if (files?.game_page_both?.[0]) await deleteTempFile(files.game_page_both[0].path);

      res.status(500).json({ error: err.message || 'Failed to update game' });
    }
  }
);

/**
 * DELETE /api/games/:id - Admin delete a game permanently
 */
router.delete('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    // 1. Fetch game details from DB first to get slug & image paths
    const gameResult = await pool.query(
      'SELECT id, title, slug, thumbnail_url, featured_desktop_url, featured_mobile_url, new_game_both_url, game_page_both_url FROM games WHERE id = $1',
      [id]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found.' });
    }

    const game = gameResult.rows[0];

    // 2. Delete physical build files directory from server disk
    await deleteGameFiles(game.slug, null);

    // 3. Clean up uploaded images if local
    const imagesToDelete = [
      game.thumbnail_url,
      game.featured_desktop_url,
      game.featured_mobile_url,
      game.new_game_both_url,
      game.game_page_both_url
    ];

    for (const imgUrl of imagesToDelete) {
      if (imgUrl && imgUrl.startsWith('/uploads/')) {
        await deleteLocalImage(imgUrl);
      }
    }

    // 4. Delete related entries (likes, etc.) and game row from DB
    await pool.query('DELETE FROM likes WHERE "gameId" = $1', [id]);
    await pool.query('DELETE FROM games WHERE id = $1', [id]);

    // 5. Invalidate Redis caches
    await invalidateGameCache(game.slug);

    res.json({ message: `Game "${game.title}" deleted successfully.` });
  } catch (err) {
    console.error('Error deleting game:', err);
    res.status(500).json({ error: 'Internal server error while deleting game.' });
  }
});

/**
 * POST /api/games/:id/like - Toggle game like (restricted to logged-in users)
 */
router.post('/:id/like', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  try {
    // Check if liked
    const likeCheck = await pool.query(
      'SELECT 1 FROM likes WHERE "userId" = $1 AND "gameId" = $2',
      [userId, id]
    );

    if (likeCheck.rows.length > 0) {
      // Unlike
      await pool.query(
        'DELETE FROM likes WHERE "userId" = $1 AND "gameId" = $2',
        [userId, id]
      );
      res.json({ liked: false });
    } else {
      // Like
      await pool.query(
        'INSERT INTO likes ("userId", "gameId") VALUES ($1, $2)',
        [userId, id]
      );
      res.json({ liked: true });
    }
  } catch (err) {
    console.error('Error toggling like:', err);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

/**
 * GET /api/games/:id/files - Admin inspect build files & size
 */
router.get('/:id/files', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const gameResult = await pool.query('SELECT * FROM games WHERE id = $1', [id]);
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    const game = gameResult.rows[0];
    const filesInfo = await getGameFilesInfo(game.slug);
    res.json({ game, filesInfo });
  } catch (err: any) {
    console.error('Error fetching game files info:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch game files info' });
  }
});

/**
 * POST /api/games/:id/clear-files - Admin clear game build files & auto deactivate
 */
router.post('/:id/clear-files', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const gameResult = await pool.query('SELECT * FROM games WHERE id = $1', [id]);
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    const game = gameResult.rows[0];

    // Delete H5 build folder from disk
    const destDir = path.join(process.env.GAMES_DIR || path.join(__dirname, '../../../gb-games'), game.slug);
    if (fsSync.existsSync(destDir)) {
      await fsPromises.rm(destDir, { recursive: true, force: true });
    }

    // Auto deactivate game & clear game_url
    const updateResult = await pool.query(
      `UPDATE games 
       SET status = 'draft', game_url = '', is_featured = FALSE, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    await invalidateGameCache(game.slug);

    res.json({
      message: `Build files for "${game.title}" have been cleared from server storage and game has been set to Inactive (draft).`,
      game: updateResult.rows[0]
    });
  } catch (err: any) {
    console.error('Error clearing game build files:', err);
    res.status(500).json({ error: err.message || 'Failed to clear game build files' });
  }
});



// Helper for unlink
import { promises as fsPromises } from 'fs';
import fsSync from 'fs';
import path from 'path';

async function deleteTempFile(filePath: string) {
  try {
    if (fsSync.existsSync(filePath)) {
      await fsPromises.unlink(filePath);
    }
  } catch (err) {
    console.error('Failed to delete temporary file:', filePath, err);
  }
}

export default router;
