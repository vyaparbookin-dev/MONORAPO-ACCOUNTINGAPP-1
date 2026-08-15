-- This file creates all the master data tables like categories, brands, units etc.

-- Generic function to set updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Categories Table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, name)
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own company's categories" ON categories FOR ALL USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));
CREATE TRIGGER set_timestamp BEFORE UPDATE ON categories FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Sub-Categories Table
CREATE TABLE sub_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, name)
);
ALTER TABLE sub_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own company's sub_categories" ON sub_categories FOR ALL USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));
CREATE TRIGGER set_timestamp BEFORE UPDATE ON sub_categories FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Brands Table
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, name)
);
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own company's brands" ON brands FOR ALL USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));
CREATE TRIGGER set_timestamp BEFORE UPDATE ON brands FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Units Table
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    short_code TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, name)
);
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own company's units" ON units FOR ALL USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));
CREATE TRIGGER set_timestamp BEFORE UPDATE ON units FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();