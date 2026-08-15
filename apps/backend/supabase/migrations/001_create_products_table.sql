-- products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL, -- REFERENCES companies(id) - company table banane ke baad add karenge
    
    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,
    
    -- Category & Classification
    category TEXT,
    sub_category TEXT,
    hsn_code TEXT,
    image_url TEXT, -- Firebase/Supabase Storage se URL yahan aayega
    
    -- Codes & Identifiers
    sku TEXT,
    barcode TEXT,
    
    -- Pricing (NUMERIC for precision)
    cost_price NUMERIC(10, 2) DEFAULT 0.00,
    selling_price NUMERIC(10, 2) DEFAULT 0.00,
    mrp NUMERIC(10, 2) DEFAULT 0.00,
    wholesale_price NUMERIC(10, 2) DEFAULT 0.00,
    dealer_price NUMERIC(10, 2) DEFAULT 0.00,
    
    -- Tax & GST
    gst_rate NUMERIC(4, 2) DEFAULT 0.00,
    
    -- Units & Quantity
    unit TEXT,
    secondary_unit TEXT,
    conversion_rate NUMERIC(10, 2) DEFAULT 1.00,
    current_stock NUMERIC(10, 3) DEFAULT 0.000,
    minimum_stock NUMERIC(10, 3) DEFAULT 10.000,
    
    -- For specific business types
    brand TEXT,
    weight NUMERIC(10, 3), -- for jewellery
    purity TEXT, -- for jewellery
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    source TEXT DEFAULT 'manual', -- 'manual', 'excel'
    import_batch_id TEXT,
    custom_fields JSONB, -- For extra fields
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Constraints
    UNIQUE(company_id, name),
    UNIQUE(company_id, sku),
    UNIQUE(company_id, barcode)
);

-- RLS (Row Level Security) Policies
-- Ye ensure karega ki user sirf apni company ka data dekh sake
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their own company's products"
ON products
FOR ALL
USING (auth.uid() IN (SELECT user_id FROM company_users WHERE company_id = products.company_id));
-- NOTE: 'company_users' table banani padegi jo user_id aur company_id ko map karegi.