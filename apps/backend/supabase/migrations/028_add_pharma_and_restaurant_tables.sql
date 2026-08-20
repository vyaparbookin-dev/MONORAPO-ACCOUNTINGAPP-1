-- Migration 028: Add Pharma Batches and Restaurant KOT / Recipe Tables

-- 1. Pharma Batches Table (For Medical / Chemist Shops)
CREATE TABLE IF NOT EXISTS pharma_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    mfg_date VARCHAR(20),
    expiry_date VARCHAR(20) NOT NULL,
    mrp NUMERIC(15, 2) DEFAULT 0,
    cost_rate NUMERIC(15, 2) DEFAULT 0,
    sale_rate NUMERIC(15, 2) DEFAULT 0,
    current_stock NUMERIC(15, 3) DEFAULT 0,
    is_schedule_h BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Restaurant Tables (For Dine-In & Tables Management)
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    table_number VARCHAR(50) NOT NULL,
    floor_zone VARCHAR(100) DEFAULT 'Main Dining',
    seating_capacity INT DEFAULT 4,
    status VARCHAR(50) DEFAULT 'vacant', -- vacant, occupied, billed, reserved
    current_kot_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Restaurant KOTs (Kitchen Order Tickets)
CREATE TABLE IF NOT EXISTS restaurant_kots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
    kot_number VARCHAR(50) NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    waiter_name VARCHAR(100),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, preparing, served, billed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Restaurant Recipes / BOM (Bill of Materials)
CREATE TABLE IF NOT EXISTS restaurant_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    menu_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    ingredients JSONB DEFAULT '[]'::jsonb, -- [{ rawMaterialId, name, quantity, unit }]
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_pharma_batches_company ON pharma_batches(company_id);
CREATE INDEX IF NOT EXISTS idx_pharma_batches_product ON pharma_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_company ON restaurant_tables(company_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_kots_company ON restaurant_kots(company_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_recipes_company ON restaurant_recipes(company_id);
