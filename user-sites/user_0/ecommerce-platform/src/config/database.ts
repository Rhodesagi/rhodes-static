import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database connection pool configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Maximum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Handle pool errors
pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
    process.exit(-1);
});

// Database query helper with tenant context
export async function query<T = any>(
    text: string,
    params?: any[],
    userId?: string
): Promise<QueryResult<T>> {
    const client = await pool.connect();
    try {
        // Set tenant context if userId provided (for RLS policies)
        if (userId) {
            await client.query(`SET app.current_user_id = '${userId}'`);
        }
        
        const result = await client.query<T>(text, params);
        return result;
    } finally {
        // Reset context and release client
        if (userId) {
            await client.query(`SET app.current_user_id = ''`);
        }
        client.release();
    }
}

// Transaction helper
export async function withTransaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    userId?: string
): Promise<T> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        if (userId) {
            await client.query(`SET app.current_user_id = '${userId}'`);
        }
        
        const result = await callback(client);
        
        await client.query('COMMIT');
        return result;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        if (userId) {
            await client.query(`SET app.current_user_id = ''`);
        }
        client.release();
    }
}

// Atomic inventory deduction helper
// Returns the new stock level, or null if insufficient stock
export async function deductInventory(
    client: PoolClient,
    productId: string,
    storeId: string,
    quantity: number
): Promise<number | null> {
    const result = await client.query<{ stock: number }>(
        `UPDATE products 
         SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND store_id = $3 AND stock >= $1 AND deleted_at IS NULL
         RETURNING stock`,
        [quantity, productId, storeId]
    );
    
    if (result.rowCount === 0) {
        return null; // Insufficient stock or product not found
    }
    
    return result.rows[0].stock;
}

// Check and reserve inventory (for pre-payment reservation)
export async function checkInventory(
    client: PoolClient,
    productId: string,
    storeId: string,
    quantity: number
): Promise<boolean> {
    const result = await client.query(
        `SELECT stock FROM products 
         WHERE id = $1 AND store_id = $2 AND stock >= $3 AND deleted_at IS NULL AND is_active = true`,
        [productId, storeId, quantity]
    );
    return result.rowCount !== null && result.rowCount > 0;
}

export { pool };