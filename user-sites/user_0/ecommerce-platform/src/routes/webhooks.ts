import { Router, raw } from 'express';
import Stripe from 'stripe';
import { query, withTransaction } from '../config/database';
import { constructWebhookEvent, stripe } from '../config/stripe';
import { releaseInventory } from '../utils/inventory';

const router = Router();

// Use raw body for webhook signature verification
router.post('/', raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
        res.status(400).json({ error: 'Missing stripe-signature header' });
        return;
    }

    let event: Stripe.Event;

    try {
        event = constructWebhookEvent(req.body, sig);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        res.status(400).json({ error: 'Invalid signature' });
        return;
    }

    console.log('Webhook received:', event.type);

    try {
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await handlePaymentSuccess(paymentIntent);
                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await handlePaymentFailure(paymentIntent);
                break;
            }

            case 'payment_intent.canceled': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await handlePaymentCancellation(paymentIntent);
                break;
            }

            // Handle refund events
            case 'charge.refunded': {
                const charge = event.data.object as Stripe.Charge;
                await handleRefund(charge);
                break;
            }
        }

        res.json({ received: true });
    } catch (err) {
        console.error('Webhook processing error:', err);
        // Still return 200 to avoid Stripe retries for unrecoverable errors
        res.json({ received: true, error: 'Processing error logged' });
    }
});

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata?.orderId;
    
    if (!orderId) {
        console.error('No orderId in payment intent metadata');
        return;
    }

    await withTransaction(async (client) => {
        // Update order status
        const result = await client.query(
            `UPDATE orders 
             SET payment_status = 'completed', status = 'paid', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND payment_status = 'pending'
             RETURNING id`,
            [orderId]
        );

        if (result.rowCount === 0) {
            console.log(`Order ${orderId} already processed or not found`);
            return;
        }

        // Log successful payment
        console.log(`Payment successful for order ${orderId}`);

        // Additional post-payment processing:
        // - Send confirmation email (queue for async processing)
        // - Update analytics
        // - Notify merchant
    });
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata?.orderId;
    
    if (!orderId) {
        console.error('No orderId in payment intent metadata');
        return;
    }

    await withTransaction(async (client) => {
        // Get order items to release inventory
        const items = await client.query(
            'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
            [orderId]
        );

        // Release inventory
        for (const item of items.rows) {
            await client.query(
                `UPDATE products SET stock = stock + $1 
                 WHERE id = $2`,
                [item.quantity, item.product_id]
            );
        }

        // Update order status
        await client.query(
            `UPDATE orders 
             SET payment_status = 'failed', status = 'cancelled', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [orderId]
        );

        console.log(`Payment failed for order ${orderId}, inventory released`);
    });
}

async function handlePaymentCancellation(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata?.orderId;
    
    if (!orderId) {
        console.error('No orderId in payment intent metadata');
        return;
    }

    await withTransaction(async (client) => {
        // Get order items to release inventory
        const items = await client.query(
            'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
            [orderId]
        );

        // Release inventory
        for (const item of items.rows) {
            await client.query(
                `UPDATE products SET stock = stock + $1 
                 WHERE id = $2`,
                [item.quantity, item.product_id]
            );
        }

        // Update order status
        await client.query(
            `UPDATE orders 
             SET payment_status = 'failed', status = 'cancelled', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [orderId]
        );

        console.log(`Payment cancelled for order ${orderId}, inventory released`);
    });
}

async function handleRefund(charge: Stripe.Charge) {
    // Find order by payment intent
    const orderResult = await query(
        'SELECT id FROM orders WHERE payment_intent_id = $1',
        [charge.payment_intent]
    );

    if (orderResult.rowCount === 0) {
        console.log('No order found for refund');
        return;
    }

    const orderId = orderResult.rows[0].id;

    await withTransaction(async (client) => {
        // Update order status to refunded
        await client.query(
            `UPDATE orders 
             SET status = 'refunded', payment_status = 'refunded', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [orderId]
        );

        console.log(`Order ${orderId} marked as refunded`);
    });
}

export default router;