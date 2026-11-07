-- =========================================================================
-- AQUACARE RO PRO - NEON DATABASE (SERVERLESS POSTGRESQL) SCHEMA
-- Works directly in the Neon SQL Console (https://console.neon.tech)
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY DEFAULT ('cust-' || floor(extract(epoch from now())) || '-' || substr(md5(random()::text), 1, 4)),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    alternate_phone TEXT,
    address TEXT NOT NULL,
    area TEXT,
    google_maps_url TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    ro_brand TEXT NOT NULL DEFAULT 'Kent',
    ro_model TEXT NOT NULL DEFAULT 'Standard RO',
    installation_date DATE DEFAULT CURRENT_DATE,
    raw_water_tds INTEGER,
    output_tds INTEGER,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    last_service_date DATE,
    next_service_due_date DATE,
    last_service_type TEXT CHECK (last_service_type IN ('small', 'major', 'repair', 'installation')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers (name);
CREATE INDEX IF NOT EXISTS idx_customers_next_due ON customers (next_service_due_date);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers (status);
CREATE INDEX IF NOT EXISTS idx_customers_ro_brand ON customers (ro_brand);

-- 2. SERVICES & REPAIRS TABLE
CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY DEFAULT ('srv-' || floor(extract(epoch from now()))),
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT,
    ro_brand TEXT,
    ro_model TEXT,
    service_type TEXT NOT NULL CHECK (service_type IN ('small', 'major', 'repair', 'installation')),
    service_date DATE NOT NULL DEFAULT CURRENT_DATE,
    next_due_date DATE NOT NULL,
    technician_name TEXT NOT NULL,
    parts_used JSONB DEFAULT '[]'::jsonb,
    parts_cost NUMERIC(10,2) DEFAULT 0.00,
    service_charge NUMERIC(10,2) DEFAULT 0.00,
    discount NUMERIC(10,2) DEFAULT 0.00,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'partial')),
    payment_mode TEXT DEFAULT 'cash' CHECK (payment_mode IN ('cash', 'upi', 'card', 'bank_transfer')),
    raw_water_tds INTEGER,
    output_tds INTEGER,
    customer_signature TEXT,
    before_photo_url TEXT,
    after_photo_url TEXT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_services_customer_id ON services (customer_id);
CREATE INDEX IF NOT EXISTS idx_services_service_date ON services (service_date);
CREATE INDEX IF NOT EXISTS idx_services_type ON services (service_type);

-- 3. INVENTORY & SPARE PARTS TABLE
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY DEFAULT ('inv-' || floor(extract(epoch from now()))),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('filter', 'membrane', 'electrical', 'fittings', 'body', 'general')),
    sku TEXT UNIQUE NOT NULL,
    current_stock INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER NOT NULL DEFAULT 5,
    cost_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TECHNICIANS TABLE
CREATE TABLE IF NOT EXISTS technicians (
    id TEXT PRIMARY KEY DEFAULT ('tech-' || floor(extract(epoch from now()))),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    specialty TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. REMINDERS & NOTIFICATION LOGS TABLE
CREATE TABLE IF NOT EXISTS reminders_log (
    id TEXT PRIMARY KEY DEFAULT ('rem-' || floor(extract(epoch from now()))),
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    service_id TEXT REFERENCES services(id) ON DELETE SET NULL,
    reminder_type TEXT NOT NULL DEFAULT 'whatsapp' CHECK (reminder_type IN ('whatsapp', 'sms', 'call')),
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'pending', 'failed'))
);

-- 6. APP & BUSINESS PROFILE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS app_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    shop_name TEXT NOT NULL DEFAULT 'AquaCare RO Service',
    tagline TEXT DEFAULT 'Pure Water, Healthy Life',
    phone TEXT NOT NULL DEFAULT '+91 98765 43210',
    whatsapp_number TEXT NOT NULL DEFAULT '+919876543210',
    email TEXT DEFAULT 'support@aquacarero.in',
    address TEXT DEFAULT 'Shop 14, Main Market',
    city TEXT DEFAULT 'New Delhi - 110001',
    gst_number TEXT,
    upi_id TEXT DEFAULT 'aquacareservice@upi',
    small_service_interval_months INTEGER DEFAULT 6,
    major_service_interval_months INTEGER DEFAULT 12,
    reminder_template TEXT,
    completed_template TEXT,
    promo_template TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
