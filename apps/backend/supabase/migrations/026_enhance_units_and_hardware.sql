-- Migration: 026_enhance_units_table.sql

-- 1. Add compound unit & calculation fields to units table
ALTER TABLE units
ADD COLUMN IF NOT EXISTS short_name TEXT,
ADD COLUMN IF NOT EXISTS is_compound BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS base_unit TEXT,
ADD COLUMN IF NOT EXISTS conversion_value NUMERIC(12, 4) DEFAULT 1.0000;

-- 2. Add hardware & building material dimensions to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS dimensions TEXT,
ADD COLUMN IF NOT EXISTS length NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS width NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS calculated_area NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS shade_code TEXT,
ADD COLUMN IF NOT EXISTS paint_base TEXT,
ADD COLUMN IF NOT EXISTS tmt_diameter TEXT;

-- 3. Add contractor / mistri tracking to sales
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS contractor_name TEXT,
ADD COLUMN IF NOT EXISTS contractor_phone TEXT,
ADD COLUMN IF NOT EXISTS contractor_commission NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS site_name TEXT,
ADD COLUMN IF NOT EXISTS vehicle_number TEXT;
