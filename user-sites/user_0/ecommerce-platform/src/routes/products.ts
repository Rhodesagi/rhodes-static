import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import slugify from 'slugify';
import { query, withTransaction } from '../config/database';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { validateStoreAccess, validateProductBelongsToStore } from '../middleware/tenant';

const router = Router();

// List products for a store (public)
router.get('/store/:storeId', async (req, res) => {
    const storeId = req.params.storeId;
    const { category, search, minPrice, maxPrice, sort = 'created_at', order = 'desc' } = req.query;

    try {
        // Validate store exists and is active
        const store = await query(
            'SELECT id FROM stores WHERE id = $1 AND is_active = true',
            [storeId]
        );

        if (store.rowCount === 0) {
            res.status(404).json({ error: 'Store not found' });
            return;
        }

        // Build query with tenant isolation
        let whereClause = 'WHERE p.store_id = $1 AND p.deleted_at IS NULL AND p.is_active = true';
        const params: any[] = [storeId];
        let paramCount = 1;

        if (category) {
            paramCount++;
            whereClause += ` AND p.category_id = $${paramCount}`;
            params.push(category);
        }

        if (search) {
            paramCount++;
            whereClause += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        if (minPrice) {
            paramCount++;
            whereClause += ` AND p.price >= $${paramCount}`;
            params.push(parseFloat(minPrice as string));
        }

        if (maxPrice) {
            paramCount++;
            whereClause += ` AND p.price <= $${paramCount}`;
            params.push(parseFloat(maxPrice as string));
        }

        const validSortColumns = ['created_at', 'price', 'name', 'stock'];
        const sortColumn = validSortColumns.includes(sort as string) ? sort : 'created_at';
        const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

        const result = await query(
            `SELECT p.*, c.name as category_name 
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             ${whereClause}
             ORDER BY p.${sortColumn} ${sortOrder}`,
            params
        );

        res.json(result.rows);
    } catch (err) {
        console.error('List products error:', err);
        res.status(500).json({ error: 'Failed to list products' });
    }
});

// Get single product (public)
router.get('/:productId', async (req, res) => {
    try {
        const result = await query(
            `SELECT p.*, c.name as category_name, s.name as store_name, s.slug as store_slug
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             JOIN stores s ON p.store_id = s.id
             WHERE p.id = $1 AND p.deleted_at IS NULL AND p.is_active = true AND s.is_active = true`,
            [req.params.productId]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Get product error:', err);
        res.status(500).json({ error: 'Failed to get product' });
    }
});

// Get product by slug (public)
router.get('/by-slug/:storeSlug/:productSlug', async (req, res) => {
    const { storeSlug, productSlug } = req.params;

    try {
        const result = await query(
            `SELECT p.*, c.name as category_name, s.name as store_name, s.slug as store_slug
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             JOIN stores s ON p.store_id = s.id
             WHERE s.slug = $1 AND p.slug = $2 AND p.deleted_at IS NULL 
               AND p.is_active = true AND s.is_active = true`,
            [storeSlug, productSlug]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Get product by slug error:', err);
        res.status(500).json({ error: 'Failed to get product' });
    }
});

// Create product (store owner only)
router.post(
    '/',
    authenticateToken,
    requireRole('merchant'),
    [
        body('storeId').isUUID(),
        body('name').trim().notEmpty(),
        body('price').isFloat({ min: 0 }),
        body('stock').isInt({ min: 0 }),
        body('description').optional().trim(),
        body('categoryId').optional().isUUID(),
        body('sku').optional().trim(),
    ],
    async (req: AuthenticatedRequest, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }

        const { storeId, name, description, price, stock, categoryId, sku, images } = req.body;
        const slug = slugify(name, { lower: true, strict: true });

        try {
            // Verify ownership
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

            // Check slug uniqueness within store
            const existing = await query(
                'SELECT id FROM products WHERE slug = $1 AND store_id = $2 AND deleted_at IS NULL',
                [slug, storeId]
            );

            if (existing.rowCount && existing.rowCount > 0) {
                res.status(409).json({ error: 'Product name already exists in this store' });
                return;
            }

            const result = await query(
                `INSERT INTO products (store_id, category_id, name, description, slug, price, stock, sku, images) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                [storeId, categoryId || null, name, description, slug, price, stock, sku || null, images || '[]']
            );

            res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error('Create product error:', err);
            res.status(500).json({ error: 'Failed to create product' });
        }
    }
);

// Update product (store owner only)
router.put(
    '/:productId',
    authenticateToken,
    requireRole('merchant'),
    async (req: AuthenticatedRequest, res) => {
        const productId = req.params.productId;

        try {
            // Get product and verify ownership via store
            const product = await query(
                `SELECT p.*, s.owner_id 
                 FROM products p
                 JOIN stores s ON p.store_id = s.id
                 WHERE p.id = $1 AND p.deleted_at IS NULL`,
                [productId]
            );

            if (product.rowCount === 0) {
                res.status(404).json({ error: 'Product not found' });
                return;
            }

            if (product.rows[0].owner_id !== req.user!.id) {
                res.status(403).json({ error: 'Not authorized' });
                return;
            }

            // Build update query
            const updates: string[] = [];
            const values: any[] = [];
            let paramCount = 1;

            const fields = ['name', 'description', 'price', 'stock', 'sku', 'categoryId', 'isActive', 'images'];
            const dbFields: Record<string, string> = {
                categoryId: 'category_id',
                isActive: 'is_active',
            };

            for (const field of fields) {
                if (req.body[field] !== undefined) {
                    const dbField = dbFields[field] || field;
                    updates.push(`${dbField} = $${paramCount++}`);
                    values.push(req.body[field]);
                }
            }

            if (req.body.name && req.body.name !== product.rows[0].name) {
                const newSlug = slugify(req.body.name, { lower: true, strict: true });
                updates.push(`slug = $${paramCount++}`);
                values.push(newSlug);
            }

            if (updates.length === 0) {
                res.status(400).json({ error: 'No fields to update' });
                return;
            }

            values.push(productId);

            const result = await query(
                `UPDATE products SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $${paramCount} RETURNING *`,
                values
            );

            res.json(result.rows[0]);
        } catch (err) {
            console.error('Update product error:', err);
            res.status(500).json({ error: 'Failed to update product' });
        }
    }
);

// Delete product (soft delete - store owner only)
router.delete('/:productId', authenticateToken, requireRole('merchant'), async (req: AuthenticatedRequest, res) => {
    const productId = req.params.productId;

    try {
        const product = await query(
            `SELECT p.*, s.owner_id 
             FROM products p
             JOIN stores s ON p.store_id = s.id
             WHERE p.id = $1 AND p.deleted_at IS NULL`,
            [productId]
        );

        if (product.rowCount === 0) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        if (product.rows[0].owner_id !== req.user!.id) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }

        await query(
            'UPDATE products SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [productId]
        );

        res.json({ message: 'Product deleted' });
    } catch (err) {
        console.error('Delete product error:', err);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Get store categories (public)
router.get('/store/:storeId/categories', async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM categories WHERE store_id = $1 ORDER BY name',
            [req.params.storeId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Get categories error:', err);
        res.status(500).json({ error: 'Failed to get categories' });
    }
});

// Create category (store owner only)
router.post(
    '/store/:storeId/categories',
    authenticateToken,
    requireRole('merchant'),
    [body('name').trim().notEmpty()],
    async (req: AuthenticatedRequest, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }

        const storeId = req.params.storeId;
        const { name, description } = req.body;
        const slug = slugify(name, { lower: true, strict: true });

        try {
            // Verify ownership
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

            const result = await query(
                'INSERT INTO categories (store_id, name, description, slug) VALUES ($1, $2, $3, $4) RETURNING *',
                [storeId, name, description, slug]
            );

            res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error('Create category error:', err);
            res.status(500).json({ error: 'Failed to create category' });
        }
    }
);

export default router;