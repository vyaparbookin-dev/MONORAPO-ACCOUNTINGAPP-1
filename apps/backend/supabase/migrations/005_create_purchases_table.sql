-- purchases table
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    party_id UUID REFERENCES parties(id), -- Supplier
    
    purchase_number TEXT,
    date TIMESTAMPTZ NOT NULL,
    
    -- Items array ko JSONB me save karenge, Mongoose jaisa experience
    items JSONB, 
    -- Example: '[{"productId": "...", "name": "Laptop", "quantity": 2, "price": 50000}]'
    
    -- Amounts
    sub_total NUMERIC(12, 2) DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    final_amount NUMERIC(12, 2) NOT NULL,
    
    -- Payment
    amount_paid NUMERIC(12, 2) DEFAULT 0.00,
    payment_status TEXT DEFAULT 'unpaid', -- 'paid', 'partial', 'unpaid'
    payment_method TEXT,
    
    notes TEXT,
    
    -- Metadata
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for purchases table
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their own company's purchases"
ON purchases FOR ALL
USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));