-- salaries table (for payroll records)
CREATE TABLE salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    amount NUMERIC(10, 2) NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    payment_status TEXT DEFAULT 'unpaid', -- 'paid' or 'unpaid'
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for salaries table
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their own company's salaries"
ON salaries FOR ALL
USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));