-- Migration: 024_create_capital_and_ai_usage_tables.sql

-- 1. Capital & Opening Balances Table
CREATE TABLE IF NOT EXISTS capital_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    entry_type TEXT NOT NULL, -- 'opening_cash', 'opening_bank', 'owner_capital', 'partner_capital', 'additional_capital', 'unsecured_loan', 'startup_renovation', 'legal_license_setup'
    title TEXT NOT NULL,
    contributor_name TEXT DEFAULT 'Owner / प्रोपराइटर',
    amount NUMERIC(14, 2) NOT NULL,
    date TIMESTAMPTZ DEFAULT now(),
    payment_mode TEXT DEFAULT 'cash', -- 'cash', 'bank', 'upi', 'cheque'
    bank_name TEXT,
    account_number TEXT,
    notes TEXT,
    
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for capital_entries table
ALTER TABLE capital_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their company capital entries"
ON capital_entries FOR ALL
USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));

-- 2. AI Usage & Token Metering Table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID,
    
    query TEXT NOT NULL,
    response_summary TEXT,
    query_type TEXT DEFAULT 'general_query', -- 'sales_insight', 'stock_reorder', 'khata_overdue', 'profit_growth', 'general_query'
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER NOT NULL,
    cost_inr NUMERIC(10, 4) DEFAULT 0.0000,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for ai_usage_logs table
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view their company AI usage logs"
ON ai_usage_logs FOR ALL
USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));

-- 3. Enhance Expenses Table with expense_type & deposit_details
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS expense_type TEXT DEFAULT 'operating',
ADD COLUMN IF NOT EXISTS deposit_company TEXT,
ADD COLUMN IF NOT EXISTS deposit_type TEXT,
ADD COLUMN IF NOT EXISTS interest_bearing BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(5, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS interest_cycle TEXT,
ADD COLUMN IF NOT EXISTS expected_refund_date TIMESTAMPTZ;
