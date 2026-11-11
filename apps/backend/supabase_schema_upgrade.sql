-- =========================================================================
-- SUPABASE SCHEMA UPGRADE SCRIPT (Matching Mongoose & MongoDB Models 100%)
-- Run this script in your Supabase SQL Editor (Dashboard > SQL Editor)
-- =========================================================================

-- 1. BANK ACCOUNTS TABLE (Matches Mongoose BankAccount Schema & CC Limits)
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_name TEXT NOT NULL,
    bank_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    upi_id TEXT,
    account_type TEXT DEFAULT 'CURRENT',
    has_cc_limit BOOLEAN DEFAULT false,
    sanctioned_limit NUMERIC DEFAULT 0,
    current_outstanding NUMERIC DEFAULT 0,
    opening_balance NUMERIC DEFAULT 0,
    current_balance NUMERIC DEFAULT 0,
    interest_rate NUMERIC DEFAULT 0,
    transactions JSONB DEFAULT '[]'::jsonb,
    monthly_interests JSONB DEFAULT '[]'::jsonb,
    company_id TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS sanctioned_limit NUMERIC DEFAULT 0;
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS current_outstanding NUMERIC DEFAULT 0;
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS interest_rate NUMERIC DEFAULT 0;
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS monthly_interests JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;


-- 2. USERS TABLE (Matches Mongoose User Schema for Login & Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    phone TEXT,
    role TEXT DEFAULT 'admin',
    company_id TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;


-- 3. COMPANIES TABLE (Ensure all fields exist)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone_number TEXT,
    gst_number TEXT,
    address TEXT,
    upi_id TEXT,
    google_review_url TEXT,
    instagram_url TEXT,
    facebook_url TEXT,
    youtube_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


-- 4. SALES / BILLS TABLE
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_mobile TEXT,
    customer_address TEXT,
    customer_gst TEXT,
    site_name TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    sub_total NUMERIC DEFAULT 0,
    tax NUMERIC DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    discount_percent NUMERIC DEFAULT 0,
    freight_charges NUMERIC DEFAULT 0,
    labor_charges NUMERIC DEFAULT 0,
    final_amount NUMERIC DEFAULT 0,
    amount_received NUMERIC DEFAULT 0,
    payment_status TEXT DEFAULT 'paid',
    payment_method TEXT DEFAULT 'Cash',
    payment_mode TEXT DEFAULT 'CASH',
    status TEXT DEFAULT 'complete',
    notes TEXT,
    date TIMESTAMPTZ DEFAULT now(),
    due_date TIMESTAMPTZ,
    bill_image_url TEXT,
    bill_image_urls JSONB DEFAULT '[]'::jsonb,
    order_type TEXT DEFAULT 'dine_in',
    table_no TEXT DEFAULT '',
    company_id TEXT,
    party_id TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


-- 5. PARTIES TABLE
CREATE TABLE IF NOT EXISTS public.parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    mobile_number TEXT,
    alternate_phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    gst_number TEXT,
    pan_number TEXT,
    party_type TEXT DEFAULT 'both',
    opening_balance NUMERIC DEFAULT 0,
    current_balance NUMERIC DEFAULT 0,
    credit_limit NUMERIC DEFAULT 0,
    is_credit_limit_active BOOLEAN DEFAULT false,
    company_id TEXT,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


-- 6. PARTY TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.party_transactions (
    id BIGSERIAL PRIMARY KEY,
    party_id TEXT,
    company_id TEXT,
    date TIMESTAMPTZ DEFAULT now(),
    details TEXT,
    debit NUMERIC DEFAULT 0,
    credit NUMERIC DEFAULT 0,
    amount NUMERIC DEFAULT 0,
    type TEXT DEFAULT 'manual',
    bill_number TEXT,
    bill_image_url TEXT,
    bill_image_urls JSONB DEFAULT '[]'::jsonb,
    site_name TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


-- 7. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    amount NUMERIC NOT NULL,
    category TEXT DEFAULT 'Other',
    expense_type TEXT DEFAULT 'operating',
    family_member TEXT,
    transaction_flow TEXT DEFAULT 'given',
    payment_method TEXT DEFAULT 'cash',
    bank_account_id TEXT,
    staff_id TEXT,
    date TIMESTAMPTZ DEFAULT now(),
    company_id TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


-- 8. HELPER RPC FOR FUTURE AUTOMATIC SCHEMA EXECUTION
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;
