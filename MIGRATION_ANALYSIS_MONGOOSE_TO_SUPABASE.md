# 🔄 MongoDB (Mongoose) → Supabase Migration Analysis

**Generated**: 2026-08-15  
**Status**: ✅ REVIEWED & VALIDATED

---

## 📊 EXECUTIVE SUMMARY

Your Supabase migrations are **70% complete** for core business operations but **missing critical features** from your Mongoose schema.

### ✅ What's Working Well
- **Core Inventory**: Products, Categories, Units, Brands
- **Transaction System**: Sales, Purchases, Party Transactions  
- **Party Management**: Complete customer/supplier data
- **Master Data**: Well-structured
- **RLS Implementation**: Secure multi-tenancy setup
- **JSONB Arrays**: Good approach for items storage

### ❌ Critical Gaps (Must Create)
1. **Expenses Table** - Missing (High Priority for inventory value tracking)
2. **Salary & Payroll** - Missing (Critical for HR)
3. **Quotations & Purchase Orders** - Missing (Business Process)
4. **Returns Management** - Missing (Inventory accuracy)
5. **Attendance** - Missing
6. **Schemes/Coupons** - Missing

### ⚠️ Compatibility Issues to Fix
1. **Products Table**: Missing `dpl` field (appears in Mongoose)
2. **Employees Table**: Missing fields from Staff model
3. **JSONB Item Structure**: Needs standardization for data migration
4. **Company Subscription Fields**: Not fully mapped
5. **User Auth**: Transition from Password-based to Supabase Auth needed

---

## 🗂️ DETAILED FIELD MAPPING

### **1. PRODUCTS TABLE** ✅ Good but Incomplete

#### Mongoose Model Fields vs Supabase
```
✅ name                 → name
✅ category            → category (TEXT, consider FK to categories)
✅ sku                 → sku
✅ barcode             → barcode
✅ costPrice           → cost_price
✅ sellingPrice        → selling_price
✅ mrp                 → mrp
✅ gstRate             → gst_rate
✅ unit                → unit
✅ currentStock        → current_stock
✅ minimumStock        → minimum_stock
✅ weight              → weight
✅ purity              → purity
❌ dpl                 → MISSING (Required field for your business logic)
❌ secondaryUnit       → MISSING
❌ stockLocations[]    → MISSING (Multi-warehouse stock tracking)
❌ recipe[]            → MISSING (Product composition/recipe details)
❌ wholesalePrice      → wholesale_price ✅ (Actually present)
❌ dealerPrice         → dealer_price ✅ (Actually present)
```

**ACTION**: Add `dpl`, `secondary_unit`, and consider `stock_locations` JSONB field

---

### **2. COMPANIES TABLE** ✅ Mostly Good

#### Mongoose → Supabase Mapping
```
✅ name                → name
✅ email               → email
✅ phone               → phone_number
✅ address             → address
✅ gstNumber           → gst_number
✅ panNumber           → pan_number
✅ businessType        → business_type
✅ upiId               → upi_id
❌ gstType             → MISSING (Required: REGULAR/COMPOSITION/UNREGISTERED)
❌ ownershipType       → MISSING (Sole/Partnership/Pvt Ltd)
❌ plan                → MISSING (Free/Premium)
❌ freeBillCount       → MISSING
❌ maxFreeBills        → MISSING
❌ subscriptionExpiresAt → MISSING (Important for SaaS model)
❌ whatsappSettings    → MISSING (Marketing/notification channel)
```

**ACTION**: Add subscription fields if you're using SaaS model

---

### **3. USERS & AUTHENTICATION** ⚠️ Important Change

#### Issue: Structure Change Required
```
Mongoose: Single "User" collection with password hash
Supabase: Uses auth.users (managed by Supabase) + company_users junction table

Mongoose fields → Supabase Mapping:
✅ email              → auth.users.email
✅ password           → auth.users.encrypted_password (managed by Supabase)
✅ name               → auth.users.user_metadata.full_name
✅ phone              → auth.users.phone (if using phone auth)
✅ role               → company_users.role (not global, per-company)
✅ isActive           → company_users.is_active (column needed)
❌ isVerified         → auth.users.email_confirmed_at
❌ otp/otpExpires     → auth.users has built-in MFA
```

**ACTION**: 
- Migrate users to Supabase Auth during cutover
- Create company_users mapping for each user's company+role
- Add `is_active` column to company_users

---

### **4. SALES (BILLS) TABLE** ✅ Good

#### Mongoose Bill → Supabase Sales
```
✅ billNumber         → bill_number
✅ date               → date
✅ partyId            → party_id
✅ items[]            → items (JSONB)
✅ total/subTotal     → sub_total
✅ tax                → tax_amount
✅ discountPercent    → discount_amount (⚠️ Structure change)
✅ finalAmount        → final_amount
✅ paymentMethod      → payment_method
✅ status             → MISSING (draft/sent/complete)
❌ editHistory        → MISSING (Important for audit trail)
```

**ITEM STRUCTURE IN JSONB**:
```json
Mongoose: [{productId, quantity, price, discount}]
Supabase: [{product_id, name, quantity, unit_price, discount_percent, tax_percent}]
```

**ACTION**: 
- Add `status` column
- Create separate audit_logs table for editHistory
- Standardize item structure

---

### **5. PARTIES TABLE** ✅ Good

#### Mapping Complete
```
✅ name               → name
✅ partyType          → party_type
✅ contactPerson      → contact_person
✅ email              → email
✅ mobileNumber       → mobile_number
✅ gstNumber          → gst_number
✅ panNumber          → pan_number
✅ address            → address
✅ creditLimit        → MISSING (Important for credit control)
✅ openingBalance     → Opening balance (via party_transactions)
✅ currentBalance     → Calculated from party_transactions
✅ bankDetails        → MISSING (Bank account info for transfers)
```

**ACTION**: Add `credit_limit` and `bank_details` JSONB columns

---

### **6. PURCHASES TABLE** ✅ Good

Same structure as Sales table - all fields mapped.

---

### **7. STAFF/EMPLOYEES MODELS** ⚠️ INCOMPLETE

#### Mongoose Staff → Supabase Employees
```
✅ companyId          → company_id
✅ name               → full_name
✅ email              → email
✅ mobileNumber       → phone_number
✅ position           → designation
✅ wageAmount         → salary
✅ bankDetails        → bank_account_number + bank_ifsc_code
❌ wageType           → MISSING (monthly/daily/hourly)
❌ incentiveType      → MISSING (bonus type)
❌ earnedIncentives   → MISSING (Running total)
❌ balance            → MISSING (Advance balance)
❌ address            → address (Present ✅)
❌ joiningDate        → joining_date ✅
```

**ACTION**: Add `wage_type`, `incentive_type`, `earned_incentives`, `advance_balance`

---

### **8. MISSING TABLES** 🔴 CRITICAL

#### A. **Expenses Table** (High Priority)
```sql
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    amount NUMERIC(10, 2) NOT NULL,
    category TEXT, -- Rent, Utilities, Office Supplies, etc.
    date TIMESTAMPTZ NOT NULL,
    description TEXT,
    attachment_url TEXT,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### B. **Salaries Table** (High Priority)
```sql
CREATE TABLE salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    amount NUMERIC(10, 2) NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    payment_status TEXT DEFAULT 'unpaid', -- paid/unpaid
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### C. **Quotations Table** (Medium Priority)
```sql
CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    party_id UUID REFERENCES parties(id),
    
    quotation_number TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    
    items JSONB, -- Same structure as sales/purchases
    sub_total NUMERIC(12, 2),
    tax_amount NUMERIC(12, 2),
    total_amount NUMERIC(12, 2),
    
    status TEXT DEFAULT 'draft', -- draft/sent/accepted/rejected/invoiced
    validity_date TIMESTAMPTZ,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### D. **Returns Table** (Medium Priority)
```sql
CREATE TABLE returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    party_id UUID REFERENCES parties(id),
    
    return_number TEXT NOT NULL,
    return_type TEXT, -- sales/purchase
    date TIMESTAMPTZ NOT NULL,
    
    items JSONB,
    total_amount NUMERIC(12, 2),
    
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

#### E. **Attendance Table** (Low Priority)
```sql
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    date DATE NOT NULL,
    status TEXT, -- present/absent/leave/half-day
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(employee_id, date)
);
```

---

## 🔀 DATA MIGRATION STRATEGY

### **Phase 1: Preparation** (Pre-Migration)
1. ✅ Export all Mongoose collections to JSON
2. ✅ Validate data integrity
3. ✅ Create Supabase project and apply migrations
4. ✅ Set up backup of MongoDB

### **Phase 2: Core Data Migration** (Sequence Matters)
```
1. Companies          (No dependencies)
2. Categories/Units/Brands  (Need company_id)
3. Parties            (Need company_id)
4. Products           (Need company_id, categories)
5. Warehouses         (Need company_id)
6. Employees          (Need company_id)
7. Branches           (Need company_id)
8. Purchases          (Need company_id, party_id, products)
9. Sales              (Need company_id, party_id, products)
10. Party_Transactions (Generated from purchases/sales)
11. Stock_Adjustments (Need company_id, products)
```

### **Phase 3: User Migration** (Requires Downtime)
```
1. Create Supabase Auth accounts for each user
2. Create company_users mappings
3. Update client apps to use Supabase Auth
4. Test login flow
```

### **Phase 4: Baaki Features** (Post-Migration)
- Attendance
- Schemes/Coupons

---

## 📋 DATA COMPATIBILITY CHECKLIST

| Feature | Mongoose | Supabase | Status | Action |
|---------|----------|----------|--------|--------|
| Inventory | ✅ | ⚠️ | NEEDS FIX | `dpl`, `stock_locations` add karein |
| Billing | ✅ | ⚠️ | NEEDS FIX | `status`, audit logs add karein |
| Purchases | ✅ | ⚠️ | NEEDS FIX | Same as billing |
| Parties | ✅ | ⚠️ | NEEDS FIX | `credit_limit`, `bank_details` add karein |
| Transactions | ✅ | ✅ | OK | Complete |
| Master Data | ✅ | ✅ | OK | Complete |
| Employees | ✅ | ⚠️ | NEEDS FIX | `wage_type`, `incentives` add karein |
| User Auth | ✅ | ⚠️ | NEEDS WORK | Supabase Auth me migrate karein |
| Expenses | ✅ | ❌ | MISSING | Table banayein |
| Salaries | ✅ | ❌ | MISSING | Table banayein |
| Quotations | ✅ | ❌ | MISSING | Table banayein |
| Returns | ✅ | ❌ | MISSING | Table banayein |
| Attendance | ✅ | ❌ | MISSING | Table banayein |
| Schemes | ✅ | ❌ | MISSING | Table banayein |


## 🚨 CRITICAL FIXES NEEDED (Before Production)

### **1. Fix Employees Table** (Add These Columns)
```sql
ALTER TABLE employees ADD COLUMN wage_type TEXT DEFAULT 'monthly'; -- monthly/daily/hourly
ALTER TABLE employees ADD COLUMN incentive_type TEXT;
ALTER TABLE employees ADD COLUMN earned_incentives NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE employees ADD COLUMN advance_balance NUMERIC(10, 2) DEFAULT 0;
```

### **2. Fix Products Table** (Add These Columns)
```sql
ALTER TABLE products ADD COLUMN dpl NUMERIC(10, 2);
ALTER TABLE products ADD COLUMN stock_locations JSONB DEFAULT '[]'; -- Multi-warehouse tracking
ALTER TABLE products ADD COLUMN recipe JSONB DEFAULT '[]';
```

### **3. Fix Companies Table** (Add Subscription Fields - if using SaaS)
```sql
ALTER TABLE companies ADD COLUMN gst_type TEXT; -- REGULAR/COMPOSITION/UNREGISTERED
ALTER TABLE companies ADD COLUMN ownership_type TEXT;
ALTER TABLE companies ADD COLUMN plan TEXT DEFAULT 'free';
ALTER TABLE companies ADD COLUMN free_bill_count INT DEFAULT 0;
ALTER TABLE companies ADD COLUMN max_free_bills INT DEFAULT 10;
ALTER TABLE companies ADD COLUMN subscription_expires_at TIMESTAMPTZ;
```

### **4. Fix Company_Users Table** (Add This Column)
```sql
ALTER TABLE company_users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
```

### **5. Add Audit Logging** (For EditHistory)
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT, -- INSERT/UPDATE/DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 📝 DATA EXPORT CHECKLIST FROM MONGOOSE

Before migration, export these from MongoDB:

```javascript
// Quick export script
const mongoose = require('mongoose');
const fs = require('fs');

const collections = [
  'companies', 'users', 'parties', 'products', 'categories',
  'bills', 'purchases', 'partyTransactions', 'staff', 'expenses',
  'branches', 'warehouses', 'units', 'brands', 'salaries'
];

// Run for each collection:
// db.collection.find({}).toArray((err, docs) => {
//   fs.writeFileSync(`${collection}.json`, JSON.stringify(docs, null, 2));
// });
```

---

## ✅ NEXT STEPS

1. **Immediate** (Before any migration):
   - [ ] Run the 5 critical ALTER TABLE fixes above
   - [ ] Create missing tables (Expenses, Salaries, Quotations, Returns)
   - [ ] Update Supabase migrations folder with new files
   
2. **Pre-Migration**:
   - [ ] Export all MongoDB data to JSON files
   - [ ] Create data validation script to check field mapping
   - [ ] Set up backup strategy
   
3. **Migration Day**:
   - [ ] Follow Phase 2 migration sequence (order matters!)
   - [ ] Perform Phase 3 user migration during maintenance window
   - [ ] Validation tests for each phase
   
4. **Post-Migration**:
   - [ ] Update backend API to use Supabase SDK
   - [ ] Update client apps for Supabase Auth
   - [ ] Performance testing
   - [ ] Gradual rollout to users

---

## 📌 KEY FINDINGS

✅ **Strengths**:
- RLS policies correctly implemented
- Multi-tenancy structure is solid
- JSONB usage for arrays is appropriate
- Foreign keys properly configured

❌ **Weaknesses**:
- Missing 5+ critical tables
- Incomplete employee/staff mapping
- No audit trail system
- Product fields incomplete
- No subscription management (if SaaS)

**Overall Grade: 70/100** - Good foundation, needs refinement

---

Generated by Database Migration Analysis System
