-- Multi-tenant Ecommerce Platform Database Schema
-- Supports: Stores, Products, Orders, Cart, with tenant isolation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (merchants and customers)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('merchant', 'customer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Stores table (owned by merchants)
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stores_owner ON stores(owner_id);
CREATE INDEX idx_stores_slug ON stores(slug);
CREATE INDEX idx_stores_active ON stores(is_active);

-- Categories (per-store)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, slug)
);

CREATE INDEX idx_categories_store ON categories(store_id);

-- Products table with soft delete support
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    sku VARCHAR(100),
    images JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, slug)
);

-- Critical indexes for tenant isolation and performance
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_store_id_deleted ON products(store_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_store_active ON products(store_id, is_active) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_products_category ON products(category_id);

-- Cart items (for authenticated users)
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

CREATE INDEX idx_cart_items_user_store ON cart_items(user_id, store_id);
CREATE INDEX idx_cart_items_user ON cart_items(user_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_intent_id VARCHAR(255),
    idempotency_key VARCHAR(255) UNIQUE,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    shipping_amount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    shipping_address JSONB,
    billing_address JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_store_id_status ON orders(store_id, status);
CREATE INDEX idx_orders_store_customer ON orders(store_id, customer_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_payment_intent ON orders(payment_intent_id);
CREATE INDEX idx_orders_idempotency ON orders(idempotency_key);

-- Order items (preserves product state at time of order)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    product_image VARCHAR(500),
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Row Level Security Policies for Tenant Isolation

-- Enable RLS on tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Stores: Users can see all active stores, but only owners can modify their stores
CREATE POLICY stores_select ON stores FOR SELECT USING (is_active = true);
CREATE POLICY stores_owner_select ON stores FOR SELECT USING (owner_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY stores_owner_modify ON stores FOR ALL USING (owner_id = current_setting('app.current_user_id')::UUID);

-- Products: Anyone can see active non-deleted products
CREATE POLICY products_select ON products FOR SELECT USING (is_active = true AND deleted_at IS NULL);
CREATE POLICY products_owner ON products FOR ALL USING (store_id IN (
    SELECT id FROM stores WHERE owner_id = current_setting('app.current_user_id')::UUID
));

-- Orders: Store owners can see their orders, customers can see their own
CREATE POLICY orders_store_owner ON orders FOR ALL USING (store_id IN (
    SELECT id FROM stores WHERE owner_id = current_setting('app.current_user_id')::UUID
));
CREATE POLICY orders_customer ON orders FOR SELECT USING (customer_id = current_setting('app.current_user_id')::UUID);

-- Cart items: Users can only see their own
CREATE POLICY cart_items_user ON cart_items FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

-- Create upload directory storage table (optional metadata tracking)
CREATE TABLE uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    size_bytes INTEGER,
    path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_uploads_store ON uploads(store_id);

-- Insert sample data for testing
INSERT INTO users (id, email, password_hash, full_name, role) VALUES
('11111111-1111-1111-1111-111111111111', 'merchant@example.com', '$2a$10$YourHashedPasswordHere', 'Test Merchant', 'merchant'),
('22222222-2222-2222-2222-222222222222', 'customer@example.com', '$2a$10$YourHashedPasswordHere', 'Test Customer', 'customer');

INSERT INTO stores (id, owner_id, name, description, slug) VALUES
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Demo Store', 'A demonstration store for testing', 'demo-store');

INSERT INTO categories (id, store_id, name, slug) VALUES
('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Electronics', 'electronics'),
('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Clothing', 'clothing');

INSERT INTO products (id, store_id, category_id, name, description, slug, price, stock, sku) VALUES
('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'Wireless Headphones', 'High-quality wireless headphones with noise cancellation', 'wireless-headphones', 99.99, 50, 'WH-001'),
('77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'Smart Watch', 'Feature-rich smart watch with health tracking', 'smart-watch', 199.99, 30, 'SW-001'),
('88888888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'Cotton T-Shirt', 'Comfortable 100% cotton t-shirt', 'cotton-t-shirt', 24.99, 100, 'TS-001');