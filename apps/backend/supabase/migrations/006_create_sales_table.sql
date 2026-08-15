-- sales table (Bills/Invoices)
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    party_id UUID REFERENCES parties(id), -- Customer
    
    bill_number TEXT,
    date TIMESTAMPTZ NOT NULL,
    
    -- Items array ko JSONB me save karenge
    items JSONB, 
    -- Example: '[{"productId": "...", "name": "Laptop", "quantity": 1, "price": 55000, "discount": 5}]'
    
    -- Amounts
    sub_total NUMERIC(12, 2) DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    final_amount NUMERIC(12, 2) NOT NULL,
    
    -- Payment
    amount_received NUMERIC(12, 2) DEFAULT 0.00,
    payment_status TEXT DEFAULT 'unpaid', -- 'paid', 'partial', 'unpaid'
    payment_method TEXT,
    
    notes TEXT,
    
    -- Metadata
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for sales table
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their own company's sales"
ON sales FOR ALL
USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));