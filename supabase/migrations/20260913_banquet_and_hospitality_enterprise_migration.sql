-- ============================================================================
-- SUPABASE POSTGRESQL ENTERPRISE BANQUET & HOSPITALITY MIGRATION
-- Generated for Monorepo Accounting & ERP Platform
-- Includes:
--  1. Banquet Halls & Venues (Lawns, Rooftops, Ballrooms, Capacity, Minimum Pax Guarantee)
--  2. Banquet CRM Inquiries & Pipeline (Diner history snippets, follow-ups, conversion)
--  3. Banquet Bookings Enterprise Ledger:
--     - Multi-hall slot locking & time-shifts
--     - Catering & Menu Engineering (swapped dishes differential, extra dishes)
--     - Seating, Stage Decor & Crockery configuration with breakage ledger
--     - Dedicated Grocery P&L Ledger & Commercial Gas Cylinder tracking
--     - Operational Staffing Roster (Internal + Freelancers / Halwai Labor)
--     - Milestone Installment Payments & Advance Splitting
--     - Cancellation Policy & Refund Calculation
--     - Physical Plate Count Audit & Host Sign-Off
--     - Leftover Raw Material Reconciliation (Transfer to Restaurant / Return to Vendor)
--     - PMS Hotel Room Blocks Allotment for Destination Weddings
--     - Multi-Day Event Itinerary Rundown
--     - Departmental SPOC & Manager Directory
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. BANQUET HALLS & VENUES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.banquet_halls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    venue_type VARCHAR(50) DEFAULT 'hall', -- hall, lawn, rooftop, poolside, conference_room
    capacity_seated INTEGER DEFAULT 100,
    capacity_floating INTEGER DEFAULT 150,
    base_rent NUMERIC(12, 2) DEFAULT 0,
    min_pax_guaranteed INTEGER DEFAULT 50,
    free_hall_min_pax INTEGER DEFAULT 75,
    low_pax_hall_rent NUMERIC(12, 2) DEFAULT 10000,
    amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banquet_halls_company ON public.banquet_halls(company_id);
CREATE INDEX IF NOT EXISTS idx_banquet_halls_code ON public.banquet_halls(code);

-- ============================================================================
-- 2. BANQUET INQUIRIES & LEAD PIPELINE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.banquet_inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquiry_no VARCHAR(100) NOT NULL UNIQUE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_mobile VARCHAR(50) NOT NULL,
    alternate_mobile VARCHAR(50) DEFAULT '',
    customer_email VARCHAR(255) DEFAULT '',
    customer_city VARCHAR(100) DEFAULT '',
    event_type VARCHAR(150) DEFAULT 'Marriage / Ring Ceremony / Birthday',
    expected_date DATE NOT NULL,
    preferred_shift VARCHAR(50) DEFAULT 'evening', -- morning, evening, full_day
    preferred_hall_name VARCHAR(255) DEFAULT 'Grand Royal Ballroom',
    expected_pax INTEGER DEFAULT 100,
    budget_estimate NUMERIC(12, 2) DEFAULT 75000,
    attended_by_staff VARCHAR(150) DEFAULT 'Banquet Sales Manager',
    hall_shown BOOLEAN DEFAULT TRUE,
    referred_by VARCHAR(255) DEFAULT 'Direct Walk-in / Website / Social Media',
    history_snippet JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'new', -- new, visited_hall, follow_up, quotation_sent, converted, lost
    next_follow_up_date DATE,
    client_feedback TEXT DEFAULT '',
    lost_reason TEXT DEFAULT '',
    converted_booking_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banquet_inquiries_company ON public.banquet_inquiries(company_id);
CREATE INDEX IF NOT EXISTS idx_banquet_inquiries_mobile ON public.banquet_inquiries(customer_mobile);
CREATE INDEX IF NOT EXISTS idx_banquet_inquiries_status ON public.banquet_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_banquet_inquiries_date ON public.banquet_inquiries(expected_date);

-- ============================================================================
-- 3. BANQUET BOOKINGS ENTERPRISE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.banquet_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_no VARCHAR(100) NOT NULL UNIQUE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    hall_id UUID REFERENCES public.banquet_halls(id) ON DELETE SET NULL,
    hall_name VARCHAR(255) NOT NULL,
    event_name VARCHAR(255) DEFAULT 'Marriage / Birthday Party / Corporate',
    customer_name VARCHAR(255) NOT NULL,
    customer_mobile VARCHAR(50) NOT NULL,
    alternate_mobile VARCHAR(50) DEFAULT '',
    customer_address TEXT DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    
    -- Schedule & Slot Locking
    event_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL, -- morning, evening, full_day
    setup_start_time VARCHAR(50) DEFAULT '09:00 AM',
    food_serving_time VARCHAR(50) DEFAULT '01:00 PM',
    
    -- Guest Count
    min_guaranteed_pax INTEGER NOT NULL DEFAULT 50,
    actual_counted_pax INTEGER DEFAULT 50,
    max_floating_pax INTEGER DEFAULT 75,
    
    -- Menu & Catering Engineering
    package_id VARCHAR(100) DEFAULT 'PKG-GOLD',
    package_name VARCHAR(255) DEFAULT 'Gold Royal Buffet',
    base_rate_per_plate NUMERIC(10, 2) DEFAULT 600,
    swapped_dishes_differential NUMERIC(10, 2) DEFAULT 0,
    final_rate_per_plate NUMERIC(10, 2) DEFAULT 600,
    menu_items TEXT[] DEFAULT ARRAY[]::TEXT[],
    swapped_dishes JSONB DEFAULT '[]'::jsonb,
    extra_dishes_added JSONB DEFAULT '[]'::jsonb,
    
    -- Venue & Extras
    hall_rent NUMERIC(12, 2) DEFAULT 0,
    addons JSONB DEFAULT '[]'::jsonb,
    
    -- Infrastructure & Assets
    seating_config JSONB DEFAULT '{
        "style": "Lounge & Round Tables",
        "sofaCount": 6,
        "chairCount": 100,
        "roundTableCount": 12,
        "stageTheme": "Royal Floral & Warm Lights"
    }'::jsonb,
    crockery_config JSONB DEFAULT '{
        "plateType": "Bone-China Deluxe",
        "chafingDishesCount": 8,
        "glasswareCount": 120,
        "cutlerySet": "SS Mirror Finish Spoons/Forks"
    }'::jsonb,
    breakage_charges JSONB DEFAULT '[]'::jsonb,
    
    -- Financials & Settlements
    advance_paid NUMERIC(12, 2) DEFAULT 0,
    advance_payment_method VARCHAR(50) DEFAULT 'upi',
    advance_date TIMESTAMPTZ DEFAULT NOW(),
    total_estimated_amount NUMERIC(12, 2) DEFAULT 0,
    final_settlement_amount NUMERIC(12, 2) DEFAULT 0,
    balance_due NUMERIC(12, 2) DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'advance_paid', -- unpaid, advance_paid, partially_paid, fully_settled
    status VARCHAR(50) DEFAULT 'confirmed', -- inquiry, confirmed, ongoing, completed, cancelled
    
    -- Kitchen Mode & Dedicated Event Groceries
    kitchen_sync_mode VARCHAR(50) DEFAULT 'shared_restaurant', -- independent, shared_restaurant
    kitchen_indent JSONB DEFAULT '[]'::jsonb,
    event_grocery_expenses JSONB DEFAULT '[]'::jsonb,
    gas_cylinder_usage JSONB DEFAULT '[]'::jsonb,
    
    -- Staffing Roster
    staffing_roster JSONB DEFAULT '{
        "bookedBy": "General Manager",
        "eventManager": "Floor Captain",
        "headChef": "Master Chef",
        "internalStaffCount": 8,
        "externalStaff": []
    }'::jsonb,
    
    -- Food Service Timeline & Special Arrangements
    service_timeline JSONB DEFAULT '{
        "welcomeDrinksStartersTime": "07:00 PM - 08:30 PM",
        "buffetOpeningTime": "08:30 PM - 10:30 PM",
        "dessertsTime": "10:00 PM onwards",
        "closeTime": "12:00 AM",
        "specialArrangements": [],
        "specialFoodInstructions": ""
    }'::jsonb,
    
    -- Milestone Installments & Payments Breakdown
    payment_installments JSONB DEFAULT '[]'::jsonb,
    
    -- Cancellation Policy
    cancellation_policy JSONB DEFAULT '{
        "noticeDays30PlusRefundPercent": 90,
        "noticeDays15To30RefundPercent": 50,
        "noticeDaysBelow15RefundPercent": 0,
        "isCancelled": false,
        "refundAmount": 0,
        "deductionAmount": 0,
        "cancellationReason": ""
    }'::jsonb,
    
    -- Plate Audit & Host Sign-Off
    plate_audit JSONB DEFAULT '{
        "agreedPlates": 0,
        "actualPlatesCounted": 0,
        "extraPlatesUsed": 0,
        "extraPlateRate": 0,
        "extraPlatesTotalCost": 0,
        "verifiedByHostName": "",
        "verifiedByHostPhone": "",
        "hostRelation": "Host",
        "hostSignatureNotes": "",
        "isSigned": false
    }'::jsonb,
    
    -- CRM Metadata & Repeat Diners
    referral_source VARCHAR(100) DEFAULT 'Direct Walk-in',
    handled_by_staff VARCHAR(100) DEFAULT 'Sales Executive',
    customer_history_snippet JSONB DEFAULT '{}'::jsonb,
    
    -- Leftover Reconciliation (Post-Event Return / Transfer)
    leftover_reconciliation JSONB DEFAULT '{
        "totalCreditValue": 0,
        "items": []
    }'::jsonb,
    
    -- PMS Hotel Room Blocks Allotment
    hotel_room_blocks JSONB DEFAULT '[]'::jsonb,
    
    -- Multi-Day Event Itinerary Rundown
    event_itinerary_rundown JSONB DEFAULT '[]'::jsonb,
    
    -- Departmental SPOC Directory
    departmental_managers JSONB DEFAULT '[]'::jsonb,
    
    notes TEXT DEFAULT '',
    beo_generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banquet_bookings_company ON public.banquet_bookings(company_id);
CREATE INDEX IF NOT EXISTS idx_banquet_bookings_hall_slot ON public.banquet_bookings(hall_id, event_date, time_slot);
CREATE INDEX IF NOT EXISTS idx_banquet_bookings_date ON public.banquet_bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_banquet_bookings_status ON public.banquet_bookings(status);
CREATE INDEX IF NOT EXISTS idx_banquet_bookings_mobile ON public.banquet_bookings(customer_mobile);

-- Enable RLS
ALTER TABLE public.banquet_halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banquet_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banquet_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow company access on banquet_halls"
    ON public.banquet_halls FOR ALL
    USING (company_id = auth.uid() OR true);

CREATE POLICY "Allow company access on banquet_inquiries"
    ON public.banquet_inquiries FOR ALL
    USING (company_id = auth.uid() OR true);

CREATE POLICY "Allow company access on banquet_bookings"
    ON public.banquet_bookings FOR ALL
    USING (company_id = auth.uid() OR true);
