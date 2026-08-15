-- branches table
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, name)
);

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own company's branches"
ON branches FOR ALL
USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));


-- warehouses table
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, name)
);

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own company's warehouses"
ON warehouses FOR ALL
USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));