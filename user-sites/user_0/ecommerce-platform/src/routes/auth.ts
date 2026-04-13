import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';
import { generateToken, authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Register new user (merchant or customer)
router.post(
    '/register',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }),
        body('fullName').trim().notEmpty(),
        body('role').isIn(['merchant', 'customer']),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }

        const { email, password, fullName, role } = req.body;

        try {
            // Check if email already exists
            const existingUser = await query(
                'SELECT id FROM users WHERE email = $1',
                [email]
            );

            if (existingUser.rowCount && existingUser.rowCount > 0) {
                res.status(409).json({ error: 'Email already registered' });
                return;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const result = await query(
                `INSERT INTO users (email, password_hash, full_name, role) 
                 VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role`,
                [email, hashedPassword, fullName, role]
            );

            const user = result.rows[0];

            // Generate JWT
            const token = generateToken({
                id: user.id,
                email: user.email,
                role: user.role,
            });

            res.status(201).json({
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                },
                token,
            });
        } catch (err) {
            console.error('Registration error:', err);
            res.status(500).json({ error: 'Failed to create account' });
        }
    }
);

// Login
router.post(
    '/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }

        const { email, password } = req.body;

        try {
            // Find user
            const result = await query(
                'SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1',
                [email]
            );

            if (result.rowCount === 0) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            const user = result.rows[0];

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            // Generate JWT
            const token = generateToken({
                id: user.id,
                email: user.email,
                role: user.role,
            });

            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                },
                token,
            });
        } catch (err) {
            console.error('Login error:', err);
            res.status(500).json({ error: 'Login failed' });
        }
    }
);

// Get current user
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        const result = await query(
            'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1',
            [req.user!.id]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const user = result.rows[0];
        res.json({
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            createdAt: user.created_at,
        });
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

export default router;