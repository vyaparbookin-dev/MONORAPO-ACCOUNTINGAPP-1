-- Migration: 027_add_garments_and_business_mode.sql

-- 1. Add size, color, style_code to products for Garments & Footwear mode
ALTER TABLE products
ADD COLUMN IF NOT EXISTS size TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS style_code TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS variant_group_id UUID;

-- 2. Add size, color to sales_items (bill items)
ALTER TABLE sales_items
ADD COLUMN IF NOT EXISTS size TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;
