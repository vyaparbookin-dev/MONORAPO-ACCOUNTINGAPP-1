-- fixed_assets table
CREATE TABLE fixed_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    asset_name TEXT NOT NULL,
    description TEXT,
    
    purchase_date TIMESTAMPTZ NOT NULL,
    purchase_cost NUMERIC(12, 2) NOT NULL,
    
    -- Depreciation Details
    depreciation_method TEXT, -- 'SLM' (Straight Line Method) or 'WDV' (Written Down Value)
    depreciation_rate NUMERIC(5, 2) DEFAULT 0.00,
    current_value NUMERIC(12, 2),
    
    status TEXT DEFAULT 'active', -- 'active', 'sold', 'disposed'
    sale_date TIMESTAMPTZ,
    sale_price NUMERIC(12, 2),
    
    -- Metadata
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for fixed_assets table
ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their own company's fixed assets"
ON fixed_assets FOR ALL
USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));