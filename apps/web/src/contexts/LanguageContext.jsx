import React, { createContext, useContext, useState, useEffect } from "react";

export const LanguageContext = createContext();

const translations = {
  en: {
    // Top Bar & Global Navigation
    search_placeholder: "Search invoices, products, bookings...",
    calculator: "Calculator",
    refer_earn: "Refer & Earn",
    all_apps: "All Apps",
    ai_advisor: "AI Munim Ji",
    select_company: "Select Business",
    real_businesses: "Real Businesses",
    demo_businesses: "Demo & Sandbox Modules",
    dashboard: "Dashboard",
    fast_pos: "⚡ Fast POS",
    banquet_events: "🏰 Banquet & Events",
    invoices: "Invoices & Billing",
    b2b_bills: "B2B Documents",
    inventory: "Inventory & Stock",
    parties_khata: "Parties & Ledger",
    quotations: "Pax Quotations",
    expenses: "Direct Expenses",
    cash_bank: "Cash & Bank Register",
    staff_attendance: "Staff & Attendance",
    profit_loss: "Profit & Loss",
    daybook: "Day Book Cashflow",

    // Banquet Hub Navigation & Header
    banquet_title: "Royal Banquet & Resort Operations Hub",
    banquet_subtitle: "Multi-Hall Slot Locking, Food Menu Swapping, Plate Audit, Dedicated Grocery P&L, Hotel PMS & SPOC Directory",
    book_new_banquet: "+ Book New Banquet",
    new_lead_inquiry: "+ New Lead Inquiry (CRM)",
    tab_upcoming_bookings: "📋 Upcoming Events & Bookings",
    tab_crm_leads: "📞 CRM & Inquiry Pipeline",
    tab_plate_audit: "🍽️ Plate Count Audit & Sign-Off",
    tab_event_pl: "💰 Event P&L & Dedicated Ledger",
    tab_hotel_rooms: "🏨 Hotel Rooms & Resort PMS",
    tab_spoc_matrix: "👔 Departmental SPOC Directory",

    // KPI Cards
    active_venues: "Active Venues",
    halls_count_label: "Halls / Lawns",
    slot_lock_secured: "✓ 100% Slot Lock Protected",
    upcoming_events: "Upcoming Events",
    events_in_30_days: "In the next 30 days",
    total_estimated_revenue: "Total Estimated Revenue",
    food_rent_addons: "Food + Rent + Add-ons",
    token_advance_collected: "Advance Token Collected",
    deposited_in_account: "Deposited in Bank/Cash",
    total_balance_due: "Total Balance Due",
    payable_on_night: "Due on Function Night",

    // Event & Bill Details
    invoice_title: "Tax Invoice",
    beo_title: "Official Banquet Event Order (BEO Contract)",
    room_slip_title: "Room Key Card & Welcome Slip",
    plate_slip_title: "Physical Plate Verification & Sign-Off Slip",
    bill_to: "Bill To (Host/Customer)",
    event_name: "Event Name",
    event_date: "Event Date",
    time_slot: "Shift / Time Slot",
    venue_hall: "Venue Hall / Lawn",
    guaranteed_pax: "Guaranteed Pax",
    actual_pax: "Actual Counted Pax",
    extra_plates: "Extra Plates",
    rate_per_plate: "Rate per Plate",
    hall_rent: "Hall Rent",
    addons_total: "Add-on Services",
    subtotal: "Subtotal",
    tax_gst: "GST (18% / 5%)",
    grand_total: "Grand Total",
    advance_paid: "Advance Paid",
    balance_due: "Balance Due",
    payment_mode: "Payment Mode",
    authorized_sign: "Authorized Signatory",
    thank_you_message: "Thank you for celebrating with us!",

    // Actions & Buttons
    print: "Print",
    cancel: "Cancel",
    save: "Save & Record",
    delete: "Delete",
    close: "Close",
    leftover_reconciliation: "📦 Leftover Material Reconciliation",
    add_event_expense: "+ Add Event Expense",
    assign_room: "+ Assign Room",
    add_manager: "+ Add Department Head",
    print_spoc_card: "🖨️ Print Host SPOC Card"
  },
  hi: {
    // Top Bar & Global Navigation
    search_placeholder: "बिल, उत्पाद, बुकिंग खोजें...",
    calculator: "कैलकुलेटर",
    refer_earn: "रेफर व कमाएं",
    all_apps: "सभी ऐप्स",
    ai_advisor: "AI मुनीम जी",
    select_company: "व्यापार चुनें",
    real_businesses: "वास्तविक दुकानें व व्यापार",
    demo_businesses: "डेमो व सैंडबॉक्स मॉड्यूल्स",
    dashboard: "डैशबोर्ड",
    fast_pos: "⚡ फ़ास्ट POS",
    banquet_events: "🏰 बैंक्वेट व इवेंट्स",
    invoices: "बिलिंग व इनवॉइस",
    b2b_bills: "B2B दस्तावेज़",
    inventory: "इन्वेंट्री व स्टॉक",
    parties_khata: "पार्टी व खाता",
    quotations: "कोटेशन व प्रपोजल",
    expenses: "प्रत्यक्ष खर्च",
    cash_bank: "रोकड़ व बैंक रजिस्टर",
    staff_attendance: "स्टाफ व हाजिरी",
    profit_loss: "लाभ व हानि (P&L)",
    daybook: "डे-बुक कैशफ्लो",

    // Banquet Hub Navigation & Header
    banquet_title: "रॉयल बैंक्वेट व रिसॉर्ट ऑपरेशंस हब",
    banquet_subtitle: "मल्टी-हॉल स्लॉट लॉकिंग, मेनू स्वैपिंग, प्लेट ऑडिट, अलग ग्रॉसरी P&L, होटल रूम्स PMS और SPOC निर्देशिका",
    book_new_banquet: "+ नया बैंक्वेट बुक करें",
    new_lead_inquiry: "+ नई लीड पूछताछ (CRM)",
    tab_upcoming_bookings: "📋 आगामी कार्यक्रम व बुकिंग्स",
    tab_crm_leads: "📞 लीड्स व इंक्वायरी CRM",
    tab_plate_audit: "🍽️ प्लेट गिनती सत्यापन व साइन-ऑफ",
    tab_event_pl: "💰 इवेंट P&L व अलग खर्च लेजर",
    tab_hotel_rooms: "🏨 होटल रूम्स व रिसॉर्ट PMS",
    tab_spoc_matrix: "👔 डिपार्टमेंटल SPOC व मैनेजर्स",

    // KPI Cards
    active_venues: "सक्रिय वेन्यू हॉल",
    halls_count_label: "हॉल / लॉन",
    slot_lock_secured: "✓ 100% स्लॉट लॉक रक्षित",
    upcoming_events: "आगामी इवेंट्स",
    events_in_30_days: "अगले 30 दिनों में",
    total_estimated_revenue: "कुल अनुमानित रेवेन्यू",
    food_rent_addons: "भोजन + रेंट + ऐडऑन्स",
    token_advance_collected: "टोकन एडवांस प्राप्त",
    deposited_in_account: "खाते में जमा टोकन",
    total_balance_due: "कुल शेष बकाया (Due)",
    payable_on_night: "फंक्शन की रात देय",

    // Event & Bill Details
    invoice_title: "टैक्स इनवॉइस / बिल",
    beo_title: "आधिकारिक बैंक्वेट इवेंट ऑर्डर (BEO Contract)",
    room_slip_title: "कमरा चाबी व वेलकम स्लिप",
    plate_slip_title: "प्लेट गिनती सत्यापन पत्र (Plate Count Verification)",
    bill_to: "बिल सेवा में (आयोजक / ग्राहक)",
    event_name: "कार्यक्रम का नाम",
    event_date: "कार्यक्रम की तारीख",
    time_slot: "शिफ्ट व समय",
    venue_hall: "वेन्यू हॉल / लॉन",
    guaranteed_pax: "न्यूनतम गारंटीकृत प्लेट्स",
    actual_pax: "वास्तविक गिने गए कुल प्लेट्स",
    extra_plates: "अतिरिक्त प्लेट्स",
    rate_per_plate: "दर प्रति प्लेट",
    hall_rent: "हॉल किराया",
    addons_total: "अतिरिक्त सेवाएं (Add-ons)",
    subtotal: "सकल योग (Subtotal)",
    tax_gst: "जीएसटी (GST)",
    grand_total: "कुल देय राशि (Grand Total)",
    advance_paid: "जमा एडवांस (Advance Paid)",
    balance_due: "शेष देय राशि (Balance Due)",
    payment_mode: "भुगतान माध्यम",
    authorized_sign: "अधिकृत हस्ताक्षरकर्ता",
    thank_you_message: "हमारे साथ पधारने के लिए धन्यवाद!",

    // Actions & Buttons
    print: "प्रिंट (Print)",
    cancel: "रद्द करें",
    save: "सुरक्षित करें",
    delete: "हटाएं",
    close: "बंद करें",
    leftover_reconciliation: "📦 बची सामग्री वापसी/क्रेडिट",
    add_event_expense: "+ इवेंट खर्च जोड़ें",
    assign_room: "+ नया कमरा आवंटित करें",
    add_manager: "+ नया विभागीय प्रमुख जोड़ें",
    print_spoc_card: "🖨️ 1-क्लिक आयोजक SPOC कार्ड"
  }
};

export const LanguageProvider = ({ children }) => {
  // 1. Operator App Language: default to 'hi' or stored preference
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem("app_language") || "hi";
    } catch {
      return "hi";
    }
  });

  // 2. Customer Invoice Print Language: default to 'en' (English Corporate Standard like Petpooja & Vyapar)
  const [invoicePrintLanguage, setInvoicePrintLanguageState] = useState(() => {
    try {
      return localStorage.getItem("invoice_print_language") || "en";
    } catch {
      return "en";
    }
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("app_language", lang);
    } catch (e) {
      console.warn("Could not save language preference", e);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "hi" ? "en" : "hi");
  };

  const setInvoicePrintLanguage = (lang) => {
    setInvoicePrintLanguageState(lang);
    try {
      localStorage.setItem("invoice_print_language", lang);
    } catch (e) {
      console.warn("Could not save invoice print language", e);
    }
  };

  const toggleInvoicePrintLanguage = () => {
    setInvoicePrintLanguage(invoicePrintLanguage === "en" ? "hi" : "en");
  };

  // Safe translation helper: never throws, always returns fallback if key is missing
  const t = (key, fallback = "") => {
    const langDict = translations[language] || translations.hi;
    return langDict[key] || fallback || key;
  };

  // Invoice-specific translation helper based on invoicePrintLanguage
  const tInvoice = (key, fallback = "") => {
    const langDict = translations[invoicePrintLanguage] || translations.en;
    return langDict[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        invoicePrintLanguage,
        setInvoicePrintLanguage,
        toggleInvoicePrintLanguage,
        t,
        tInvoice,
        isEnglish: language === "en",
        isHindi: language === "hi"
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext) || {
  language: "hi",
  invoicePrintLanguage: "en",
  setLanguage: () => {},
  toggleLanguage: () => {},
  setInvoicePrintLanguage: () => {},
  toggleInvoicePrintLanguage: () => {},
  t: (k, f) => f || k,
  tInvoice: (k, f) => f || k,
  isEnglish: false,
  isHindi: true
};
