# Multi-Store E-Commerce Platform

A full-stack ecommerce platform similar to Shopify, where merchants can create stores, add products, manage orders, and customers can browse stores and make purchases.

## Features

### For Merchants
- Create and manage multiple stores
- Add, edit, and delete products with images
- Manage inventory with real-time stock tracking
- View and process orders
- Order status management (pending → paid → processing → shipped → delivered)

### For Customers
- Browse all active stores
- Add products to cart (guest or authenticated)
- Secure checkout with Stripe payment processing
- Order history
- Cart persistence across sessions

### Technical Features
- **Multi-tenant architecture** with strict store-level data isolation
- **Atomic inventory management** preventing overselling under concurrent load
- **Stripe integration** with PaymentIntents and webhook handling
- **JWT authentication** for secure API access
- **Guest cart support** with merge on login
- **Idempotency protection** preventing duplicate orders
- **Soft deletes** preserving order history
- **Image uploads** with multer and static file serving

## Architecture

### Backend (Node.js/TypeScript/Express)
- PostgreSQL with row-level security policies
- Repository pattern with tenant-scoped queries
- Transactional order creation with inventory reservation
- Stripe webhook handling for payment confirmation

### Frontend (React)
- React Router for navigation
- Context API for auth and cart state
- Tailwind CSS for styling
- Responsive design

## Database Schema

### Core Tables
- **users** - Authentication and roles (merchant/customer)
- **stores** - Merchant stores with owner relationship
- **products** - Store products with soft delete
- **orders** - Customer orders with status tracking
- **order_items** - Line items preserving product state at order time
- **cart_items** - Shopping cart for authenticated users

### Security
- Every query scoped by store_id
- JWT token validation on protected routes
- Store ownership verification for merchant operations

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Stripe account

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and Stripe credentials

# Initialize database
psql -c "CREATE DATABASE ecommerce;"
npm run db:migrate

# Build TypeScript
npm run build

# Start server
npm start
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
```

### Stripe Webhook Setup

For local development:
```bash
stripe listen --forward-to localhost:3001/api/webhooks
```

The webhook handles:
- `payment_intent.succeeded` - Confirms order and finalizes
- `payment_intent.payment_failed` - Cancels order and releases inventory
- `charge.refunded` - Processes refunds

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Stores
- `GET /api/stores` - List all active stores
- `GET /api/stores/:storeId` - Get store by ID
- `GET /api/stores/by-slug/:slug` - Get store by slug
- `POST /api/stores` - Create store (merchant only)
- `PUT /api/stores/:storeId` - Update store (owner only)
- `GET /api/stores/my/stores` - Get merchant's stores

### Products
- `GET /api/products/store/:storeId` - List store products
- `GET /api/products/:productId` - Get single product
- `POST /api/products` - Create product (store owner only)
- `PUT /api/products/:productId` - Update product
- `DELETE /api/products/:productId` - Delete product (soft delete)

### Cart
- `GET /api/cart` - Get cart (authenticated)
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:itemId` - Update quantity
- `DELETE /api/cart/:itemId` - Remove item
- `DELETE /api/cart` - Clear cart
- `POST /api/cart/merge` - Merge guest cart on login

### Orders
- `GET /api/orders/my-orders` - Customer order history
- `GET /api/orders/store/:storeId` - Store orders (merchant)
- `GET /api/orders/:orderId` - Get order details
- `PUT /api/orders/:orderId/status` - Update order status

### Checkout
- `GET /api/checkout/config` - Get Stripe publishable key
- `POST /api/checkout` - Create checkout session

### Webhooks
- `POST /api/webhooks` - Stripe webhook endpoint

## Inventory Management

The platform uses atomic SQL operations to prevent race conditions:

```sql
UPDATE products 
SET stock = stock - $1 
WHERE id = $2 AND store_id = $3 AND stock >= $1
RETURNING stock
```

This ensures inventory is only deducted when:
1. Product exists and belongs to the store
2. Sufficient stock is available
3. Product is not soft-deleted

Inventory is reserved during checkout and released on payment failure or cancellation.

## Security Considerations

- All merchant routes verify store ownership
- Customer cart isolated by user_id
- No cross-store data leakage
- Stripe Elements for PCI-compliant card input
- Webhook signature verification
- Idempotency keys prevent duplicate charges

## License

MIT