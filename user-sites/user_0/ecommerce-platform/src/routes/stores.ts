import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import slugify from 'slugify';
import { query } from '../config/database';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// List all active stores (public)
router.get('/', async (req, res) => {
    try {
        const result = await query(
            `SELECT s.*, u.full_name as owner_name 
             FROM stores s
             JOIN users u ON s.owner_id = u.id
             WHERE s.is_active = true
             ORDER BY s.created_at DESC`,
            []
        );

        res.json(result.rows);
    } catch (err) {
        console.error('List stores error:', err);
        res.status(500).json({ error: 'Failed to list stores' });
    }
});

// Get store by slug (public)
router.get('/by-slug/:slug', async (req, res) => {
    try {
        const result = await query(
            `SELECT s.*, u.full_name as owner_name 
             FROM stores s
             JOIN users u ON s.owner_id = u.id
             WHERE s.slug = $1 AND s.is_active = true`,
            [req.params.slug]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Store not found' });
            return;
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Get store error:', err);
        res.status(500).json({ error: 'Failed to get store' });
    }
});

// Get store by ID (public)
router.get('/:storeId', async (req, res) => {
    try {
        const result = await query(
            `SELECT s.*, u.full_name as owner_name 
             FROM stores s
             JOIN users u ON s.owner_id = u.id
             WHERE s.id = $1 AND s.is_active = true`,
            [req.params.storeId]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Store not found' });
            return;
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Get store error:', err);
        res.status(500).json({ error: 'Failed to get store' });
    }
});

// Create store (merchants only)
router.post(
    '/',
    authenticateToken,
    requireRole('merchant'),
    [
        body('name').trim().notEmpty().isLength({ max: 255 }),
        body('description').optional().trim(),
    ],
    async (req: AuthenticatedRequest, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }

        const { name, description } = req.body;
        const slug = slugify(name, { lower: true, strict: true });

        try {
            // Check slug uniqueness
            const existing = await query(
                'SELECT id FROM stores WHERE slug = $1',
                [slug]
            );

            if (existing.rowCount && existing.rowCount > 0) {
                res.status(409).json({ error: 'Store name already taken' });
                return;
            }

            const result = await query(
                `INSERT INTO stores (owner_id, name, description, slug) 
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [req.user!.id, name, description, slug]
            );

            res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error('Create store error:', err);
            res.status(500).json({ error: 'Failed to create store' });
        }
    }
);

// Update store (owner only)
router.put(
    '/:storeId',
    authenticateToken,
    requireRole('merchant'),
    [
        body('name').optional().trim().notEmpty(),
        body('description').optional().trim(),
        body('isActive').optional().isBoolean(),
    ],
    async (req: AuthenticatedRequest, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }

        const storeId = req.params.storeId;

        try {
            // Check ownership
            const store = await query(
                'SELECT owner_id FROM stores WHERE id = $1',
                [storeId]
            );

            if (store.rowCount === 0) {
                res.status(404).json({ error: 'Store not found' });
                return;
            }

            if (store.rows[0].owner_id !== req.user!.id) {
                res.status(403).json({ error: 'Not authorized' });
                return;
            }

            // Build update query dynamically
            const updates: string[] = [];
            const values: any[] = [];
            let paramCount = 1;

            if (req.body.name !== undefined) {
                updates.push(`name = $${paramCount++}`);
                values.push(req.body.name);
            }
            if (req.body.description !== undefined) {
                updates.push(`description = $${paramCount++}`);
                values.push(req.body.description);
            }
            if (req.body.isActive !== undefined) {
                updates.push(`is_active = $${paramCount++}`);
                values.push(req.body.isActive);
            }

            if (updates.length === 0) {
                res.status(400).json({ error: 'No fields to update' });
                return;
            }

            values.push(storeId);

            const result = await query(
                `UPDATE stores SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $${paramCount} RETURNING *`,
                values
            );

            res.json(result.rows[0]);
        } catch (err) {
            console.error('Update store error:', err);
            res.status(500).json({ error: 'Failed to update store' });
        }
    }
);

// Get merchant's stores
router.get('/my/stores', authenticateToken, requireRole('merchant'), async (req: AuthenticatedRequest, res) => {
    try {
        const result = await query(
            'SELECT * FROM stores WHERE owner_id = $1 ORDER BY created_at DESC',
            [req.user!.id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Get my stores error:', err);
        res.status(500).json({ error: 'Failed to get stores' });
    }
});

// Delete store (soft delete - owner only)
router.delete('/:storeId', authenticateToken, requireRole('merchant'), async (req: AuthenticatedRequest, res) => {
    const storeId = req.params.storeId;

    try {
        const store = await query(
            'SELECT owner_id FROM stores WHERE id = $1',
            [storeId]
        );

        if (store.rowCount === 0) {
            res.status(404).json({ error: 'Store not found' });
            return;
        }

        if (store.rows[0].owner_id !== req.user!.id) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }

        await query(
            'UPDATE stores SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [storeId]
        );

        res.json({ message: 'Store deactivated' });
    } catch (err) {
        console.error('Delete store error:', err);
        res.status(500).json({ error: 'Failed to delete store' });
    }
});

export default router;