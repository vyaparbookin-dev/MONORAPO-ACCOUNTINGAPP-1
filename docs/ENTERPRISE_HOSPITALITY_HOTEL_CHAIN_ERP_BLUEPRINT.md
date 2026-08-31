# 👑 ENTERPRISE 5-STAR LUXURY HOTEL, RESORT & MEGA-BANQUET CHAIN ERP
## Architectural Blueprint & System Specifications (Taj / Oberoi / Marriott / Oracle Opera & IDS Next Benchmark)

---

## 📌 Executive Summary

Modern high-end luxury hospitality operations (5-Star Hotels, Luxury Resorts, Destination Wedding Venues, Mega-Banquets) operate on a multi-million rupee scale (₹15 Lakhs to ₹1 Crore+ per event). Managing a 3 to 5 day destination wedding or grand corporate summit involves coordinating hundreds of rooms, complex multi-meal schedules, outsourced specialized vendors, temporary event manpower, rapid venue turnarounds, and cross-departmental billing.

This document outlines the **End-to-End Enterprise Architecture Blueprint** for integrating this capability into our Monorepo ERP through a modular, pluggable engine (`isLuxuryHotelChain`).

---

## 🏛️ System Architecture Overview

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │   👑 ENTERPRISE HOSPITALITY & 5-STAR RESORT CHAIN ERP  │
                                  └───────────────────────────┬────────────────────────────┘
                                                              │
        ┌───────────────────┬───────────────────┬─────────────┴─────┬───────────────────┬───────────────────┐
        ▼                   ▼                   ▼                   ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ 📅 MULTI-DAY  │   │ 🛏️ PMS & ROOM │   │ 🛎️ IN-ROOM    │   │ 🤝 OUTSOURCED │   │ 👥 EVENT      │   │ 🧹 VENUE      │
│ RESIDENTIAL   │   │ ALLOTMENT     │   │ DINING &      │   │ VENDORS &     │   │ MANPOWER &    │   │ TURNOVER &    │
│ ITINERARY     │   │ GRID (GROUP)  │   │ SERVICE LOG   │   │ SPECIAL ITEMS │   │ STAKEHOLDERS  │   │ HOUSEKEEPING  │
└───────────────┘   └───────────────┘   └───────────────┘   └───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │                   │                   │                   │
        └───────────────────┴───────────────────┴─────────────┬─────┴───────────────────┴───────────────────┘
                                                              ▼
                                            ┌───────────────────────────────────┐
                                            │ 💳 MASTER WEDDING FOLIO / INVOICE │
                                            │ (GST, Advance Token, Settlement)  │
                                            └───────────────────────────────────┘
```

---

## 🌟 Core Modules Breakdown

### 1. 📅 Multi-Day Residential Wedding & Event Itinerary Engine
Handles multi-day programs spanning 2 to 5 consecutive days with changing venues, guest counts, and meal profiles.

- **Day-Wise Schedule Builder:**
  - **Day 1 (Arrival & Mehendi):** Poolside Lawn (4 PM - 8 PM) • 150 Pax • High Tea & Live Chaat Counter.
  - **Day 2 (Sangeet & Cocktail Night):** Grand Ballroom AC Hall (7 PM - 3 AM) • 300 Pax • 8 Starters, Mocktail Bar, DJ & LED Truss.
  - **Day 3 (Haldi, Mandap Pheras & Royal Reception):** Main Royal Lawn (11 AM - 12 AM) • 600 Pax • 12-Course Royal Thali.
- **Combined Daily Raw Material Indent:** Aggregates required groceries, dairy, cooking fuel, and bakery requirements across all sub-events per day.
- **Master Wedding Contract & Guaranteed Plate Minimums:** Locks minimum guaranteed plates per sub-event with automated over-consumption billing.

---

### 2. 🛏️ Property Management System (PMS) & Room Grid
Manages total room inventory, group blockings, check-in flows, and billing folios.

- **Interactive Room Grid:** Visual color-coded matrix of all rooms (Deluxe, Executive Suites, Presidential Villas):
  - 🟢 **Available / Clean**
  - 🔴 **Occupied (Linked to Guest / Event)**
  - 🟡 **Dirty / Cleaning in Progress**
  - 🔵 **Reserved / Group Blocked**
  - 🟣 **Maintenance / Out of Order**
- **Group Wedding Room Block:** One-click block of 50 to 150 rooms for a specific host (e.g. *Sharma Wedding, 10th - 14th Dec*).
- **Guest KYC & Fast Check-in:** Aadhaar/Passport photo capture, room keycard assignment, luggage tag tracker.
- **Individual Room Folios:** Each room maintains its own sub-ledger for personal expenses (extra bed, laundry, minibar, phone calls).

---

### 3. 🛎️ In-Room Dining (IRD) & Room Service Posting
Seamless ordering and ledger routing for food, beverages, and amenities delivered to guest rooms.

- **Room Order Dispatch:** Food/tea ordered from room phone or QR code sent directly to Kitchen Display System (KDS).
- **Flexible Billing Routing:**
  - Option A: **Post to Room Folio** (Paid by guest at personal checkout).
  - Option B: **Post to Master Wedding Bill** (Covered by host as part of all-inclusive wedding package).
  - Option C: **Instant Cash / UPI on Delivery**.
- **Steward & Delivery Audit:** Records which steward delivered the order, delivery time, and guest signature slip.

---

### 4. 🤝 Outsourced Vendors, Special Guest Requests & Payouts
Manages third-party vendors, on-demand luxury items, and advance settlement workflows.

- **Outsourced Vendor Categories:**
  - 🌸 **Floral & Theme Stage Decorators** (Stage setup, flower chandeliers, carpet walkways).
  - 🎵 **DJ, Sound, Laser & LED Wall Providers**.
  - 🎂 **Specialty Wedding Cake Bakers** (Multi-tier fondant/truffle designer cakes).
  - 🚗 **Luxury & Vintage Car Rentals** (Groom entry vintage cars, luxury guest shuttles).
  - 🎆 **Cold Fire & Pyro Technicians**.
  - 🐎 **Baraat Brass Band & Ghodi / Elephant Arrangements**.
- **Guest On-Demand Procurement:** If a VIP guest requests a specific brand of cigar, exotic fruits, baby food, or special medicine, staff can procure it from outside and post with markup to the master ledger.
- **Vendor Payment Ledger:**
  - Total Contract Value.
  - Advance Token Paid.
  - Retention Amount (paid after post-event venue inspection).
  - Vendor Commission / Markup Tracking.

---

### 5. 👥 Temporary Event Manpower & Service Staffing Roster
Coordinates freelance and agency staff hired specifically for large events.

- **Manpower Categories:**
  - 👨‍🍳 Extra Chefs & Specialty Halwais (Sweets/Tandoor).
  - 🤵 Freelance Banquet Stewards & Uniformed Waitstaff.
  - 🛡️ Bouncers, VIP Bodyguards & Gate Security.
  - 🚗 Valet Parking Drivers.
  - 🧹 Heavy-Duty Cleaning & Dishwashing Teams.
- **Shift & Wage Tracker:** Shift hours (Morning / Evening / Full Night), hourly or per-shift pay rate, cash voucher / bank payout logging.
- **Duty Location Allocation:** Assigns staff to specific zones (e.g. *Bar Counter: 4 Stewards, Buffet Line: 8 Stewards, Entrance: 2 Valets*).

---

### 6. 🧹 Venue Turnover, Cleaning & Inspection Management
Controls rapid venue turnover between consecutive morning and evening events.

- **Venue Timeline Tracking:**
  - 10:00 AM - 03:00 PM: Event 1 (Morning Corporate Lunch in Hall A).
  - 03:00 PM - 05:30 PM: **Mandatory Turnover Window** (Deep Cleaning, Tablecloth Change, Carpet Vacuum, AC Sanitization, Trash Clearance).
  - 05:30 PM - 06:30 PM: Decorator Setup for Event 2.
  - 07:00 PM - 12:00 AM: Event 2 (Evening Sangeet in Hall A).
- **Inspection Checklist & Gate Pass:** Supervisor digitally checks off cleanliness, fragrance, lighting, and sound check before handing over the venue key to the next host.

---

### 7. 📸 Event Stakeholders & VIP CRM Directory
Maintains a complete contact and credential database of all parties involved in an event.

- **Host & Family Hierarchy:** Primary Host, Bride's Father, Groom's Father, Decision Maker for Extra Orders.
- **Media & Artists Directory:** Official Photographers, Videographers, Drone Operators, Anchor/MC, Makeup Artists, Mehendi Artists.
- **VIP Guest List & Preferences:** Specific dietary restrictions (Jain food, Vegan, Gluten-Free), VIP room requests, airport pickup schedules.

---

### 8. 📈 Dynamic Room Tariff & Surge Pricing Algorithm
Optimizes hotel room revenues based on market demand and real-time occupancy.

- **Occupancy-Based Rate Escalation:**
  $$\text{Current Room Tariff} = \text{Base Price} \times \left(1 + \frac{\text{Occupancy \%} - 50\%}{100}\right) \times \text{Seasonal Multiplier}$$
- **Wedding / Peak Season Locks:** Blocks standard discount rates during wedding dates (Nov-Feb) and enforces minimum 2-night stay packages.

---

### 9. 🏢 Multi-Property & Chain Management (Head Office Dashboard)
Centralized oversight for hotel chains with properties across multiple cities (e.g. *Bhopal, Indore, Goa, Jaipur*).

- **Global Super-Admin View:**
  - Property-wise Daily Occupancy & ADR (Average Daily Rate).
  - Banquet Sales vs Food Cost Ratios.
  - Outstanding Host Receivables.
  - Centralized Vendor Master & Purchasing Power.

---

## 💳 The Master Wedding Folio (Single Grand Invoice)

At the conclusion of a ₹25,00,000 multi-day wedding, the ERP merges all fragmented transactions into one crystal-clear **Master Settlement Folio**:

| Item / Department | Details | Amount (₹) |
|---|---|---|
| **Residential Rooms** | 40 Deluxe Rooms × 3 Nights @ ₹4,500/night | ₹5,40,000 |
| **Luxury Suites** | 4 Presidential Suites × 3 Nights @ ₹12,000/night | ₹1,44,000 |
| **Day 1: Mehendi Catering** | 150 Pax @ ₹450/Plate | ₹67,500 |
| **Day 2: Sangeet Dinner** | 300 Pax @ ₹750/Plate + Hall Rent | ₹2,75,000 |
| **Day 3: Royal Reception** | 600 Pax @ ₹950/Plate + Main Lawn Rent | ₹6,70,000 |
| **In-Room Dining (IRD)** | Guest Room Tea/Snacks Consolidated | ₹38,400 |
| **Outsourced Decor & DJ** | Floral Decor, Stage Truss & DJ Sound | ₹3,20,000 |
| **Add-ons & Overtime** | 2-Tier Designer Cake, 3h Late Night Hall Overtime | ₹45,000 |
| **Applicable Taxes (GST)** | Food (5%) + Rooms (12%) + Services (18%) | ₹2,85,500 |
| **Gross Total Value** | | **₹23,85,400** |
| **Advance Tokens Paid** | Booking Token + Pre-Event Instalment | -₹10,00,000 |
| **Final Balance Due** | **Settled at Checkout** | **₹13,85,400** |

---

## 🛠️ Monorepo Implementation Architecture

```
monorapo-accountingapp-1/
├── apps/
│   ├── web/
│   │   └── src/
│   │       ├── screens/
│   │       │   ├── HospitalityPMS/          # 🏨 Dedicated Hotel & PMS Screen
│   │       │   │   ├── RoomGridPage.jsx     # Visual Color-Coded Room Inventory
│   │       │   │   ├── EventItineraryPage.jsx # Multi-Day Wedding Timeline
│   │       │   │   ├── MasterFolioPage.jsx  # Consolidated Grand Wedding Folio
│   │       │   │   └── VendorManpowerPage.jsx # Outsourced Vendors & Roster
│   │       │   └── Billing/
│   │       │       └── BillingPage.jsx      # Core Invoicing Engine (Linked)
│   │       └── components/modals/
│   │           ├── BanquetCateringModal.jsx # Single Event Banquet & Menu Planner
│   │           ├── InRoomDiningModal.jsx    # Room Service & Delivery Tracker
│   │           └── PlateHandoverSlipModal.jsx # Dual-Signature Plate Count Slip
│   └── desktop/                             # 100% Synced Offline SQLite App
```

---

## 🎯 Strategic Conclusion

By housing this capability inside our **Monorepo Accounting Architecture**, we achieve the ultimate balance:
1. **Zero Bloat for Small Retailers:** Regular kirana, garments, and cafe users get a super-fast, clean interface without seeing room grids or wedding itineraries.
2. **Enterprise Power for Luxury Chains:** Luxury resorts and 5-star banquet chains get an enterprise-grade ERP rivaling systems that cost tens of lakhs of rupees.
3. **Rock-Solid Financial Core:** Every room charge, catering plate, vendor advance, and steward tip ties seamlessly into the core **GST, Ledger, Balance Sheet, and P&L Engine**.
