import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Generate idempotency key for order creation
// Based on cart contents and timestamp to prevent duplicate orders
export function generateIdempotencyKey(
    cartItems: Array<{ productId: string; quantity: number }>,
    userId: string
): string {
    // Sort items for consistent hashing
    const sortedItems = [...cartItems].sort((a, b) => 
        a.productId.localeCompare(b.productId)
    );
    
    // Create content hash
    const content = JSON.stringify(sortedItems) + userId + Date.now();
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    return `order-${hash.substring(0, 16)}`;
}

// Generate unique key for PaymentIntent
export function generatePaymentIntentKey(orderId: string): string {
    return `pi-${orderId}-${Date.now()}`;
}

// Simple in-memory idempotency cache (use Redis in production)
const processedKeys = new Set<string>();

// Check if key has been processed
export function isKeyProcessed(key: string): boolean {
    return processedKeys.has(key);
}

// Mark key as processed
export function markKeyProcessed(key: string): void {
    processedKeys.add(key);
    
    // Clean up old keys periodically (simplified - use Redis TTL in production)
    if (processedKeys.size > 10000) {
        const keysToDelete = Array.from(processedKeys).slice(0, 5000);
        keysToDelete.forEach(k => processedKeys.delete(k));
    }
}

// Generate unique order number
export function generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
}

import { query } from '../config/database';

// Check database for existing order with this idempotency key
export async function checkExistingOrder(idempotencyKey: string): Promise<string | null> {
    const result = await query(
        'SELECT id FROM orders WHERE idempotency_key = $1',
        [idempotencyKey]
    );
    
    if (result.rowCount && result.rowCount > 0) {
        return result.rows[0].id;
    }
    
    return null;
}