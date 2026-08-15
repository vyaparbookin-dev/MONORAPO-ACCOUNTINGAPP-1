-- parties table (Customers and Suppliers)
CREATE TABLE parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    party_type TEXT NOT NULL, -- 'customer' or 'supplier'
    
    -- Contact Info
    mobile_number TEXT,
    email TEXT,
    
    -- Address
    billing_address TEXT,
    shipping_address TEXT,
    
    -- Financial Info
    gst_number TEXT,
    pan_number TEXT,
    opening_balance NUMERIC(12, 2) DEFAULT 0.00,
    current_balance NUMERIC(12, 2) DEFAULT 0.00,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(company_id, name, party_type)
);

-- RLS for parties table
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their own company's parties"
ON parties FOR ALL
USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));