-- expenses table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    amount NUMERIC(10, 2) NOT NULL,
    category TEXT, -- e.g., Rent, Utilities, Office Supplies
    date TIMESTAMPTZ NOT NULL,
    description TEXT,
    attachment_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for expenses table
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their own company's expenses"
ON expenses FOR ALL
USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));