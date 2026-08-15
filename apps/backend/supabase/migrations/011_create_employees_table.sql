-- employees table for detailed staff management
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL, -- Link to login user (optional)
    
    -- Personal Details
    full_name TEXT NOT NULL,
    phone_number TEXT,
    email TEXT,
    address TEXT,
    
    -- Employment Details
    designation TEXT, -- e.g., 'Manager', 'Salesperson'
    department TEXT,
    joining_date TIMESTAMPTZ,
    
    -- Payroll Details
    salary NUMERIC(10, 2),
    bank_account_number TEXT,
    bank_ifsc_code TEXT,
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for employees table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their own company's employees"
ON employees FOR ALL
USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));