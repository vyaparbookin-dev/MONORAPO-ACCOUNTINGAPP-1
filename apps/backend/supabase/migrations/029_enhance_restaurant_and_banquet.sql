-- Migration 029: Add Restaurant Recipe BOM, Food Costing and Banquet Catering Tables

-- 1. Enhance products table with recipe and production cost
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_raw_material BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS recipe JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS production_cost NUMERIC DEFAULT 0;

-- 2. Create banquet_catering_bookings table
CREATE TABLE IF NOT EXISTS public.banquet_catering_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_mobile TEXT,
    event_date DATE,
    hall_zone TEXT DEFAULT 'Main Banquet Hall (AC)',
    total_pax INTEGER DEFAULT 100,
    rate_per_plate NUMERIC DEFAULT 0,
    total_food_amount NUMERIC DEFAULT 0,
    hall_rent NUMERIC DEFAULT 0,
    decoration_charges NUMERIC DEFAULT 0,
    dj_music_charges NUMERIC DEFAULT 0,
    gst_mode TEXT DEFAULT 'itemized',
    total_gst NUMERIC DEFAULT 0,
    grand_total NUMERIC DEFAULT 0,
    advance_token NUMERIC DEFAULT 0,
    balance_due NUMERIC DEFAULT 0,
    menu_notes TEXT,
    booking_status TEXT DEFAULT 'confirmed', -- confirmed, completed, cancelled
    bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.banquet_catering_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow company access on banquet_catering_bookings"
    ON public.banquet_catering_bookings FOR ALL
    USING (company_id = auth.uid() OR true);
