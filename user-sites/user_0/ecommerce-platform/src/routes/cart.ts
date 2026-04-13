import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { query, withTransaction } from '../config/database';
import { authenticateToken, optionalAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Helper to validate product availability
async function validateProduct(productId: string, storeId: string, quantity: number) {
    const product = await query(
        `SELECT id, name, price, stock, store_id 
         FROM products 
         WHERE id = $1 AND store_id = $2 AND deleted_at IS NULL AND is_active = true`,
        [productId, storeId]
    );

    if (product.rowCount === 0) {
        return { valid: false, error: 'Product not found' };
    }

    if (product.rows[0].stock < quantity) {
        return { valid: false, error: `Insufficient stock. Available: ${product.rows[0].stock}` };
    }

    return { valid: true, product: product.rows[0] };
}

// Add item to cart (requires auth)
router.post(
    '/',
    authenticateToken,
    [
        body('productId').isUUID(),
        body('quantity').isInt({ min: 1 }),
        body('storeId').isUUID(),
    ],
    async (req: AuthenticatedRequest, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }

        const { productId, quantity, storeId } = req.body;
        const userId = req.user!.id;

        try {
            // Validate product
            const validation = await validateProduct(productId, storeId, quantity);
            if (!validation.valid) {
                res.status(400).json({ error: validation.error });
                return;
            }

            // Check if item already in cart
            const existing = await query(
                'SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2',
                [userId, productId],
                userId
            );

            if (existing.rowCount && existing.rowCount > 0) {
                // Update quantity
                const newQuantity = existing.rows[0].quantity + quantity;
                
                // Check stock again for combined quantity
                if (validation.product.stock < newQuantity) {
                    res.status(400).json({ 
                        error: `Insufficient stock for combined quantity. Available: ${validation.product.stock}` 
                    });
                    return;
                }

                await query(
                    `UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $2`,
                    [newQuantity, existing.rows[0].id],
                    userId
                );
            } else {
                // Insert new cart item
                await query(
                    `INSERT INTO cart_items (user_id, store_id, product_id, quantity) 
                     VALUES ($1, $2, $3, $4)`,
                    [userId, storeId, productId, quantity],
                    userId
                );
            }

            // Return updated cart
            const cart = await getCartItems(userId);
            res.json(cart);
        } catch (err) {
            console.error('Add to cart error:', err);
            res.status(500).json({ error: 'Failed to add to cart' });
        }
    }
);

// Get cart items (requires auth)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const cart = await getCartItems(req.user!.id);
        res.json(cart);
    } catch (err) {
        console.error('Get cart error:', err);
        res.status(500).json({ error: 'Failed to get cart' });
    }
});

// Update cart item quantity (requires auth)
router.put(
    '/:itemId',
    authenticateToken,
    [body('quantity').isInt({ min: 0 })],
    async (req: AuthenticatedRequest, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }

        const { quantity } = req.body;
        const { itemId } = req.params;
        const userId = req.user!.id;

        try {
            if (quantity === 0) {
                // Remove item
                await query(
                    'DELETE FROM cart_items WHERE id = $1 AND user_id = $2',
                    [itemId, userId],
                    userId
                );
            } else {
                // Check product stock
                const item = await query(
                    `SELECT ci.*, p.stock FROM cart_items ci
                     JOIN products p ON ci.product_id = p.id
                     WHERE ci.id = $1 AND ci.user_id = $2`,
                    [itemId, userId],
                    userId
                );

                if (item.rowCount === 0) {
                    res.status(404).json({ error: 'Cart item not found' });
                    return;
                }

                if (item.rows[0].stock < quantity) {
                    res.status(400).json({ 
                        error: `Insufficient stock. Available: ${item.rows[0].stock}` 
                    });
                    return;
                }

                await query(
                    'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
                    [quantity, itemId, userId],
                    userId
                );
            }

            const cart = await getCartItems(userId);
            res.json(cart);
        } catch (err) {
            console.error('Update cart error:', err);
            res.status(500).json({ error: 'Failed to update cart' });
        }
    }
);

// Remove item from cart (requires auth)
router.delete('/:itemId', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        await query(
            'DELETE FROM cart_items WHERE id = $1 AND user_id = $2',
            [req.params.itemId, req.user!.id],
            req.user!.id
        );

        const cart = await getCartItems(req.user!.id);
        res.json(cart);
    } catch (err) {
        console.error('Remove from cart error:', err);
        res.status(500).json({ error: 'Failed to remove from cart' });
    }
});

// Clear cart (requires auth)
router.delete('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        await query(
            'DELETE FROM cart_items WHERE user_id = $1',
            [req.user!.id],
            req.user!.id
        );

        res.json({ items: [], total: 0 });
    } catch (err) {
        console.error('Clear cart error:', err);
        res.status(500).json({ error: 'Failed to clear cart' });
    }
});

// Merge guest cart (localStorage) with user cart on login
router.post(
    '/merge',
    authenticateToken,
    [body('items').isArray().notEmpty()],
    async (req: AuthenticatedRequest, res) => {
        const userId = req.user!.id;
        const { items } = req.body; // Array of { productId, quantity, storeId }

        try {
            await withTransaction(async (client) => {
                for (const item of items) {
                    // Validate product
                    const product = await client.query(
                        `SELECT id, name, price, stock, store_id 
                         FROM products 
                         WHERE id = $1 AND store_id = $2 AND deleted_at IS NULL AND is_active = true`,
                        [item.productId, item.storeId]
                    );

                    if (product.rowCount === 0) {
                        continue; // Skip invalid products
                    }

                    if (product.rows[0].stock < item.quantity) {
                        // Adjust to available stock
                        item.quantity = product.rows[0].stock;
                        if (item.quantity <= 0) continue;
                    }

                    // Check if already in cart
                    const existing = await client.query(
                        'SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2',
                        [userId, item.productId]
                    );

                    if (existing.rowCount && existing.rowCount > 0) {
                        const newQty = Math.min(
                            existing.rows[0].quantity + item.quantity,
                            product.rows[0].stock
                        );
                        await client.query(
                            'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                            [newQty, existing.rows[0].id]
                        );
                    } else {
                        await client.query(
                            `INSERT INTO cart_items (user_id, store_id, product_id, quantity) 
                             VALUES ($1, $2, $3, $4)`,
                            [userId, item.storeId, item.productId, item.quantity]
                        );
                    }
                }
            }, userId);

            const cart = await getCartItems(userId);
            res.json(cart);
        } catch (err) {
            console.error('Merge cart error:', err);
            res.status(500).json({ error: 'Failed to merge cart' });
        }
    }
);

// Helper function to get cart items with product details
async function getCartItems(userId: string) {
    const result = await query(
        `SELECT 
            ci.id as cart_item_id,
            ci.quantity,
            ci.store_id,
            s.name as store_name,
            s.slug as store_slug,
            p.id as product_id,
            p.name as product_name,
            p.slug as product_slug,
            p.price,
            p.images,
            p.stock as current_stock
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id AND p.deleted_at IS NULL
         JOIN stores s ON ci.store_id = s.id AND s.is_active = true
         WHERE ci.user_id = $1
         ORDER BY ci.created_at DESC`,
        [userId],
        userId
    );

    const items = result.rows.map(row => ({
        cartItemId: row.cart_item_id,
        quantity: row.quantity,
        store: {
            id: row.store_id,
            name: row.store_name,
            slug: row.store_slug,
        },
        product: {
            id: row.product_id,
            name: row.product_name,
            slug: row.product_slug,
            price: parseFloat(row.price),
            images: row.images,
            currentStock: row.current_stock,
        },
        subtotal: parseFloat(row.price) * row.quantity,
    }));

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    return { items, total };
}

export default router;