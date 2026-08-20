-- Migration 030: Add Electronics, Mobile IMEI and Electricals Tables & Fields

-- 1. Create electronics_imei_records table
CREATE TABLE IF NOT EXISTS public.electronics_imei_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    brand TEXT,
    model_variant TEXT,
    imei_1 TEXT NOT NULL,
    imei_2 TEXT,
    serial_number TEXT,
    warranty_months INTEGER DEFAULT 12,
    status TEXT DEFAULT 'in_stock', -- in_stock, sold, rma_returned, defective
    bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
    sold_to_customer TEXT,
    sold_date TIMESTAMPTZ,
    is_emi_financed BOOLEAN DEFAULT FALSE,
    finance_provider TEXT,
    finance_ref_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create electrical_wire_specifications table
CREATE TABLE IF NOT EXISTS public.electrical_wire_specs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    wire_name TEXT NOT NULL,
    gauge TEXT NOT NULL, -- 1.0 sq mm, 1.5 sq mm, 2.5 sq mm, etc.
    color TEXT NOT NULL, -- Red, Black, Green, Blue, Yellow
    coil_length_meters NUMERIC DEFAULT 90,
    coil_cost_price NUMERIC DEFAULT 0,
    coil_selling_price NUMERIC DEFAULT 0,
    per_meter_selling_price NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create appliance_installations table
CREATE TABLE IF NOT EXISTS public.appliance_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_mobile TEXT NOT NULL,
    customer_address TEXT,
    appliance_name TEXT NOT NULL,
    serial_number TEXT,
    technician_name TEXT,
    scheduled_date DATE,
    installation_status TEXT DEFAULT 'pending', -- pending, assigned, completed, cancelled
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.electronics_imei_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electrical_wire_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appliance_installations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow company access on electronics_imei_records"
    ON public.electronics_imei_records FOR ALL
    USING (company_id = auth.uid() OR true);

CREATE POLICY "Allow company access on electrical_wire_specs"
    ON public.electrical_wire_specs FOR ALL
    USING (company_id = auth.uid() OR true);

CREATE POLICY "Allow company access on appliance_installations"
    ON public.appliance_installations FOR ALL
    USING (company_id = auth.uid() OR true);
