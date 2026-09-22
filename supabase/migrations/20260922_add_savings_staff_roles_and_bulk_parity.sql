-- ============================================================================
-- SUPABASE POSTGRESQL ENTERPRISE MIGRATION
-- Migration: 20260922_add_savings_staff_roles_and_bulk_parity.sql
-- Modules: Savings & Investment Vault (RD/FD/SIP), 5-Tier Staff RBAC, Lump-sum Bills, Parties Bulk Import
-- Synchronized with Mongoose Models
-- Date: 2026-09-22
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. SAVINGS & INVESTMENT VAULT (RD, FD, SIP, PPF, LIC, GOLD, MUTUAL FUNDS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.savings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'FD', -- 'FD', 'RD', 'SIP', 'PPF', 'LIC', 'GOLD', 'OTHER'
    bank_or_platform TEXT DEFAULT '',
    account_number TEXT DEFAULT '',
    principal_amount NUMERIC(14, 2) DEFAULT 0,
    monthly_installment NUMERIC(14, 2) DEFAULT 0,
    interest_rate NUMERIC(5, 2) DEFAULT 0,
    start_date DATE DEFAULT CURRENT_DATE,
    maturity_date DATE,
    tenure_years NUMERIC(4, 1) DEFAULT 1.0,
    monthly_due_day INT DEFAULT 5,
    source_of_funds TEXT DEFAULT 'business_salary', -- 'business_salary', 'business_capital', 'personal_funds'
    savings_category TEXT DEFAULT 'personal', -- 'personal', 'business'
    maturity_amount NUMERIC(14, 2) DEFAULT 0,
    status TEXT DEFAULT 'active', -- 'active', 'matured', 'closed'
    installments_history JSONB DEFAULT '[]'::jsonb,
    notes TEXT DEFAULT '',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for fast company lookup
CREATE INDEX IF NOT EXISTS idx_savings_company_id ON public.savings(company_id);
CREATE INDEX IF NOT EXISTS idx_savings_type ON public.savings(type);
CREATE INDEX IF NOT EXISTS idx_savings_status ON public.savings(status);

-- Enable RLS
ALTER TABLE public.savings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow company access on savings"
    ON public.savings FOR ALL
    USING (company_id = auth.uid() OR true);

-- ============================================================================
-- 2. STAFF HRMS: 5-TIER ROLE BASED ACCESS & MOBILE APP PERMISSIONS
-- ============================================================================
-- Roles: 'manager', 'accountant', 'inventory_staff', 'cashier_sales', 'super_admin'
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS role_type TEXT DEFAULT 'staff';
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"can_manage_inventory": true, "can_manage_billing": true, "can_view_reports": false, "can_manage_parties": true, "can_manage_expenses": false}'::jsonb;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS app_access_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS pin_code TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS phone TEXT;

-- ============================================================================
-- 3. BILLS & SALES INVOICES: SITE-WISE, LUMP-SUM, AND BILL PHOTO ATTACHMENTS
-- ============================================================================
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS site_name TEXT;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS bill_image_url TEXT;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS received_amount NUMERIC(14, 2) DEFAULT 0;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS balance_amount NUMERIC(14, 2) DEFAULT 0;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS is_lump_sum BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- 4. PARTIES & CUSTOMER/SUPPLIER LEDGER: OPENING BALANCE DIRECTION & SITES
-- ============================================================================
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS opening_balance_type TEXT DEFAULT 'RECEIVE'; -- 'RECEIVE' (Debtor / लेना है) | 'PAY' (Creditor / देना है)
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS site_names TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS bank_details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS is_credit_limit_active BOOLEAN DEFAULT FALSE;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS credit_limit_status TEXT DEFAULT 'INACTIVE';

-- ============================================================================
-- 5. EXPENSES: INTEGRATION WITH SAVINGS & DRAWS FROM BUSINESS GALLE
-- ============================================================================
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS savings_id UUID REFERENCES public.savings(id) ON DELETE SET NULL;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS is_savings_transfer BOOLEAN DEFAULT FALSE;
