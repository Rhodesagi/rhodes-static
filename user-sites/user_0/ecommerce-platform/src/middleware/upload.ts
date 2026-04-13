import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Ensure upload directories exist
const uploadBaseDir = path.join(process.cwd(), 'uploads');

export function ensureUploadDir(storeId: string): string {
    const storeDir = path.join(uploadBaseDir, `store-${storeId}`);
    if (!fs.existsSync(storeDir)) {
        fs.mkdirSync(storeDir, { recursive: true });
    }
    return storeDir;
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
        // Store ID should be in request params or body
        const storeId = req.params.storeId || req.body.storeId;
        if (!storeId) {
            cb(new Error('Store ID required for upload'), '');
            return;
        }
        const dir = ensureUploadDir(storeId);
        cb(null, dir);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
        // Generate unique filename with original extension
        const uniqueName = `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`;
        cb(null, uniqueName);
    },
});

// File filter for images only
const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP allowed.'));
    }
};

// Multer upload middleware
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
        files: 5, // Max 5 files per upload
    },
});

// Get public URL for uploaded file
export function getFileUrl(storeId: string, filename: string): string {
    const port = process.env.PORT || 3001;
    const host = process.env.NODE_ENV === 'production' 
        ? '' // Use relative URLs in production
        : `http://localhost:${port}`;
    return `${host}/uploads/store-${storeId}/${filename}`;
}