 # Audit Report - Action Plan (v4)

**उद्देश्य:** ऑडिट रिपोर्ट में मिली समस्याओं (API लिंक और अनाथ फ़ाइलें) को व्यवस्थित रूप से ठीक करना।

---

## प्राथमिकता 1: API लिंक को ठीक करना (Pending Rebuild)

**रिपोर्ट:** `api-link-report.csv`

**समस्या:** `apps/desktop/dist_electron/win-unpacked/resources/app/src/main/services/SyncService.js` में `https://api.yoursite.com/customers` अभी भी `false` दिखा रहा है।

**एक्शन:**
1.  **स्रोत फ़ाइल की पुष्टि करें:** सुनिश्चित करें कि `apps/desktop/src/main/services/SyncService.js` फ़ाइल में `https://api.yoursite.com/customers` को `/api/parties` से बदल दिया गया है।
2.  **डेस्कटॉप ऐप को रीबिल्ड करें:** अपने डेस्कटॉप ऐप को रीबिल्ड करें ताकि यह बदलाव `dist_electron` फ़ोल्डर में प्रतिबिंबित हो।
    *   अपने प्रोजेक्ट के रूट में जाएँ।
    *   `npm run build:desktop` या `yarn build:desktop` (आपके `package.json` में परिभाषित स्क्रिप्ट के आधार पर) चलाएँ।
3.  **ऑडिट दोबारा चलाएँ:** रीबिल्ड करने के बाद ऑडिट स्क्रिप्ट को दोबारा चलाएँ। यह API लिंक अब `true` दिखना चाहिए।

---

## प्राथमिकता 2: अनाथ फ़ाइलों को ठीक करना (In Progress)

**रिपोर्ट:** `orphan-files.csv` (30 फ़ाइलें)

**समस्या:** ये फ़ाइलें या तो अप्रयुक्त हैं, डुप्लिकेट हैं, या अभी तक ऐप के नेविगेशन/लॉजिक में एकीकृत नहीं हुई हैं।

**एक्शन:**

### श्रेणी A: False Positives (इन्हें न हटाएँ)

ये फ़ाइलें वास्तव में अनाथ नहीं हैं; वे कॉन्फ़िग फ़ाइलें, एंट्री पॉइंट, या बिल्ड आर्टिफैक्ट्स हैं जिन्हें कोड में सीधे इम्पोर्ट नहीं किया जाता है। **इन्हें न हटाएँ।**

1.  `apps/backend/seed.js` (यूटिलिटी स्क्रिप्ट)
2.  `apps/backend/src/config/firebase.js` (कॉन्फ़िग फ़ाइल, स्ट्रिंग द्वारा संदर्भित हो सकती है)
3.  `apps/backend/src/config/otpservice.js` (कॉन्फ़िग फ़ाइल, स्ट्रिंग द्वारा संदर्भित हो सकती है)
4.  `apps/desktop/dist_electron/win-unpacked/resources/app/main.cjs` (बिल्ड आर्टिफैक्ट - `.gitignore` द्वारा अनदेखा किया जाना चाहिए)
5.  `apps/desktop/dist_electron/win-unpacked/resources/app/preload.js` (बिल्ड आर्टिफैक्ट - `.gitignore` द्वारा अनदेखा किया जाना चाहिए)
6.  `apps/desktop/main.cjs` (इलेक्ट्रॉन ऐप एंट्री पॉइंट)
7.  `apps/desktop/postcss.config.js` (कॉन्फ़िग फ़ाइल)
8.  `apps/desktop/preload.js` (इलेक्ट्रॉन प्रीलोड स्क्रिप्ट)
9.  `apps/desktop/vite.config.js` (कॉन्फ़िग फ़ाइल)
10. `apps/mobile/ignoreWarnings.js` (`apps/mobile/app.js` में सीधे इम्पोर्ट किया गया है)
11. `apps/web/postcss.config.js` (कॉन्फ़िग फ़ाइल)
12. `apps/website/eslint.config.js` (कॉन्फ़िग फ़ाइल)
13. `apps/website/postcss.config.js` (कॉन्फ़िग फ़ाइल)
14. `apps/website/vite.config.js` (कॉन्फ़िग फ़ाइल)

### श्रेणी B: True Orphans - हटाने योग्य (इन्हें `git rm` करें)

ये फ़ाइलें पुरानी, डुप्लिकेट या अप्रयुक्त लगती हैं। इन्हें हटाने से कोडबेस साफ होगा।

**कमांड (प्रत्येक फ़ाइल के लिए):** `git rm [file_path]`

1.  `apps/backend/src/model/bankStatement.js` (बैकएंड मॉडल, कहीं उपयोग नहीं हो रहा)
2.  `apps/backend/src/utils/taxCalculator.js` (बैकएंड यूटिलिटी, साझा पैकेज में एक समान फ़ाइल है)
3.  `apps/mobile/src/services/Api.js` (पुराना मोबाइल API सर्विस, `ApiService.js` और साझा `api.js` का उपयोग किया जा रहा है)
4.  `apps/mobile/src/services/FeatureControlServices.js` (सर्विस मॉड्यूल, यदि कहीं इम्पोर्ट नहीं किया गया है तो हटा दें)
5.  `apps/web/src/utils/PdfParser.jsx` (यूटिलिटी, यदि कहीं उपयोग नहीं किया गया है तो हटा दें)
6.  `packages/shared/src/models/ConsolidatedCreditStatementModel.js` (साझा मॉडल, कहीं उपयोग नहीं हो रहा)
7.  `packages/shared/src/models/CouponModel.js` (साझा मॉडल, कहीं उपयोग नहीं हो रहा)
8.  `packages/shared/src/models/ExpenseModel.js` (साझा मॉडल, कहीं उपयोग नहीं हो रहा)
9.  `packages/shared/src/models/FeatureModel.js` (साझा मॉडल, कहीं उपयोग नहीं हो रहा)
10. `packages/shared/src/models/InvoiceModel.js` (साझा मॉडल, कहीं उपयोग नहीं हो रहा)
11. `packages/shared/src/models/ProductModel.js` (साझा मॉडल, कहीं उपयोग नहीं हो रहा)
12. `packages/shared/src/models/userModel.js` (साझा मॉडल, कहीं उपयोग नहीं हो रहा)
13. `packages/shared/src/utils/taxCalculator.js` (साझा यूटिलिटी, `accounting` मॉड्यूल में प्राथमिक गणना है)

### श्रेणी C: True Orphans - लिंक करने योग्य (इन्हें नेविगेशन में जोड़ें)

ये मोबाइल स्क्रीन हैं जिन्हें अब नेविगेशन में जोड़ दिया गया है।

**एक्शन:** `InventoryNavigator.js` और `PartyNavigator.js` बना दिए गए हैं और `AppNavigator.js` में एकीकृत कर दिए गए हैं। इन फ़ाइलों को अब अनाथ नहीं माना जाना चाहिए।

1.  `apps/mobile/src/screens/inventory/StockAdjustmentScreen.js`
2.  `apps/mobile/src/screens/inventory/StockTransferScreen.js`
3.  `apps/mobile/src/screens/inventory/SupplierLedgerScreen.js`

---

**महत्वपूर्ण नोट:**
*   श्रेणी B की फ़ाइलों को हटाने से पहले, सुनिश्चित करें कि वे वास्तव में कहीं भी उपयोग नहीं हो रही हैं।
*   श्रेणी C की फ़ाइलों को लिंक करने के बाद, `AppNavigator.js` और अन्य संबंधित नेविगेटर फ़ाइलों को अपडेट करना न भूलें।