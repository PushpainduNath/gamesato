import { Router, Response } from 'express';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { pool } from '../config/db';
import redis from '../config/redis';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { upload, saveCategoryIcon, deleteLocalImage } from '../utils/fileManager';

const router = Router();

// Invalidate Cache Helper
async function invalidateCache() {
  try {
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
 * GET /api/categories - Get all categories with game counts
 */
router.get('/', async (req, res) => {
  try {
    const queryText = `
      SELECT c.id, c.name, c.slug, c.icon, c.content, c.status, c.meta_title, c.meta_description, c.meta_tags, COUNT(g.id)::int as games_count
      FROM categories c
      LEFT JOIN games g ON LOWER(g.category) = LOWER(c.name) AND g.status = 'published'
      GROUP BY c.id, c.name, c.slug, c.icon, c.content, c.status, c.meta_title, c.meta_description, c.meta_tags
      ORDER BY c.name ASC
    `;
    const result = await pool.query(queryText);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * POST /api/categories - Create a new category
 */
router.post('/', authenticate, requireAdmin, upload.single('icon'), async (req: AuthenticatedRequest, res: Response) => {
  const { name } = req.body;
  let { slug, icon } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  if (!slug) {
    slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  try {
    const existing = await pool.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1) OR slug = $2', [name, slug]);
    if (existing.rows.length > 0) {
      if (req.file) {
        await fsPromises.unlink(req.file.path).catch(console.error);
      }
      return res.status(400).json({ error: 'Category name or slug already exists' });
    }

    let finalIconUrl = icon || '/arcade.svg';
    if (req.file) {
      finalIconUrl = await saveCategoryIcon(req.file.path, slug, req.file.originalname);
    }

    const result = await pool.query(
      'INSERT INTO categories (name, slug, icon) VALUES ($1, $2, $3) RETURNING *',
      [name, slug, finalIconUrl]
    );

    await invalidateCache();
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating category:', err);
    if (req.file) {
      await fsPromises.unlink(req.file.path).catch(console.error);
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

/**
 * PUT /api/categories/:id - Update category details
 */
router.put('/:id', authenticate, requireAdmin, upload.single('icon'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  let { slug, icon } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  if (!slug) {
    slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  try {
    const currentRes = await pool.query('SELECT name, icon, content, status, meta_title, meta_description, meta_tags FROM categories WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      if (req.file) {
        await fsPromises.unlink(req.file.path).catch(console.error);
      }
      return res.status(404).json({ error: 'Category not found' });
    }
    const currentCategory = currentRes.rows[0];
    const oldName = currentCategory.name;
    const oldIcon = currentCategory.icon;

    const conflictRes = await pool.query(
      'SELECT id FROM categories WHERE (LOWER(name) = LOWER($1) OR slug = $2) AND id <> $3',
      [name, slug, id]
    );
    if (conflictRes.rows.length > 0) {
      if (req.file) {
        await fsPromises.unlink(req.file.path).catch(console.error);
      }
      return res.status(400).json({ error: 'Category name or slug conflict exists' });
    }

    let finalIconUrl = icon || oldIcon || '/arcade.svg';
    if (req.file) {
      finalIconUrl = await saveCategoryIcon(req.file.path, slug, req.file.originalname);
      if (oldIcon && oldIcon.startsWith('/uploads/icons/')) {
        await deleteLocalImage(oldIcon).catch(console.error);
      }
    }

    const newContent = req.body.content !== undefined ? req.body.content : currentCategory.content;
    const newStatus = req.body.status !== undefined ? req.body.status : currentCategory.status;
    const newMetaTitle = req.body.meta_title !== undefined ? req.body.meta_title : currentCategory.meta_title;
    const newMetaDescription = req.body.meta_description !== undefined ? req.body.meta_description : currentCategory.meta_description;
    const newMetaTags = req.body.meta_tags !== undefined ? req.body.meta_tags : currentCategory.meta_tags;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const updateRes = await client.query(
        `UPDATE categories 
         SET name = $1, slug = $2, icon = $3, content = $4, status = $5, 
             meta_title = $6, meta_description = $7, meta_tags = $8, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $9 RETURNING *`,
        [name, slug, finalIconUrl, newContent, newStatus, newMetaTitle, newMetaDescription, newMetaTags, id]
      );

      await client.query(
        'UPDATE games SET category = $1 WHERE LOWER(category) = LOWER($2)',
        [name, oldName]
      );

      await client.query('COMMIT');
      await invalidateCache();
      res.json(updateRes.rows[0]);
    } catch (txErr) {
      await client.query('ROLLBACK');
      if (req.file) {
        const uploadedPath = path.join(__dirname, '../..', finalIconUrl);
        await fsPromises.unlink(uploadedPath).catch(console.error);
      }
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

/**
 * DELETE /api/categories/:id - Delete category and reassign its games to a target category
 */
router.delete('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { targetCategoryId, targetCategoryName } = req.body || {};

  try {
    const currentRes = await pool.query('SELECT name, icon FROM categories WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    const catName = currentRes.rows[0].name;
    const catIcon = currentRes.rows[0].icon;

    // Count games currently belonging to this category
    const gamesCountRes = await pool.query('SELECT COUNT(*)::int as count FROM games WHERE LOWER(category) = LOWER($1)', [catName]);
    const gamesCount = gamesCountRes.rows[0]?.count || 0;

    let destinationCategoryName = '';

    if (gamesCount > 0) {
      if (!targetCategoryId && !targetCategoryName) {
        return res.status(400).json({ error: 'Category contains games. Please select a target category to reassign them.' });
      }

      let targetRes;
      if (targetCategoryId) {
        targetRes = await pool.query('SELECT name FROM categories WHERE id = $1 AND id <> $2', [targetCategoryId, id]);
      } else {
        targetRes = await pool.query('SELECT name FROM categories WHERE LOWER(name) = LOWER($1) AND id <> $2', [targetCategoryName, id]);
      }

      if (targetRes.rows.length === 0) {
        return res.status(400).json({ error: 'Selected target category was not found or is invalid.' });
      }

      destinationCategoryName = targetRes.rows[0].name;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      if (gamesCount > 0 && destinationCategoryName) {
        await client.query(
          'UPDATE games SET category = $1 WHERE LOWER(category) = LOWER($2)',
          [destinationCategoryName, catName]
        );
      }

      await client.query('DELETE FROM categories WHERE id = $1', [id]);

      await client.query('COMMIT');
      if (catIcon && catIcon.startsWith('/uploads/icons/')) {
        await deleteLocalImage(catIcon).catch(console.error);
      }
      await invalidateCache();
      res.json({
        message: gamesCount > 0
          ? `Category deleted and ${gamesCount} game(s) reassigned to '${destinationCategoryName}' successfully`
          : 'Category deleted successfully'
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

/**
 * POST /api/categories/:id/games - Bulk assign games to a category
 */
router.post('/:id/games', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { gameIds } = req.body;

  if (!Array.isArray(gameIds)) {
    return res.status(400).json({ error: 'gameIds array is required' });
  }

  try {
    const catRes = await pool.query('SELECT name FROM categories WHERE id = $1', [id]);
    if (catRes.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    const catName = catRes.rows[0].name;

    await pool.query(
      'UPDATE games SET category = $1 WHERE id = ANY($2::uuid[])',
      [catName, gameIds]
    );

    await invalidateCache();
    res.json({ message: `Successfully assigned ${gameIds.length} games to category ${catName}` });
  } catch (err) {
    console.error('Error assigning games to category:', err);
    res.status(500).json({ error: 'Failed to assign games to category' });
  }
});

/**
 * DELETE /api/categories/:id/games - Bulk move games from one category to another
 */
router.delete('/:id/games', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { gameIds, targetCategoryId, targetCategoryName } = req.body;

  if (!Array.isArray(gameIds) || gameIds.length === 0) {
    return res.status(400).json({ error: 'gameIds array is required' });
  }

  if (!targetCategoryId && !targetCategoryName) {
    return res.status(400).json({ error: 'Target category is required to reassign removed games.' });
  }

  try {
    const catRes = await pool.query('SELECT name FROM categories WHERE id = $1', [id]);
    if (catRes.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    const catName = catRes.rows[0].name;

    let targetRes;
    if (targetCategoryId) {
      targetRes = await pool.query('SELECT name FROM categories WHERE id = $1 AND id <> $2', [targetCategoryId, id]);
    } else {
      targetRes = await pool.query('SELECT name FROM categories WHERE LOWER(name) = LOWER($1) AND id <> $2', [targetCategoryName, id]);
    }

    if (targetRes.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or missing target category.' });
    }

    const destinationCategoryName = targetRes.rows[0].name;

    await pool.query(
      'UPDATE games SET category = $1 WHERE id = ANY($2::uuid[]) AND LOWER(category) = LOWER($3)',
      [destinationCategoryName, gameIds, catName]
    );

    await invalidateCache();
    res.json({ message: `Successfully moved ${gameIds.length} game(s) to category '${destinationCategoryName}'` });
  } catch (err) {
    console.error('Error removing games from category:', err);
    res.status(500).json({ error: 'Failed to remove games from category' });
  }
});

export default router;
