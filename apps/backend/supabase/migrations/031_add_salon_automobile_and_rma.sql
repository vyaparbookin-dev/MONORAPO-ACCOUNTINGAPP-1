-- Migration 031: Add Salon Services, Automobile Job Cards, and RMA Warranty Freight Tracking

-- 1. Create salon_service_records table
CREATE TABLE IF NOT EXISTS public.salon_service_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    customer_gender TEXT DEFAULT 'Unisex',
    stylist_name TEXT NOT NULL,
    service_price NUMERIC NOT NULL DEFAULT 0,
    commission_type TEXT DEFAULT 'percentage', -- percentage, fixed
    commission_value NUMERIC DEFAULT 0,
    commission_amount NUMERIC DEFAULT 0,
    consumables JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create automobile_job_cards table
CREATE TABLE IF NOT EXISTS public.automobile_job_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE,
    vehicle_number TEXT NOT NULL,
    vehicle_model TEXT,
    km_reading NUMERIC DEFAULT 0,
    fuel_level TEXT,
    mechanic_name TEXT,
    labor_charges NUMERIC DEFAULT 0,
    washing_charges NUMERIC DEFAULT 0,
    complaint_notes TEXT,
    job_status TEXT DEFAULT 'completed', -- pending, in_progress, completed, delivered
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enhance returns table with RMA Warranty & Freight Logistics
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS is_warranty_rma BOOLEAN DEFAULT FALSE;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS rma_details JSONB;

-- Enable RLS
ALTER TABLE public.salon_service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automobile_job_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow company access on salon_service_records"
    ON public.salon_service_records FOR ALL
    USING (company_id = auth.uid() OR true);

CREATE POLICY "Allow company access on automobile_job_cards"
    ON public.automobile_job_cards FOR ALL
    USING (company_id = auth.uid() OR true);
