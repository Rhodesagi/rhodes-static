import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { pool } from './config/database';
import authRoutes from './routes/auth';
import storeRoutes from './routes/stores';
import productRoutes from './routes/products';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import checkoutRoutes from './routes/checkout';
import webhookRoutes from './routes/webhooks';
import uploadRoutes from './routes/uploads';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'healthy', database: 'connected' });
    } catch (err) {
        res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
    }
});

// Webhook route needs raw body, so it comes before express.json()
app.use('/api/webhooks', webhookRoutes);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/uploads', uploadRoutes);

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../public')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    });
}

// Error handling middleware
interface CustomError extends Error {
    statusCode?: number;
}

app.use((err: CustomError, req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    
    // Handle multer errors
    if (err.name === 'MulterError') {
        res.status(400).json({ error: err.message });
        return;
    }
    
    res.status(err.statusCode || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message || 'Internal server error',
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing pool...');
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, closing pool...');
    await pool.end();
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;