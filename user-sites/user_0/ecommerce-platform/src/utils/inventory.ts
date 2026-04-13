import { PoolClient } from 'pg';
import { withTransaction } from '../config/database';

// Inventory check result
interface InventoryCheck {
    productId: string;
    requestedQuantity: number;
    available: boolean;
    currentStock: number;
}

// Check inventory availability for multiple items (pre-order validation)
export async function checkInventoryAvailability(
    items: Array<{ productId: string; quantity: number; storeId: string }>
): Promise<InventoryCheck[]> {
    return withTransaction(async (client) => {
        const checks: InventoryCheck[] = [];
        
        for (const item of items) {
            const result = await client.query(
                `SELECT stock FROM products 
                 WHERE id = $1 AND store_id = $2 AND deleted_at IS NULL AND is_active = true`,
                [item.productId, item.storeId]
            );
            
            const availableStock = result.rows[0]?.stock || 0;
            checks.push({
                productId: item.productId,
                requestedQuantity: item.quantity,
                available: availableStock >= item.quantity,
                currentStock: availableStock,
            });
        }
        
        return checks;
    });
}

// Reserve inventory for order (atomic deduction)
// Returns true if all items reserved successfully, false otherwise
export async function reserveInventory(
    client: PoolClient,
    items: Array<{ productId: string; quantity: number; storeId: string }>
): Promise<{ success: boolean; failedItems: string[] }> {
    const failedItems: string[] = [];
    
    for (const item of items) {
        const result = await client.query<{ stock: number }>(
            `UPDATE products 
             SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND store_id = $3 AND stock >= $1 AND deleted_at IS NULL
             RETURNING stock`,
            [item.quantity, item.productId, item.storeId]
        );
        
        if (result.rowCount === 0) {
            failedItems.push(item.productId);
        }
    }
    
    return {
        success: failedItems.length === 0,
        failedItems,
    };
}

// Release reserved inventory (on order cancellation or failure)
export async function releaseInventory(
    client: PoolClient,
    items: Array<{ productId: string; quantity: number; storeId: string }>
): Promise<void> {
    for (const item of items) {
        await client.query(
            `UPDATE products 
             SET stock = stock + $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND store_id = $3`,
            [item.quantity, item.productId, item.storeId]
        );
    }
}

// Get inventory status for store dashboard
export async function getStoreInventoryStatus(storeId: string) {
    const result = await query(
        `SELECT 
            COUNT(*) as total_products,
            COUNT(*) FILTER (WHERE stock = 0) as out_of_stock,
            COUNT(*) FILTER (WHERE stock < 10 AND stock > 0) as low_stock,
            SUM(stock) as total_inventory,
            AVG(stock) as avg_stock
         FROM products 
         WHERE store_id = $1 AND deleted_at IS NULL`,
        [storeId]
    );
    
    return result.rows[0];
}