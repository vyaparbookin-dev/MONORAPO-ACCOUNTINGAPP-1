-- ============================================================================
-- SUPABASE POSTGRESQL COMPLETE ENTERPRISE MIGRATION
-- Generated for Monorepo Accounting & ERP Platform
-- Includes:
--  1. Coupons Engine with Phone-Link, WhatsApp OTP Verification & Audit Trail
--  2. Mobile PWA Ghar Kharch (Home Expense) & Operating Expense Ledger
--  3. Complete Staff HRMS, Attendance, Overtime, Commission & Salary Disbursement
--  4. B2B Documents (Quotations, Sales Orders, Delivery Challans, E-Way Bill, IRN)
--  5. Purchases, Purchase Orders & Multi-Warehouse Stock Transfers / Adjustments
--  6. Capital Infusion, Partner Equity & Startup Renovation Ledger
--  7. TDS / TCS Statutory Tax Compliance & Govt Challan Tracking
--  8. CRM Leads, Customer Memberships, Schemes & Promotional Rules
--  9. Restaurant KOT, Perishable Batches, Recipe BOM & Food Aggregator Reconciliation
-- 10. Cashless Gamezone RFID Smartcards, Multi-Tier Passes & Hardware Abstraction (HAL)
-- 11. Security Audit Logs, Laterpad Quick Notes, Bank Statement Reconciliation & AI Usage
-- Date: 2026-09-11
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. COMPANIES & BUSINESS ENTITIES
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
    business_type TEXT[],
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
-- 2. WAREHOUSES & BRANCHES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    location TEXT,
    capacity NUMERIC(12, 2) DEFAULT 0,
    manager_name VARCHAR(150),
    contact_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_code VARCHAR(50) UNIQUE NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    address TEXT,
    contact_phone VARCHAR(50),
    manager_name VARCHAR(150),
    is_franchise BOOLEAN DEFAULT FALSE,
    franchise_royalty_percent NUMERIC(5, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. PARTIES & CUSTOMER 360
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
    shipping_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    gst_number VARCHAR(50),
    pan_number VARCHAR(50),
    aadhar_number VARCHAR(50),
    credit_limit NUMERIC(12, 2) DEFAULT 0,
    opening_balance NUMERIC(12, 2) DEFAULT 0,
    current_balance NUMERIC(12, 2) DEFAULT 0,
    loyalty_tier VARCHAR(50) DEFAULT 'SILVER',
    loyalty_points_balance INT DEFAULT 0,
    rfid_card_uid VARCHAR(100),
    site_access TEXT[],
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. PRODUCTS & MULTI-INDUSTRY INVENTORY ENGINE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    site VARCHAR(150),
    category VARCHAR(100) DEFAULT 'General',
    sub_category VARCHAR(100),
    brand VARCHAR(100),
    hsn_code VARCHAR(50) DEFAULT '0000',
    sku VARCHAR(100),
    barcode VARCHAR(100),
    cost_price NUMERIC(12, 2) DEFAULT 0,
    p_cost NUMERIC(12, 2) DEFAULT 0,
    selling_price NUMERIC(12, 2) DEFAULT 0,
    wholesale_price NUMERIC(12, 2) DEFAULT 0,
    dealer_price NUMERIC(12, 2) DEFAULT 0,
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
    imei_numbers JSONB DEFAULT '[]'::jsonb,
    garment_matrix JSONB DEFAULT '{}'::jsonb,
    hardware_specs JSONB DEFAULT '{}'::jsonb,
    pharma_batch JSONB DEFAULT '{}'::jsonb,
    recipe_bom JSONB DEFAULT '[]'::jsonb,
    operating_overheads JSONB DEFAULT '[]'::jsonb,
    is_raw_material BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. COUPONS ENGINE & SECURITY AUDIT TRAIL
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    code VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255),
    description TEXT,
    coupon_type VARCHAR(50) DEFAULT 'flat_discount', -- 'flat_discount' | 'percent_discount' | 'special_item_price' | 'free_item'
    discount_amount NUMERIC(12, 2) DEFAULT 0,
    discount_percent NUMERIC(5, 2) DEFAULT 0,
    min_bill_amount NUMERIC(12, 2) DEFAULT 0,
    max_discount_amount NUMERIC(12, 2) DEFAULT 0,
    target_item_name VARCHAR(255),
    target_item_price NUMERIC(12, 2) DEFAULT 0,
    free_item_name VARCHAR(255),
    applies_to_categories TEXT[],
    customer_phone VARCHAR(50),
    customer_name VARCHAR(255),
    is_single_use BOOLEAN DEFAULT TRUE,
    times_used INT DEFAULT 0,
    max_uses INT DEFAULT 1,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    used_by_phone VARCHAR(50),
    used_in_invoice VARCHAR(100),
    redemption_method VARCHAR(50) DEFAULT 'self', -- 'self' | 'otp_transfer'
    is_transferred BOOLEAN DEFAULT FALSE,
    transferred_to_phone VARCHAR(50),
    transfer_otp VARCHAR(10),
    transfer_otp_verified BOOLEAN DEFAULT FALSE,
    transfer_otp_verified_at TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on public.coupons
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS coupon_type VARCHAR(50) DEFAULT 'flat_discount';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS min_bill_amount NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_discount_amount NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS target_item_name VARCHAR(255);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS target_item_price NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS free_item_name VARCHAR(255);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_single_use BOOLEAN DEFAULT TRUE;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS times_used INT DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_uses INT DEFAULT 1;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS used BOOLEAN DEFAULT FALSE;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS used_by_phone VARCHAR(50);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS used_in_invoice VARCHAR(100);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS redemption_method VARCHAR(50) DEFAULT 'self';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_transferred BOOLEAN DEFAULT FALSE;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS transferred_to_phone VARCHAR(50);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS transfer_otp VARCHAR(10);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS transfer_otp_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS transfer_otp_verified_at TIMESTAMPTZ;

-- ============================================================================
-- 6. EXPENSES & MOBILE PWA GHAR KHARCH LEDGER
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    category VARCHAR(100) DEFAULT 'Other',
    family_member VARCHAR(100) DEFAULT '',
    transaction_flow VARCHAR(50) DEFAULT 'given', -- 'given' (Kharch/Drawings) | 'received' (Inflow/Borrowing)
    expense_type VARCHAR(100) DEFAULT 'operating', -- 'operating', 'drawings', 'ghar_kharch', 'personal_investment', 'security_deposit', 'bank_interest_paid', 'bank_interest_received'
    is_ghar_kharch BOOLEAN DEFAULT FALSE,
    payment_method VARCHAR(50) DEFAULT 'cash', -- 'cash', 'upi', 'bank', 'cheque'
    deposit_details JSONB DEFAULT '{}'::jsonb,
    receipt_url TEXT,
    status VARCHAR(50) DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
    notes TEXT,
    synced BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on public.expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS family_member VARCHAR(100) DEFAULT '';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS transaction_flow VARCHAR(50) DEFAULT 'given';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS expense_type VARCHAR(100) DEFAULT 'operating';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS is_ghar_kharch BOOLEAN DEFAULT FALSE;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS deposit_details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- ============================================================================
-- 7. BILLS & SALES INVOICES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL,
    warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
    bill_number VARCHAR(100) NOT NULL,
    bill_type VARCHAR(50) DEFAULT 'standard',
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
    payment_method VARCHAR(50) DEFAULT 'cash',
    payment_status VARCHAR(50) DEFAULT 'paid',
    coupon_applied VARCHAR(100),
    coupon_discount NUMERIC(12, 2) DEFAULT 0,
    items JSONB DEFAULT '[]'::jsonb,
    breakage_charges NUMERIC(12, 2) DEFAULT 0,
    aggregator_payout_meta JSONB DEFAULT '{}'::jsonb,
    gamezone_station_meta JSONB DEFAULT '{}'::jsonb,
    handover_signed_by_host VARCHAR(255),
    handover_signed_by_manager VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. STAFF HRMS, ATTENDANCE & SALARY DISBURSEMENT
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    mobile_number VARCHAR(50),
    position VARCHAR(100),
    role VARCHAR(50) DEFAULT 'staff',
    wage_type VARCHAR(50) DEFAULT 'monthly', -- 'monthly' | 'daily'
    wage_amount NUMERIC(12, 2) DEFAULT 0,
    salary NUMERIC(12, 2) DEFAULT 0,
    overtime_rate_per_hour NUMERIC(10, 2) DEFAULT 0,
    sales_target NUMERIC(12, 2) DEFAULT 0,
    commission_percent NUMERIC(5, 2) DEFAULT 0,
    paid_leaves_allowed INT DEFAULT 0,
    shift_start_time VARCHAR(20),
    shift_end_time VARCHAR(20),
    incentive_type VARCHAR(50) DEFAULT 'none',
    incentive_value NUMERIC(10, 2) DEFAULT 0,
    earned_incentives NUMERIC(12, 2) DEFAULT 0,
    balance NUMERIC(12, 2) DEFAULT 0,
    department VARCHAR(100),
    date_of_joining DATE DEFAULT CURRENT_DATE,
    address TEXT,
    aadhar_number VARCHAR(50),
    pan_number VARCHAR(50),
    bank_details JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'present', -- 'present' | 'absent' | 'half_day' | 'paid_leave'
    punch_in TIMESTAMPTZ,
    punch_out TIMESTAMPTZ,
    overtime_hours NUMERIC(4, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    month VARCHAR(20) NOT NULL, -- e.g. "September 2026"
    base_salary NUMERIC(12, 2) DEFAULT 0,
    overtime_pay NUMERIC(12, 2) DEFAULT 0,
    incentives NUMERIC(12, 2) DEFAULT 0,
    bonus NUMERIC(12, 2) DEFAULT 0,
    deductions NUMERIC(12, 2) DEFAULT 0,
    advances_adjusted NUMERIC(12, 2) DEFAULT 0,
    net_paid NUMERIC(12, 2) DEFAULT 0,
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) DEFAULT 'bank',
    payment_status VARCHAR(50) DEFAULT 'paid',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.staff_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- 'advance' | 'salary_payment' | 'incentive' | 'penalty'
    amount NUMERIC(12, 2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'cash',
    date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. B2B DOCUMENTS, QUOTATIONS & E-WAY BILLS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.b2b_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
    document_number VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'quotation' | 'sales_order' | 'delivery_challan' | 'proforma'
    date DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    items JSONB DEFAULT '[]'::jsonb,
    total_amount NUMERIC(12, 2) DEFAULT 0,
    tax_amount NUMERIC(12, 2) DEFAULT 0,
    final_amount NUMERIC(12, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'open', -- 'open' | 'converted' | 'cancelled'
    converted_bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
    notes TEXT,
    terms_and_conditions TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.eway_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    eway_bill_number VARCHAR(50),
    irn VARCHAR(100),
    generated_date TIMESTAMPTZ DEFAULT NOW(),
    valid_upto TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'generated',
    vehicle_number VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 10. PURCHASES, PURCHASE ORDERS & INVENTORY ADJUSTMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
    purchase_number VARCHAR(100) NOT NULL,
    supplier_invoice_number VARCHAR(100),
    purchase_date DATE DEFAULT CURRENT_DATE,
    subtotal NUMERIC(12, 2) DEFAULT 0,
    tax_amount NUMERIC(12, 2) DEFAULT 0,
    final_amount NUMERIC(12, 2) DEFAULT 0,
    amount_paid NUMERIC(12, 2) DEFAULT 0,
    balance_amount NUMERIC(12, 2) DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    payment_method VARCHAR(50) DEFAULT 'bank',
    items JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
    po_number VARCHAR(100) NOT NULL,
    order_date DATE DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    items JSONB DEFAULT '[]'::jsonb,
    total_amount NUMERIC(12, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'open', -- 'open' | 'fulfilled' | 'cancelled'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sales_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL,
    bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
    return_number VARCHAR(100) NOT NULL,
    return_date DATE DEFAULT CURRENT_DATE,
    items JSONB DEFAULT '[]'::jsonb,
    total_refund_amount NUMERIC(12, 2) DEFAULT 0,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    transfer_number VARCHAR(100) NOT NULL,
    from_branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    from_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
    to_branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    to_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
    items JSONB DEFAULT '[]'::jsonb,
    date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
    adjustment_number VARCHAR(100),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    adjustment_type VARCHAR(50) NOT NULL, -- 'ADD' | 'REDUCE' | 'DAMAGE' | 'EXPIRED'
    quantity NUMERIC(12, 2) NOT NULL,
    reason TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 11. CAPITAL INFUSION & PROPRIETOR DRAWINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.capitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    entry_type VARCHAR(100) NOT NULL, -- 'opening_cash', 'opening_bank', 'owner_capital', 'partner_capital', 'additional_capital', 'unsecured_loan', 'startup_renovation', 'legal_license_setup'
    title VARCHAR(255) NOT NULL,
    contributor_name VARCHAR(255) DEFAULT 'Owner / प्रोपराइटर',
    amount NUMERIC(14, 2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    payment_mode VARCHAR(50) DEFAULT 'cash',
    bank_name VARCHAR(150),
    account_number VARCHAR(100),
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 12. STATUTORY COMPLIANCE: TDS & TCS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tds_tcs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'TDS_PAYABLE', 'TDS_RECEIVABLE', 'TCS_PAYABLE', 'TCS_RECEIVABLE'
    section VARCHAR(50) NOT NULL, -- '194J', '194C', '206C', etc.
    rate NUMERIC(5, 2) NOT NULL,
    base_amount NUMERIC(14, 2) NOT NULL,
    tax_amount NUMERIC(14, 2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    related_document_id UUID,
    related_document_model VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending' | 'filed' | 'paid'
    challan_number VARCHAR(100),
    payment_date DATE,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 13. CRM LEADS, MEMBERSHIPS & SCHEMES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    company_name VARCHAR(255),
    source VARCHAR(100) DEFAULT 'direct',
    stage VARCHAR(50) DEFAULT 'new', -- 'new' | 'contacted' | 'proposal' | 'won' | 'lost'
    expected_revenue NUMERIC(12, 2) DEFAULT 0,
    assigned_to UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    member_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    membership_type VARCHAR(50) DEFAULT 'standard',
    tier VARCHAR(50) DEFAULT 'Silver',
    points INT DEFAULT 0,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    scheme_type VARCHAR(50) DEFAULT 'volume_discount',
    buy_quantity NUMERIC(10, 2) DEFAULT 1,
    get_quantity NUMERIC(10, 2) DEFAULT 0,
    discount_percent NUMERIC(5, 2) DEFAULT 0,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 14. BANK STATEMENTS & RECONCILIATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bank_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    bank_name VARCHAR(150) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT,
    reference_utr VARCHAR(150),
    debit_amount NUMERIC(12, 2) DEFAULT 0,
    credit_amount NUMERIC(12, 2) DEFAULT 0,
    balance_amount NUMERIC(14, 2) DEFAULT 0,
    is_reconciled BOOLEAN DEFAULT FALSE,
    matched_bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
    matched_expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 15. QUICK LATERPAD NOTES, SECURITY LOGS & AI USAGE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.laterpads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    tag VARCHAR(50) DEFAULT 'General',
    is_pinned BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_identifier VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    total_tokens INT DEFAULT 0,
    cost_estimated NUMERIC(8, 4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    link_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR ULTRA-FAST PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_phone ON public.coupons(customer_phone);
CREATE INDEX IF NOT EXISTS idx_expenses_company_date ON public.expenses(company_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_ghar_kharch ON public.expenses(is_ghar_kharch);
CREATE INDEX IF NOT EXISTS idx_bills_number ON public.bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_staff_company ON public.staff(company_id);
CREATE INDEX IF NOT EXISTS idx_attendance_staff_date ON public.attendances(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_b2b_documents_number ON public.b2b_documents(document_number);
CREATE INDEX IF NOT EXISTS idx_purchases_number ON public.purchases(purchase_number);
CREATE INDEX IF NOT EXISTS idx_tds_tcs_company_date ON public.tds_tcs(company_id, date);

-- Enable Row Level Security (RLS) on sensitive tables
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capitals ENABLE ROW LEVEL SECURITY;
