import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';

// JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

// Extended Request type with user
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: 'merchant' | 'customer';
    };
}

// JWT payload type
interface JWTPayload {
    userId: string;
    email: string;
    role: 'merchant' | 'customer';
    iat: number;
    exp: number;
}

// Generate JWT token
export function generateToken(user: { id: string; email: string; role: string }): string {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role,
        },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

// Verify JWT and attach user to request
export async function authenticateToken(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        
        // Verify user still exists in database
        const userResult = await query(
            'SELECT id, email, role FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rowCount === 0) {
            res.status(401).json({ error: 'User no longer exists' });
            return;
        }

        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };

        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
    }
}

// Optional authentication (for routes that work with or without login)
export async function optionalAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
            const userResult = await query(
                'SELECT id, email, role FROM users WHERE id = $1',
                [decoded.userId]
            );

            if (userResult.rowCount && userResult.rowCount > 0) {
                req.user = {
                    id: decoded.userId,
                    email: decoded.email,
                    role: decoded.role,
                };
            }
        } catch (err) {
            // Invalid token - continue without user
        }
    }

    next();
}

// Role-based authorization middleware
export function requireRole(role: 'merchant' | 'customer') {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        if (req.user.role !== role) {
            res.status(403).json({ error: `Role '${role}' required` });
            return;
        }

        next();
    };
}