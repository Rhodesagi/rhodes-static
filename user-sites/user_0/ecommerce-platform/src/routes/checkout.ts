import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { query, withTransaction } from '../config/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { createPaymentIntent, STRIPE_PUBLISHABLE_KEY } from '../config/stripe';
import { checkInventoryAvailability, reserveInventory } from '../utils/inventory';
import { generateIdempotencyKey, checkExistingOrder } from '../utils/idempotency';
import { createOrder } from './orders';

const router = Router();

// Get Stripe publishable key (public)
router.get('/config', (req, res) => {
    res.json({ publishableKey: STRIPE_PUBLISHABLE_KEY });
});

// Create checkout session (initiates payment)
router.post(
    '/',
    authenticateToken,
    [
        body('storeId').isUUID(),
        body('shippingAddress').isObject(),
        body('billingAddress').isObject(),
        body('customerEmail').isEmail(),
        body('customerName').trim().notEmpty(),
    ],
    async (req: AuthenticatedRequest, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }

        const userId = req.user!.id;
        const { storeId, shippingAddress, billingAddress, customerEmail, customerName } = req.body;

        try {
            // Get cart items for this store
            const cartResult = await query(
                `SELECT 
                    ci.id as cart_item_id,
                    ci.quantity,
                    ci.product_id,
                    p.name as product_name,
                    p.sku,
                    p.images,
                    p.price,
                    p.stock
                 FROM cart_items ci
                 JOIN products p ON ci.product_id = p.id
                 WHERE ci.user_id = $1 AND ci.store_id = $2 AND p.deleted_at IS NULL AND p.is_active = true`,
                [userId, storeId],
                userId
            );

            if (cartResult.rowCount === 0) {
                res.status(400).json({ error: 'Cart is empty for this store' });
                return;
            }

            // Validate all items have sufficient stock
            const inventoryChecks = await checkInventoryAvailability(
                cartResult.rows.map(item => ({
                    productId: item.product_id,
                    quantity: item.quantity,
                    storeId,
                }))
            );

            const insufficientItems = inventoryChecks.filter(check => !check.available);
            if (insufficientItems.length > 0) {
                res.status(409).json({
                    error: 'Some items have insufficient stock',
                    insufficientItems,
                });
                return;
            }

            // Check for cross-store cart items
            const storeCheck = await query(
                `SELECT DISTINCT store_id FROM cart_items WHERE user_id = $1`,
                [userId],
                userId
            );

            if (storeCheck.rows.length > 1) {
                res.status(400).json({
                    error: 'Cart contains items from multiple stores. Please checkout one store at a time.',
                    stores: storeCheck.rows.map(r => r.store_id),
                });
                return;
            }

            // Generate idempotency key
            const idempotencyKey = generateIdempotencyKey(
                cartResult.rows.map(item => ({ productId: item.product_id, quantity: item.quantity })),
                userId
            );

            // Check if order already exists with this key
            const existingOrderId = await checkExistingOrder(idempotencyKey);
            if (existingOrderId) {
                // Return existing order info
                const existingOrder = await query(
                    'SELECT * FROM orders WHERE id = $1',
                    [existingOrderId]
                );
                res.json({
                    message: 'Order already exists',
                    orderId: existingOrderId,
                    order: existingOrder.rows[0],
                });
                return;
            }

            // Calculate totals
            const items = cartResult.rows.map(item => ({
                productId: item.product_id,
                quantity: item.quantity,
                price: parseFloat(item.price),
                name: item.product_name,
                sku: item.sku,
                image: item.images?.[0] || null,
            }));

            const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const total = subtotal; // Simplified - add tax/shipping logic here

            // Create order in pending state
            const { orderId } = await withTransaction(async (client) => {
                // Reserve inventory atomically
                const reserveResult = await reserveInventory(
                    client,
                    items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        storeId,
                    }))
                );

                if (!reserveResult.success) {
                    throw new Error('Inventory reservation failed');
                }

                // Create order
                const orderResult = await createOrder(client, {
                    storeId,
                    customerId: userId,
                    customerEmail,
                    customerName,
                    items,
                    shippingAddress,
                    billingAddress,
                    idempotencyKey,
                });

                // Clear cart items for this store
                await client.query(
                    'DELETE FROM cart_items WHERE user_id = $1 AND store_id = $2',
                    [userId, storeId]
                );

                return orderResult;
            }, userId);

            // Create PaymentIntent with Stripe
            const paymentIntent = await createPaymentIntent(
                total,
                'usd',
                idempotencyKey,
                {
                    orderId,
                    storeId,
                    userId,
                }
            );

            // Update order with payment intent ID
            await query(
                'UPDATE orders SET payment_intent_id = $1 WHERE id = $2',
                [paymentIntent.id, orderId]
            );

            res.json({
                orderId,
                clientSecret: paymentIntent.client_secret,
                amount: total,
            });
        } catch (err: any) {
            console.error('Checkout error:', err);
            res.status(500).json({ error: 'Checkout failed', details: err.message });
        }
    }
);

export default router;