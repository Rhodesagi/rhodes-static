import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { query } from '../config/database';

// Middleware to validate store exists and optionally check ownership
export function validateStoreAccess(requireOwnership: boolean = false) {
    return async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        const storeId = req.params.storeId || req.body.storeId;
        
        if (!storeId) {
            res.status(400).json({ error: 'Store ID required' });
            return;
        }

        try {
            // Get store details
            const storeResult = await query(
                'SELECT id, owner_id, is_active, slug FROM stores WHERE id = $1',
                [storeId]
            );

            if (storeResult.rowCount === 0) {
                res.status(404).json({ error: 'Store not found' });
                return;
            }

            const store = storeResult.rows[0];

            // Check if store is active (for customer-facing routes)
            if (!requireOwnership && !store.is_active) {
                res.status(404).json({ error: 'Store not found or inactive' });
                return;
            }

            // Check ownership for merchant routes
            if (requireOwnership) {
                if (!req.user) {
                    res.status(401).json({ error: 'Authentication required' });
                    return;
                }

                if (store.owner_id !== req.user.id) {
                    res.status(403).json({ error: 'You do not own this store' });
                    return;
                }
            }

            // Attach store to request for downstream use
            (req as any).store = store;
            next();
        } catch (err) {
            console.error('Error validating store access:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}

// Helper function to validate product belongs to store (tenant isolation check)
export async function validateProductBelongsToStore(
    productId: string,
    storeId: string
): Promise<boolean> {
    const result = await query(
        'SELECT 1 FROM products WHERE id = $1 AND store_id = $2 AND deleted_at IS NULL',
        [productId, storeId]
    );
    return result.rowCount !== null && result.rowCount > 0;
}

// Helper to ensure cart items are all from the same store (prevent cross-store checkout)
export async function validateCartStoreConsistency(
    userId: string,
    storeId: string
): Promise<boolean> {
    const result = await query(
        `SELECT DISTINCT store_id FROM cart_items WHERE user_id = $1`,
        [userId],
        userId
    );
    
    if (result.rowCount === 0) {
        return true; // Empty cart is valid
    }
    
    // All items must be from the same store
    const storeIds = result.rows.map(r => r.store_id);
    return storeIds.length === 1 && storeIds[0] === storeId;
}