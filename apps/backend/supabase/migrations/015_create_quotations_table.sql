-- quotations table
CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    party_id UUID REFERENCES parties(id),
    
    quotation_number TEXT,
    date TIMESTAMPTZ NOT NULL,
    
    items JSONB, -- Same structure as sales/purchases
    sub_total NUMERIC(12, 2),
    tax_amount NUMERIC(12, 2),
    total_amount NUMERIC(12, 2),
    
    status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected'
    validity_date TIMESTAMPTZ,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for quotations table
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their own company's quotations"
ON quotations FOR ALL
USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));