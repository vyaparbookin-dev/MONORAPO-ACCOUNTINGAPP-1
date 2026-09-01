-- ============================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR HOSPITALITY, BANQUET & GAMEZONE MODULES
-- Generated for Monorepo Accounting & ERP Platform
-- Date: 2026-09-01
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. RESTAURANT RECIPES & INGREDIENT BOM WITH UTILITY OVERHEADS
CREATE TABLE IF NOT EXISTS public.restaurant_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    dish_code VARCHAR(50) UNIQUE,
    dish_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    portion_size VARCHAR(100) DEFAULT '1 Plate',
    serving_mode VARCHAR(50) DEFAULT 'alacarte', -- 'alacarte' | 'buffet'
    selling_price NUMERIC(12, 2) DEFAULT 0,
    target_gross_margin_percent NUMERIC(5, 2) DEFAULT 60.00,
    ingredients JSONB DEFAULT '[]'::jsonb, -- [{name, qtyPerPortion, unit, costPerUnit, shelfLifeDays, matchedInvName}]
    operating_overheads JSONB DEFAULT '[]'::jsonb, -- [{name, costPerPortion, isCustom, category}]
    prep_instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BANQUET & CATERING EVENT BOOKINGS WITH BREAKAGE RECOVERY
CREATE TABLE IF NOT EXISTS public.banquet_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    booking_number VARCHAR(100) UNIQUE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    event_name VARCHAR(255), -- e.g. "Wedding Reception", "Birthday Bash"
    event_type VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    event_slot VARCHAR(50), -- 'Lunch' | 'Dinner' | 'Full Day' | 'Multi-Day'
    hall_name VARCHAR(150),
    hall_rent NUMERIC(12, 2) DEFAULT 0,
    guaranteed_pax INT DEFAULT 0,
    floating_max_pax INT DEFAULT 0,
    per_plate_rate NUMERIC(12, 2) DEFAULT 0,
    menu_package JSONB DEFAULT '{}'::jsonb, -- {silver, gold, customDishes: []}
    addon_services JSONB DEFAULT '[]'::jsonb, -- [{serviceName, vendorName, cost, isOutsourced}]
    breakage_items JSONB DEFAULT '[]'::jsonb, -- [{name, count, penaltyRate, total}]
    actual_plates_served INT DEFAULT 0,
    total_amount NUMERIC(12, 2) DEFAULT 0,
    advance_token_paid NUMERIC(12, 2) DEFAULT 0,
    balance_due NUMERIC(12, 2) DEFAULT 0,
    handover_signed_by_host VARCHAR(255),
    handover_signed_by_manager VARCHAR(255),
    status VARCHAR(50) DEFAULT 'CONFIRMED', -- 'INQUIRY' | 'CONFIRMED' | 'IN_PROGRESS' | 'SETTLED' | 'CANCELLED'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. KITCHEN PERISHABLE INVENTORY & 48H-72H EXPIRY BATCHES
CREATE TABLE IF NOT EXISTS public.kitchen_prep_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    batch_number VARCHAR(100) UNIQUE,
    ingredient_name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- 'Dairy', 'Produce', 'Meat', 'Bakery', 'Dry Grocery'
    inward_quantity NUMERIC(10, 2) NOT NULL,
    remaining_quantity NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(50) DEFAULT 'kg',
    unit_cost NUMERIC(10, 2) DEFAULT 0,
    inward_date TIMESTAMPTZ DEFAULT NOW(),
    expiry_date TIMESTAMPTZ NOT NULL,
    shelf_life_hours INT DEFAULT 72,
    spoilage_status VARCHAR(50) DEFAULT 'FRESH', -- 'FRESH' | 'EXPIRING_SOON_48H' | 'EXPIRED_LOCKED' | 'DISCARDED'
    storage_location VARCHAR(100) DEFAULT 'Cold Room 1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ONLINE FOOD AGGREGATOR PAYOUTS (SWIGGY, ZOMATO, MAGICPIN)
CREATE TABLE IF NOT EXISTS public.online_aggregator_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    platform VARCHAR(50) NOT NULL, -- 'zomato' | 'swiggy' | 'magicpin' | 'eatsure'
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

-- 5. GAMEZONE ARCADE MACHINE FLEET & IOT TELEMETRY
CREATE TABLE IF NOT EXISTS public.gamezone_machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    machine_code VARCHAR(50) UNIQUE NOT NULL, -- 'MC-01'
    machine_name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- 'Arcade', 'Claw', 'VR', 'Console', 'Table', 'Kids Play'
    reader_hardware_id VARCHAR(100) UNIQUE, -- 'RDR-101'
    ip_address VARCHAR(50),
    base_game_price NUMERIC(8, 2) DEFAULT 50.00,
    current_status VARCHAR(50) DEFAULT 'idle', -- 'idle' | 'playing' | 'maintenance' | 'offline'
    total_plays_lifetime INT DEFAULT 0,
    total_revenue_lifetime NUMERIC(14, 2) DEFAULT 0,
    last_card_tapped_uid VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CASHLESS RFID SMART PLAYCARDS & WRISTBANDS
CREATE TABLE IF NOT EXISTS public.gamezone_playcards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    card_uid VARCHAR(100) UNIQUE NOT NULL, -- 'CARD-9842' or 14-digit NFC UID
    holder_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    membership_tier VARCHAR(50) DEFAULT 'SILVER', -- 'SILVER' | 'GOLD' | 'PLATINUM' | 'FOUNDER_VIP'
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

-- 7. RFID TAP-TO-PLAY & RECHARGE TRANSACTION LOGS
CREATE TABLE IF NOT EXISTS public.gamezone_card_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    card_uid VARCHAR(100) NOT NULL REFERENCES public.gamezone_playcards(card_uid) ON DELETE CASCADE,
    machine_code VARCHAR(50),
    transaction_type VARCHAR(50) NOT NULL, -- 'GAME_PLAY' | 'RECHARGE' | 'PRIZE_REDEEM' | 'BONUS_GRANT'
    amount_debited NUMERIC(10, 2) DEFAULT 0,
    amount_credited NUMERIC(10, 2) DEFAULT 0,
    bonus_used NUMERIC(10, 2) DEFAULT 0,
    tickets_won INT DEFAULT 0,
    tickets_spent INT DEFAULT 0,
    balance_after_transaction NUMERIC(10, 2) DEFAULT 0,
    reader_telemetry_meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PRIZE STORE & DIGITAL TICKET REDEMPTION INVENTORY
CREATE TABLE IF NOT EXISTS public.gamezone_prizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    prize_code VARCHAR(50) UNIQUE,
    prize_name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- 'Plush Toy', 'Electronics', 'RC Toy', 'Novelty'
    tickets_needed INT NOT NULL,
    physical_stock INT DEFAULT 0,
    procurement_cost NUMERIC(10, 2) DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PREDICTIVE MONTHLY BUDGET & ACCRUED LIABILITY PROVISIONS
CREATE TABLE IF NOT EXISTS public.predictive_budget_provisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,
    budget_month DATE NOT NULL, -- e.g. 2026-09-01
    monthly_target_budget NUMERIC(12, 2) NOT NULL,
    daily_burn_rate NUMERIC(10, 2) NOT NULL,
    daily_break_even_sales_needed NUMERIC(10, 2) NOT NULL,
    accrual_categories JSONB DEFAULT '[]'::jsonb, -- [{category, monthlyBudget, dailyProvision, actualPaid, status}]
    total_actual_disbursed NUMERIC(12, 2) DEFAULT 0,
    budget_variance_gap NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREATE INDEXES FOR FAST QUERYING
CREATE INDEX IF NOT EXISTS idx_recipes_company ON public.restaurant_recipes(company_id);
CREATE INDEX IF NOT EXISTS idx_banquet_dates ON public.banquet_bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_kitchen_expiry ON public.kitchen_prep_batches(expiry_date, spoilage_status);
CREATE INDEX IF NOT EXISTS idx_aggregator_cycle ON public.online_aggregator_settlements(platform, cycle_start_date);
CREATE INDEX IF NOT EXISTS idx_playcards_uid ON public.gamezone_playcards(card_uid);
CREATE INDEX IF NOT EXISTS idx_transactions_card ON public.gamezone_card_transactions(card_uid, created_at);
CREATE INDEX IF NOT EXISTS idx_machines_status ON public.gamezone_machines(current_status);
