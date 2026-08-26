import { Router, Response } from 'express';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { pool } from '../config/db';

const router = Router();

/**
 * GET /api/blogs - Public: List published blog posts
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, search, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    let queryText = `SELECT id, title, slug, excerpt, cover_image, category, author, status, meta_title, meta_description, published_at, created_at, updated_at FROM blogs WHERE status = 'published'`;
    const queryParams: any[] = [];

    if (category && category !== 'All') {
      queryParams.push(category);
      queryText += ` AND category = $${queryParams.length}`;
    }

    if (search) {
      queryParams.push(`%${search}%`);
      queryText += ` AND (title ILIKE $${queryParams.length} OR excerpt ILIKE $${queryParams.length} OR content ILIKE $${queryParams.length})`;
    }

    // Count total query
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM (${queryText}) AS total`,
      queryParams
    );
    const totalCount = parseInt(countResult.rows[0].count, 10);

    queryText += ` ORDER BY published_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limitNum, offset);

    const result = await pool.query(queryText, queryParams);

    res.json({
      success: true,
      blogs: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch blogs' });
  }
});

/**
 * GET /api/blogs/admin/list - Admin: List all blogs
 */
router.get('/admin/list', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM blogs ORDER BY created_at DESC`
    );
    res.json({ success: true, blogs: result.rows });
  } catch (error) {
    console.error('Error fetching admin blogs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin blogs' });
  }
});

/**
 * GET /api/blogs/:slug - Public: Get single blog post by slug
 */
router.get('/:slug', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(
      `SELECT * FROM blogs WHERE slug = $1 AND status = 'published'`,
      [slug]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Blog post not found' });
      return;
    }

    res.json({ success: true, blog: result.rows[0] });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch blog post' });
  }
});

/**
 * POST /api/blogs/admin/create - Admin: Create new blog post
 */
router.post('/admin/create', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      cover_image,
      category,
      author,
      status,
      meta_title,
      meta_description,
    } = req.body;

    if (!title || !content) {
      res.status(400).json({ success: false, message: 'Title and Content are required' });
      return;
    }

    const generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const result = await pool.query(
      `INSERT INTO blogs (
        title, slug, excerpt, content, cover_image, category, author, status, meta_title, meta_description, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *`,
      [
        title,
        generatedSlug,
        excerpt || '',
        content,
        cover_image || '',
        category || 'General',
        author || 'Gamesato Team',
        status || 'published',
        meta_title || title,
        meta_description || excerpt || '',
      ]
    );

    res.status(201).json({ success: true, blog: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating blog:', error);
    if (error.code === '23505') {
      res.status(400).json({ success: false, message: 'A blog post with this slug already exists' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create blog post' });
  }
});

/**
 * PUT /api/blogs/admin/:id - Admin: Update blog post
 */
router.put('/admin/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      excerpt,
      content,
      cover_image,
      category,
      author,
      status,
      meta_title,
      meta_description,
    } = req.body;

    const existing = await pool.query(`SELECT * FROM blogs WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Blog post not found' });
      return;
    }

    const result = await pool.query(
      `UPDATE blogs SET
        title = COALESCE($1, title),
        slug = COALESCE($2, slug),
        excerpt = COALESCE($3, excerpt),
        content = COALESCE($4, content),
        cover_image = COALESCE($5, cover_image),
        category = COALESCE($6, category),
        author = COALESCE($7, author),
        status = COALESCE($8, status),
        meta_title = COALESCE($9, meta_title),
        meta_description = COALESCE($10, meta_description),
        updated_at = NOW()
      WHERE id = $11
      RETURNING *`,
      [
        title,
        slug,
        excerpt,
        content,
        cover_image,
        category,
        author,
        status,
        meta_title,
        meta_description,
        id,
      ]
    );

    res.json({ success: true, blog: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating blog:', error);
    res.status(500).json({ success: false, message: 'Failed to update blog post' });
  }
});

/**
 * DELETE /api/blogs/admin/:id - Admin: Delete blog post
 */
router.delete('/admin/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM blogs WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Blog post not found' });
      return;
    }

    res.json({ success: true, message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ success: false, message: 'Failed to delete blog post' });
  }
});

export default router;
