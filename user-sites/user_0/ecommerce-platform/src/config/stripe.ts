import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is required');
}

// Initialize Stripe with latest API version
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    typescript: true,
});

// Stripe publishable key for frontend
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';

// Webhook secret for signature verification
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Create PaymentIntent with idempotency
export async function createPaymentIntent(
    amount: number,
    currency: string,
    idempotencyKey: string,
    metadata: Record<string, string>
): Promise<Stripe.PaymentIntent> {
    return stripe.paymentIntents.create(
        {
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toLowerCase(),
            automatic_payment_methods: { enabled: true },
            metadata,
        },
        {
            idempotencyKey,
        }
    );
}

// Verify webhook signature
export function constructWebhookEvent(
    payload: string | Buffer,
    signature: string
): Stripe.Event {
    return stripe.webhooks.constructEvent(
        payload,
        signature,
        STRIPE_WEBHOOK_SECRET
    );
}