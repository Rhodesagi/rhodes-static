import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { query, withTransaction } from '../config/database';
import { authenticateToken, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { reserveInventory, releaseInventory } from '../utils/inventory';

const router = Router();

// Get customer orders (requires auth)
router.get('/my-orders', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const result = await query(
            `SELECT 
                o.*,
                s.name as store_name,
                s.slug as store_slug,
                json_agg(
                    json_build_object(
                        'id', oi.id,
                        'productId', oi.product_id,
                        'productName', oi.product_name,
                        'price', oi.price,
                        'quantity', oi.quantity,
                        'subtotal', oi.subtotal
                    )
                ) as items
             FROM orders o
             JOIN stores s ON o.store_id = s.id
             LEFT JOIN order_items oi ON o.id = oi.order_id
             WHERE o.customer_id = $1
             GROUP BY o.id, s.name, s.slug
             ORDER BY o.created_at DESC`,
            [req.user!.id],
            req.user!.id
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Get customer orders error:', err);
        res.status(500).json({ error: 'Failed to get orders' });
    }
});

// Get store orders (merchant only)
router.get('/store/:storeId', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const storeId = req.params.storeId;

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

        const { status, page = '1', limit = '20' } = req.query;
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        let whereClause = 'WHERE o.store_id = $1';
        const params: any[] = [storeId];
        
        if (status) {
            whereClause += ' AND o.status = $2';
            params.push(status);
        }

        const result = await query(
            `SELECT 
                o.*,
                json_agg(
                    json_build_object(
                        'id', oi.id,
                        'productId', oi.product_id,
                        'productName', oi.product_name,
                        'price', oi.price,
                        'quantity', oi.quantity,
                        'subtotal', oi.subtotal
                    )
                ) as items
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             ${whereClause}
             GROUP BY o.id
             ORDER BY o.created_at DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, parseInt(limit as string), offset]
        );

        // Get total count for pagination
        const countResult = await query(
            `SELECT COUNT(*) FROM orders o ${whereClause}`,
            [storeId, ...(status ? [status] : [])]
        );

        res.json({
            orders: result.rows,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total: parseInt(countResult.rows[0].count),
                totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit as string)),
            },
        });
    } catch (err) {
        console.error('Get store orders error:', err);
        res.status(500).json({ error: 'Failed to get orders' });
    }
});

// Get single order (customer or store owner)
router.get('/:orderId', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const orderId = req.params.orderId;

    try {
        const result = await query(
            `SELECT 
                o.*,
                s.name as store_name,
                s.slug as store_slug,
                json_agg(
                    json_build_object(
                        'id', oi.id,
                        'productId', oi.product_id,
                        'productName', oi.product_name,
                        'productSku', oi.product_sku,
                        'productImage', oi.product_image,
                        'price', oi.price,
                        'quantity', oi.quantity,
                        'subtotal', oi.subtotal
                    )
                ) as items
             FROM orders o
             JOIN stores s ON o.store_id = s.id
             LEFT JOIN order_items oi ON o.id = oi.order_id
             WHERE o.id = $1
             GROUP BY o.id, s.name, s.slug`,
            [orderId]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        const order = result.rows[0];

        // Check authorization
        if (order.customer_id !== req.user!.id) {
            // Check if user is store owner
            const store = await query(
                'SELECT owner_id FROM stores WHERE id = $1',
                [order.store_id]
            );
            
            if (store.rows[0]?.owner_id !== req.user!.id) {
                res.status(403).json({ error: 'Not authorized' });
                return;
            }
        }

        res.json(order);
    } catch (err) {
        console.error('Get order error:', err);
        res.status(500).json({ error: 'Failed to get order' });
    }
});

// Update order status (store owner only)
router.put(
    '/:orderId/status',
    authenticateToken,
    [
        body('status').isIn(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
    ],
    async (req: AuthenticatedRequest, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }

        const orderId = req.params.orderId;
        const { status, notes } = req.body;

        try {
            // Get order and verify store ownership
            const order = await query(
                `SELECT o.*, s.owner_id 
                 FROM orders o
                 JOIN stores s ON o.store_id = s.id
                 WHERE o.id = $1`,
                [orderId]
            );

            if (order.rowCount === 0) {
                res.status(404).json({ error: 'Order not found' });
                return;
            }

            if (order.rows[0].owner_id !== req.user!.id) {
                res.status(403).json({ error: 'Not authorized' });
                return;
            }

            // If cancelling, release inventory
            if (status === 'cancelled' && order.rows[0].status !== 'cancelled') {
                await withTransaction(async (client) => {
                    const items = await client.query(
                        'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
                        [orderId]
                    );

                    for (const item of items.rows) {
                        await client.query(
                            `UPDATE products SET stock = stock + $1 
                             WHERE id = $2`,
                            [item.quantity, item.product_id]
                        );
                    }

                    await client.query(
                        `UPDATE orders SET status = $1, notes = COALESCE(notes, '') || $2, updated_at = CURRENT_TIMESTAMP 
                         WHERE id = $3`,
                        [status, `\n[${new Date().toISOString()}] Status: ${status}`, orderId]
                    );
                });
            } else {
                await query(
                    `UPDATE orders SET status = $1, notes = COALESCE(notes, '') || $2, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $3`,
                    [status, `\n[${new Date().toISOString()}] Status: ${status}`, orderId]
                );
            }

            res.json({ message: 'Order status updated', status });
        } catch (err) {
            console.error('Update order status error:', err);
            res.status(500).json({ error: 'Failed to update order' });
        }
    }
);

// Helper to create order from cart (used by checkout)
export async function createOrder(
    client: any,
    params: {
        storeId: string;
        customerId: string | null;
        customerEmail: string;
        customerName: string;
        items: Array<{
            productId: string;
            quantity: number;
            price: number;
            name: string;
            sku?: string;
            image?: string;
        }>;
        shippingAddress: any;
        billingAddress: any;
        idempotencyKey: string;
    }
): Promise<{ orderId: string; total: number }> {
    const subtotal = params.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = 0; // Simplified - would calculate based on jurisdiction
    const shippingAmount = 0; // Simplified
    const total = subtotal + taxAmount + shippingAmount;

    const orderResult = await client.query(
        `INSERT INTO orders (
            store_id, customer_id, customer_email, customer_name, status, payment_status,
            idempotency_key, subtotal, tax_amount, shipping_amount, total,
            shipping_address, billing_address
        ) VALUES ($1, $2, $3, $4, 'pending', 'pending', $5, $6, $7, $8, $9, $10, $11)
        RETURNING id`,
        [
            params.storeId,
            params.customerId,
            params.customerEmail,
            params.customerName,
            params.idempotencyKey,
            subtotal,
            taxAmount,
            shippingAmount,
            total,
            JSON.stringify(params.shippingAddress),
            JSON.stringify(params.billingAddress),
        ]
    );

    const orderId = orderResult.rows[0].id;

    // Insert order items
    for (const item of params.items) {
        await client.query(
            `INSERT INTO order_items (
                order_id, product_id, product_name, product_sku, product_image,
                price, quantity, subtotal
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                orderId,
                item.productId,
                item.name,
                item.sku || null,
                item.image || null,
                item.price,
                item.quantity,
                item.price * item.quantity,
            ]
        );
    }

    return { orderId, total };
}

export default router;