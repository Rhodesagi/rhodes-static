import { Router } from 'express';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { upload, getFileUrl } from '../middleware/upload';
import { query } from '../config/database';
import path from 'path';
import fs from 'fs';

const router = Router();

// Upload product images (store owner only)
router.post(
    '/:storeId',
    authenticateToken,
    requireRole('merchant'),
    upload.array('images', 5),
    async (req: AuthenticatedRequest, res) => {
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
                // Clean up uploaded files
                if (req.files) {
                    (req.files as Express.Multer.File[]).forEach(file => {
                        fs.unlinkSync(file.path);
                    });
                }
                res.status(403).json({ error: 'Not authorized' });
                return;
            }

            if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
                res.status(400).json({ error: 'No files uploaded' });
                return;
            }

            const files = req.files as Express.Multer.File[];
            const uploadedUrls = files.map(file => getFileUrl(storeId, file.filename));

            // Optionally save upload metadata to database
            for (const file of files) {
                await query(
                    `INSERT INTO uploads (store_id, filename, original_name, mime_type, size_bytes, path)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [storeId, file.filename, file.originalname, file.mimetype, file.size, file.path]
                );
            }

            res.json({
                urls: uploadedUrls,
                files: files.map(f => ({
                    filename: f.filename,
                    originalName: f.originalname,
                    size: f.size,
                    mimetype: f.mimetype,
                })),
            });
        } catch (err) {
            console.error('Upload error:', err);
            // Clean up on error
            if (req.files) {
                (req.files as Express.Multer.File[]).forEach(file => {
                    try {
                        fs.unlinkSync(file.path);
                    } catch (e) {}
                });
            }
            res.status(500).json({ error: 'Upload failed' });
        }
    }
);

// Delete uploaded file (store owner only)
router.delete('/:storeId/:filename', authenticateToken, requireRole('merchant'), async (req: AuthenticatedRequest, res) => {
    const { storeId, filename } = req.params;

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

        // Check if file exists in uploads table
        const uploadRecord = await query(
            'SELECT path FROM uploads WHERE store_id = $1 AND filename = $2',
            [storeId, filename]
        );

        if (uploadRecord.rowCount === 0) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        const filePath = uploadRecord.rows[0].path;

        // Delete file from filesystem
        try {
            fs.unlinkSync(filePath);
        } catch (e) {
            console.error('Error deleting file:', e);
        }

        // Remove from database
        await query(
            'DELETE FROM uploads WHERE store_id = $1 AND filename = $2',
            [storeId, filename]
        );

        res.json({ message: 'File deleted' });
    } catch (err) {
        console.error('Delete upload error:', err);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// List uploads for a store (store owner only)
router.get('/:storeId', authenticateToken, requireRole('merchant'), async (req: AuthenticatedRequest, res) => {
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

        const uploads = await query(
            'SELECT id, filename, original_name, mime_type, size_bytes, created_at FROM uploads WHERE store_id = $1 ORDER BY created_at DESC',
            [storeId]
        );

        const uploadsWithUrls = uploads.rows.map(u => ({
            ...u,
            url: getFileUrl(storeId, u.filename),
            size: u.size_bytes,
        }));

        res.json(uploadsWithUrls);
    } catch (err) {
        console.error('List uploads error:', err);
        res.status(500).json({ error: 'Failed to list uploads' });
    }
});

export default router;