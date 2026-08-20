-- Migration: 025_create_b2b_documents_table.sql

-- 1. B2B Documents Table (Quotations, Sales Orders, Delivery Challans)
CREATE TABLE IF NOT EXISTS b2b_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    
    document_number TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('quotation', 'sales_order', 'delivery_challan')),
    date TIMESTAMPTZ DEFAULT now(),
    valid_until TIMESTAMPTZ,
    
    total_amount NUMERIC(14, 2) DEFAULT 0.00,
    tax_amount NUMERIC(14, 2) DEFAULT 0.00,
    final_amount NUMERIC(14, 2) DEFAULT 0.00,
    
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'converted', 'cancelled')),
    converted_bill_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    
    notes TEXT,
    terms_and_conditions TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(company_id, document_number)
);

-- RLS for b2b_documents table
ALTER TABLE b2b_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their company b2b documents"
ON b2b_documents FOR ALL
USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));

-- 2. B2B Document Items Table
CREATE TABLE IF NOT EXISTS b2b_document_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES b2b_documents(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    
    name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    taxable NUMERIC(12, 2) DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) DEFAULT 0.00,
    total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for b2b_document_items table
ALTER TABLE b2b_document_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their company b2b document items"
ON b2b_document_items FOR ALL
USING (document_id IN (
    SELECT id FROM b2b_documents WHERE company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
));
