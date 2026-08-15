-- This file applies all the required ALTER TABLE fixes based on the migration analysis.

-- 1. Fix Employees Table (add missing payroll fields)
ALTER TABLE employees ADD COLUMN wage_type TEXT DEFAULT 'monthly'; -- 'monthly', 'daily', 'hourly'
ALTER TABLE employees ADD COLUMN incentive_type TEXT;
ALTER TABLE employees ADD COLUMN earned_incentives NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE employees ADD COLUMN advance_balance NUMERIC(10, 2) DEFAULT 0;

-- 2. Fix Products Table (add missing business logic and inventory fields)
ALTER TABLE products ADD COLUMN dpl NUMERIC(10, 2);
ALTER TABLE products ADD COLUMN stock_locations JSONB DEFAULT '[]'::jsonb; -- For multi-warehouse stock
ALTER TABLE products ADD COLUMN recipe JSONB DEFAULT '[]'::jsonb; -- For product composition

-- 3. Fix Companies Table (add SaaS subscription fields)
ALTER TABLE companies ADD COLUMN gst_type TEXT; -- 'REGULAR', 'COMPOSITION', 'UNREGISTERED'
ALTER TABLE companies ADD COLUMN ownership_type TEXT; -- 'Sole', 'Partnership', 'Pvt Ltd'
ALTER TABLE companies ADD COLUMN plan TEXT DEFAULT 'free';
ALTER TABLE companies ADD COLUMN free_bill_count INT DEFAULT 0;
ALTER TABLE companies ADD COLUMN max_free_bills INT DEFAULT 10;
ALTER TABLE companies ADD COLUMN subscription_expires_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN whatsapp_settings JSONB;

-- 4. Fix Company_Users Table (add active status)
ALTER TABLE company_users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- 5. Fix Parties Table (add missing financial fields)
ALTER TABLE parties ADD COLUMN credit_limit NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE parties ADD COLUMN bank_details JSONB;

-- 6. Fix Sales Table (add status for draft/complete)
ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'complete'; -- 'draft', 'complete'

-- 7. Fix Purchases Table (add status for draft/complete)
ALTER TABLE purchases ADD COLUMN status TEXT DEFAULT 'complete'; -- 'draft', 'complete'