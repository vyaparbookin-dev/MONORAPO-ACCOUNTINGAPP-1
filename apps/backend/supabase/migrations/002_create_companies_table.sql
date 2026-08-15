-- companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    business_type TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    country TEXT DEFAULT 'India',
    gst_number TEXT,
    pan_number TEXT,
    contact_person TEXT,
    email TEXT,
    phone_number TEXT,
    logo_url TEXT,
    upi_id TEXT,
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for companies table
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to see their own company"
ON companies FOR SELECT
USING (id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));