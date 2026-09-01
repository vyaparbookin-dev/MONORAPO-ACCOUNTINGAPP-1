-- ============================================================================
-- MASTER COMPREHENSIVE SUPABASE POSTGRESQL SCHEMA FOR MONOREPO ACCOUNTING ERP
-- Covers: Retail, Supermarket, Mobile/IMEI, Garments Matrix, Hardware/Wire,
-- Pharma Expiry, Sitewise Projects, Restaurant Recipes & Overheads, Banquets,
-- Swiggy/Zomato Reconciliations, Gamezone Cashless RFID & Predictive Budgeting.
-- Date: 2026-09-01
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. COMPANIES & BUSINESS PROFILE ENHANCEMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(50),
    gst_number VARCHAR(50),
    gst_type VARCHAR(50) DEFAULT 'REGULAR',
    enable_gst BOOLEAN DEFAULT TRUE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    upi_id VARCHAR(100),
    business_type TEXT[], -- ['hardware', 'garments', 'pharma', 'restaurant', 'gamezone', 'banquet', 'electronics']
    industry_type VARCHAR(100),
    ownership_type VARCHAR(100),
    pan_number VARCHAR(50),
    bank_name VARCHAR(150),
    account_number VARCHAR(100),
    ifsc_code VARCHAR(50),
    ca_name VARCHAR(150),
    ca_phone VARCHAR(50),
    invoice_theme_color VARCHAR(50) DEFAULT '#007bff',
    invoice_template_type VARCHAR(50) DEFAULT 'classic',
    plan VARCHAR(50) DEFAULT 'free',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. PARTIES & CUSTOMER 360 (LOYALTY, RFID, CREDIT LIMIT)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    party_type VARCHAR(50) DEFAULT 'customer', -- 'customer' | 'supplier' | 'both'
    contact_person VARCHAR(255),
    email VARCHAR(255),
    mobile_number VARCHAR(50),
    alternate_phone VARCHAR(50),
    billing_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    gst_number VARCHAR(50),
    pan_number VARCHAR(50),
    aadhar_number VARCHAR(50),
    credit_limit NUMERIC(12, 2) DEFAULT 0,
    opening_balance NUMERIC(12, 2) DEFAULT 0,
    current_balance NUMERIC(12, 2) DEFAULT 0,
    loyalty_tier VARCHAR(50) DEFAULT 'SILVER', -- 'SILVER' | 'GOLD' | 'PLATINUM' | 'FOUNDER_VIP'
    loyalty_points_balance INT DEFAULT 0,
    rfid_card_uid VARCHAR(100),
    site_access TEXT[], -- Sites assigned to this party
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to parties if already created
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS aadhar_number VARCHAR(50);
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS loyalty_tier VARCHAR(50) DEFAULT 'SILVER';
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS loyalty_points_balance INT DEFAULT 0;
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS rfid_card_uid VARCHAR(100);
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS site_access TEXT[];

-- ============================================================================
-- 3. PRODUCTS & MULTI-INDUSTRY INVENTORY ENGINE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    site VARCHAR(150),
    category VARCHAR(100) DEFAULT 'General',
    sub_category VARCHAR(100),
    hsn_code VARCHAR(50) DEFAULT '0000',
    sku VARCHAR(100),
    barcode VARCHAR(100),
    cost_price NUMERIC(12, 2) DEFAULT 0,
    p_cost NUMERIC(12, 2) DEFAULT 0, -- Confidential Purchase Cost with GST
    selling_price NUMERIC(12, 2) DEFAULT 0, -- Sale A (Retail)
    wholesale_price NUMERIC(12, 2) DEFAULT 0, -- Sale B (Wholesale)
    dealer_price NUMERIC(12, 2) DEFAULT 0, -- Sale C (Special Dealer)
    mrp NUMERIC(12, 2) DEFAULT 0,
    gst_rate NUMERIC(5, 2) DEFAULT 0,
    gst_type VARCHAR(50) DEFAULT 'CGST',
    unit VARCHAR(50) DEFAULT 'pc',
    secondary_unit VARCHAR(50),
    conversion_rate NUMERIC(10, 3) DEFAULT 1,
    minimum_stock NUMERIC(12, 2) DEFAULT 10,
    current_stock NUMERIC(12, 2) DEFAULT 0,
    shelf_life_days INT DEFAULT 365,
    expiry_date DATE,
    batch_number VARCHAR(100),
    
    -- Specialized Industry JSONB Extensions
    imei_numbers JSONB DEFAULT '[]'::jsonb, -- Mobile Phones IMEI 1 & 2
    garment_matrix JSONB DEFAULT '{}'::jsonb, -- Sizes, Colors, Style Codes
    hardware_specs JSONB DEFAULT '{}'::jsonb, -- Pipe mm, Wire gauge, Coil length, Bundle kg
    pharma_batch JSONB DEFAULT '{}'::jsonb, -- Salt name, Drug composition, Rack No.
    recipe_bom JSONB DEFAULT '[]'::jsonb, -- Restaurant Recipe Ingredients
    operating_overheads JSONB DEFAULT '[]'::jsonb, -- Gas, Electricity, Chef labor
    
    is_raw_material BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add all specialized industry columns if products table exists
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS p_cost NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS wholesale_price NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dealer_price NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shelf_life_days INT DEFAULT 365;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS imei_numbers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS garment_matrix JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS hardware_specs JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pharma_batch JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS recipe_bom JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS operating_overheads JSONB DEFAULT '[]'::jsonb;

-- ============================================================================
-- 4. BILLS & SALES INVOICES (SITEWISE, BREAKAGE, AGGREGATOR, GAMEZONE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL,
    bill_number VARCHAR(100) NOT NULL,
    bill_type VARCHAR(50) DEFAULT 'standard', -- 'standard', 'fast_pos', 'restaurant_kot', 'banquet', 'gamezone'
    site_name VARCHAR(150),
    site_id UUID,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    bill_date DATE DEFAULT CURRENT_DATE,
    subtotal NUMERIC(12, 2) DEFAULT 0,
    discount_amount NUMERIC(12, 2) DEFAULT 0,
    tax_amount NUMERIC(12, 2) DEFAULT 0,
    final_amount NUMERIC(12, 2) DEFAULT 0,
    amount_paid NUMERIC(12, 2) DEFAULT 0,
    balance_amount NUMERIC(12, 2) DEFAULT 0,
    payment_method VARCHAR(50) DEFAULT 'cash', -- 'cash', 'upi', 'card', 'credit', 'split'
    payment_status VARCHAR(50) DEFAULT 'paid', -- 'paid', 'partial', 'unpaid'
    items JSONB DEFAULT '[]'::jsonb,
    
    -- Hospitality, Banquet & Gamezone Meta Fields
    breakage_charges NUMERIC(12, 2) DEFAULT 0,
    aggregator_payout_meta JSONB DEFAULT '{}'::jsonb, -- Swiggy/Zomato commission & deductions
    gamezone_station_meta JSONB DEFAULT '{}'::jsonb, -- PS5/VR station time elapsed
    handover_signed_by_host VARCHAR(255),
    handover_signed_by_manager VARCHAR(255),
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to bills
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS bill_type VARCHAR(50) DEFAULT 'standard';
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS site_name VARCHAR(150);
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS site_id UUID;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS breakage_charges NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS aggregator_payout_meta JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS gamezone_station_meta JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS handover_signed_by_host VARCHAR(255);
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS handover_signed_by_manager VARCHAR(255);

-- ============================================================================
-- 5. RESTAURANT RECIPES & INGREDIENT BOM
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.restaurant_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    dish_code VARCHAR(50) UNIQUE,
    dish_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    portion_size VARCHAR(100) DEFAULT '1 Plate',
    serving_mode VARCHAR(50) DEFAULT 'alacarte',
    selling_price NUMERIC(12, 2) DEFAULT 0,
    target_gross_margin_percent NUMERIC(5, 2) DEFAULT 60.00,
    ingredients JSONB DEFAULT '[]'::jsonb,
    operating_overheads JSONB DEFAULT '[]'::jsonb,
    prep_instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. BANQUET & CATERING EVENT BOOKINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.banquet_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    booking_number VARCHAR(100) UNIQUE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    event_name VARCHAR(255),
    event_type VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    event_slot VARCHAR(50),
    hall_name VARCHAR(150),
    hall_rent NUMERIC(12, 2) DEFAULT 0,
    guaranteed_pax INT DEFAULT 0,
    floating_max_pax INT DEFAULT 0,
    per_plate_rate NUMERIC(12, 2) DEFAULT 0,
    menu_package JSONB DEFAULT '{}'::jsonb,
    addon_services JSONB DEFAULT '[]'::jsonb,
    breakage_items JSONB DEFAULT '[]'::jsonb,
    actual_plates_served INT DEFAULT 0,
    total_amount NUMERIC(12, 2) DEFAULT 0,
    advance_token_paid NUMERIC(12, 2) DEFAULT 0,
    balance_due NUMERIC(12, 2) DEFAULT 0,
    handover_signed_by_host VARCHAR(255),
    handover_signed_by_manager VARCHAR(255),
    status VARCHAR(50) DEFAULT 'CONFIRMED',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. KITCHEN PERISHABLE INVENTORY (48H-72H EXPIRY EARLY WARNING)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.kitchen_prep_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) UNIQUE,
    ingredient_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    inward_quantity NUMERIC(10, 2) NOT NULL,
    remaining_quantity NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(50) DEFAULT 'kg',
    unit_cost NUMERIC(10, 2) DEFAULT 0,
    inward_date TIMESTAMPTZ DEFAULT NOW(),
    expiry_date TIMESTAMPTZ NOT NULL,
    shelf_life_hours INT DEFAULT 72,
    spoilage_status VARCHAR(50) DEFAULT 'FRESH',
    storage_location VARCHAR(100) DEFAULT 'Cold Room 1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. ONLINE FOOD AGGREGATOR PAYOUT RECONCILIATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.online_aggregator_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    payout_cycle_code VARCHAR(100),
    cycle_start_date DATE NOT NULL,
    cycle_end_date DATE NOT NULL,
    gross_food_sales NUMERIC(12, 2) DEFAULT 0,
    packaging_collected NUMERIC(12, 2) DEFAULT 0,
    platform_commission_rate NUMERIC(5, 2) DEFAULT 20.00,
    base_commission_amount NUMERIC(12, 2) DEFAULT 0,
    gst_on_commission NUMERIC(12, 2) DEFAULT 0,
    merchant_discount_share NUMERIC(12, 2) DEFAULT 0,
    late_prep_penalties NUMERIC(12, 2) DEFAULT 0,
    tcs_tds_withheld NUMERIC(12, 2) DEFAULT 0,
    net_bank_credit_expected NUMERIC(12, 2) DEFAULT 0,
    actual_bank_credit_received NUMERIC(12, 2) DEFAULT 0,
    reconciliation_gap NUMERIC(12, 2) DEFAULT 0,
    is_reconciled BOOLEAN DEFAULT FALSE,
    bank_utr_number VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. GAMEZONE MACHINE FLEET & IOT TELEMETRY
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.gamezone_machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    machine_code VARCHAR(50) UNIQUE NOT NULL,
    machine_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    reader_hardware_id VARCHAR(100) UNIQUE,
    ip_address VARCHAR(50),
    base_game_price NUMERIC(8, 2) DEFAULT 50.00,
    current_status VARCHAR(50) DEFAULT 'idle',
    total_plays_lifetime INT DEFAULT 0,
    total_revenue_lifetime NUMERIC(14, 2) DEFAULT 0,
    last_card_tapped_uid VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 10. CASHLESS RFID SMART PLAYCARDS & TICKET WALLETS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.gamezone_playcards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    card_uid VARCHAR(100) UNIQUE NOT NULL,
    holder_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    membership_tier VARCHAR(50) DEFAULT 'SILVER',
    real_cash_balance NUMERIC(10, 2) DEFAULT 0,
    free_bonus_balance NUMERIC(10, 2) DEFAULT 0,
    digital_tickets_balance INT DEFAULT 0,
    total_recharged_lifetime NUMERIC(12, 2) DEFAULT 0,
    total_spent_lifetime NUMERIC(12, 2) DEFAULT 0,
    is_blocked BOOLEAN DEFAULT FALSE,
    issue_date TIMESTAMPTZ DEFAULT NOW(),
    last_tapped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 11. RFID TAP-TO-PLAY & RECHARGE AUDIT LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.gamezone_card_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    card_uid VARCHAR(100) NOT NULL REFERENCES public.gamezone_playcards(card_uid) ON DELETE CASCADE,
    machine_code VARCHAR(50),
    transaction_type VARCHAR(50) NOT NULL,
    amount_debited NUMERIC(10, 2) DEFAULT 0,
    amount_credited NUMERIC(10, 2) DEFAULT 0,
    bonus_used NUMERIC(10, 2) DEFAULT 0,
    tickets_won INT DEFAULT 0,
    tickets_spent INT DEFAULT 0,
    balance_after_transaction NUMERIC(10, 2) DEFAULT 0,
    reader_telemetry_meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 12. PRIZE STORE & REDEMPTION INVENTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.gamezone_prizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    prize_code VARCHAR(50) UNIQUE,
    prize_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    tickets_needed INT NOT NULL,
    physical_stock INT DEFAULT 0,
    procurement_cost NUMERIC(10, 2) DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 13. PREDICTIVE MONTHLY BUDGET & ACCRUED LIABILITY PROVISIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.predictive_budget_provisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    budget_month DATE NOT NULL,
    monthly_target_budget NUMERIC(12, 2) NOT NULL,
    daily_burn_rate NUMERIC(10, 2) NOT NULL,
    daily_break_even_sales_needed NUMERIC(10, 2) NOT NULL,
    accrual_categories JSONB DEFAULT '[]'::jsonb,
    total_actual_disbursed NUMERIC(12, 2) DEFAULT 0,
    budget_variance_gap NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 14. FIXED ASSETS & MONTHLY DEPRECIATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.fixed_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    asset_name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- 'Kitchen Equipment', 'Furniture', 'Gaming Arcade Machine', 'Vehicle'
    purchase_date DATE NOT NULL,
    purchase_cost NUMERIC(14, 2) NOT NULL,
    salvage_value NUMERIC(14, 2) DEFAULT 0,
    useful_life_years INT DEFAULT 5,
    depreciation_method VARCHAR(50) DEFAULT 'STRAIGHT_LINE',
    accumulated_depreciation NUMERIC(14, 2) DEFAULT 0,
    current_book_value NUMERIC(14, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREATE ESSENTIAL PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_company ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_bills_date ON public.bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_bills_party ON public.bills(party_id);
CREATE INDEX IF NOT EXISTS idx_parties_phone ON public.parties(mobile_number);
CREATE INDEX IF NOT EXISTS idx_parties_rfid ON public.parties(rfid_card_uid);
CREATE INDEX IF NOT EXISTS idx_playcards_uid ON public.gamezone_playcards(card_uid);
CREATE INDEX IF NOT EXISTS idx_kitchen_expiry ON public.kitchen_prep_batches(expiry_date, spoilage_status);


-- ============================================================================
-- 15. MASTER DATA HIERARCHY (GROUPS, CATEGORIES, SUB-CATEGORIES, BRANDS, UNITS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.item_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.item_groups(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    short_code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sub_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    short_code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    short_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 16. 2-TIER CUSTOMER FEEDBACK, STAFF CSAT & GOOGLE REVIEW LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customer_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    event_name VARCHAR(255),
    booked_by_staff VARCHAR(255),
    organized_by_manager VARCHAR(255),
    
    -- Private Internal Staff Ratings (1-5 Stars)
    booking_staff_rating NUMERIC(2, 1) DEFAULT 5.0,
    floor_manager_rating NUMERIC(2, 1) DEFAULT 5.0,
    service_food_rating NUMERIC(2, 1) DEFAULT 5.0,
    internal_owner_notes TEXT,
    
    -- Public Business Reputation
    firm_star_rating INT DEFAULT 5,
    public_review_text TEXT,
    is_google_review_prompted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR FASTER LOOKUP
CREATE INDEX IF NOT EXISTS idx_reviews_company ON public.customer_reviews(company_id);
CREATE INDEX IF NOT EXISTS idx_reviews_staff ON public.customer_reviews(booked_by_staff);
