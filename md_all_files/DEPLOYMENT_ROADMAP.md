# 🚀 Monorepo App: Deployment Roadmap

यह फ़ाइल हमारे प्रोजेक्ट को पूरा करने और उसे प्रोडक्शन (लाइव) में डिप्लॉय करने के लिए एक स्टेप-बाय-स्टेप गाइड है। हम पहले Web और Desktop ऐप्स को मजबूत करेंगे, फिर Mobile ऐप पर ध्यान केंद्रित करेंगे।

---

## 🎯 Phase 1: Code Health & Pre-Flight Checks

इस चरण का लक्ष्य कोड को साफ करना और सभी छिपी हुई समस्याओं को ठीक करना है।

### 1.1. Final Health Scan
- **Action:** अपने प्रोजेक्ट के रूट में `node scripts-all/run-diagnostics.js` कमांड चलाएं।
- **Goal:** `web` और `desktop` ऐप्स के लिए एक अंतिम हेल्थ रिपोर्ट प्राप्त करें।

### 1.2. Fix Critical Issues (from Scan)
- **Unlinked Files:**
  - **Action:** `scan-project-health.js` द्वारा पहचानी गई सभी "Unlinked Files" (जैसे `UnitSettingsPage.jsx`) को उनके संबंधित रूटिंग फ़ाइल (`app.jsx`) में जोड़ें।
  - **Goal:** सुनिश्चित करें कि ऐप का कोई भी हिस्सा "डेड कोड" न हो।
- **Missing API Routes:**
  - **Action:** बैकएंड में `/api/expense` जैसे manquantes (missing) रूट्स को `server.js` में जोड़ें।
  - **Goal:** सुनिश्चित करें कि फ्रंटएंड से की गई कोई भी API कॉल "404 Not Found" एरर न दे।

### 1.3. Code Cleanup
- **Remove `console.log`:**
  - **Action:** प्रोडक्शन में जाने से पहले सभी गैर-ज़रूरी `console.log` स्टेटमेंट्स को हटा दें। इसके लिए एक स्क्रिप्ट बनाई जा सकती है।
  - **Goal:** कंसोल को साफ रखें और परफॉरमेंस को थोड़ा बेहतर करें।
- **Finalize `.env` File:**
  - **Action:** `apps/backend/src/config/` में एक `.env` फ़ाइल बनाएं और उसमें `scan-project-health.js` द्वारा पहचानी गई सभी manquantes (missing) वेरिएबल्स (जैसे `MONGO_URI`, `BREVO_API_KEY`, `SENTRY_DSN`) को जोड़ें।
  - **Goal:** सुनिश्चित करें कि बैकएंड सर्वर सभी सेवाओं (डेटाबेस, ईमेल, आदि) से जुड़ सकता है।

---

## 🎯 Phase 2: Finalizing Web & Desktop Apps

इस चरण में हम फीचर्स को अंतिम रूप देंगे और ऐप को टेस्टिंग के लिए तैयार करेंगे।

### 2.1. Complete Desktop Offline Migration
- **Action:** `scan-project-health.js` की "OFFLINE-FIRST ARCHITECTURE STATUS" रिपोर्ट का पालन करें।
- **Goal:** `localStorage` का उपयोग करने वाली सभी फाइलों को `dbService` (SQLite) और `SyncQueue` का उपयोग करने के लिए माइग्रet करें ताकि डेस्कटॉप ऐप पूरी तरह से ऑफलाइन काम कर सके।

### 2.2. UI/UX Polish
- **Action:** सभी पेजों की समीक्षा करें, लेआउट की समस्याओं को ठीक करें, और सुनिश्चित करें कि डिज़ाइन सभी ऐप्स में सुसंगत (consistent) है।
- **Goal:** एक प्रोफेशनल और उपयोगकर्ता के अनुकूल अनुभव प्रदान करें।

### 2.3. End-to-End Testing
- **Action:** सभी प्रमुख उपयोगकर्ता प्रवाह (user flows) का परीक्षण करें:
  - User Registration & Login
  - Company & Branch Creation
  - Product & Party Creation (Single and Bulk)
  - Bill & Purchase Creation
  - Report Generation & PDF Export
- **Goal:** सुनिश्चित करें कि सभी फीचर्स उम्मीद के मुताबिक काम कर रहे हैं।

---

## 🎯 Phase 3: Building & Deployment

इस चरण में हम अपने ऐप्स के लिए इंस्टॉलर और बिल्ड बनाएंगे और उन्हें लाइव करेंगे।

### 3.1. Backend Deployment (Render)
- **Action:**
  1. सुनिश्चित करें कि Render पर सभी एनवायरनमेंट वेरिएबल्स (`.env` से) सेट हैं।
  2. अपने कोड को GitHub पर पुश करें।
  3. Render पर "Manual Deploy" > "Deploy latest commit" पर क्लिक करें।
- **Goal:** एक स्थिर और लाइव API सर्वर।

### 3.2. Web App Deployment (Vercel/Netlify)
- **Action:**
  1. अपने `apps/web` फोल्डर को Vercel या Netlify पर एक नए प्रोजेक्ट के रूप में जोड़ें।
  2. बिल्ड कमांड को `npm run build:web` पर सेट करें।
  3. `VITE_API_URL` एनवायरनमेंट वेरिएबल को अपने Render बैकएंड URL पर सेट करें।
- **Goal:** एक लाइव, सार्वजनिक रूप से सुलभ वेब ऐप।

### 3.3. Desktop App Packaging (Electron Builder)
- **Action:**
  1. `apps/desktop/package.json` में `build.publish` सेटिंग्स को अपने GitHub रिपॉजिटरी के विवरण के साथ अपडेट करें (ऑटो-अपडेट के लिए)।
  2. `.exe` (Windows) और `.dmg` (Mac) इंस्टॉलर बनाने के लिए `npm run build:desktop` कमांड चलाएं।
- **Goal:** डाउनलोड करने योग्य इंस्टॉलर जिन्हें कोई भी इंस्टॉल कर सकता है।

---

## 🎯 Phase 4: Mobile App Finalization

अब जब Web और Desktop स्थिर हैं, तो हम Mobile पर ध्यान केंद्रित करेंगे।

### 4.1. Final Health Scan (Mobile)
- **Action:** `run-diagnostics.js` में `targetApps` को `['mobile']` में बदलें और स्क्रिप्ट चलाएं।
- **Goal:** मोबाइल ऐप के लिए विशिष्ट समस्याओं (जैसे अनलिंक्ड पेज) की पहचान करें।

### 4.2. Fix & Polish
- **Action:** स्कैन द्वारा पहचानी गई सभी समस्याओं को ठीक करें और UI/UX को सभी स्क्रीनों पर पॉलिश करें।
- **Goal:** एक स्थिर और प्रदर्शन-कुशल (performant) मोबाइल ऐप।

### 4.3. Build `.apk` / `.aab` for Android
- **Action:** Expo Application Services (EAS) का उपयोग करके `.apk` (टेस्टिंग के लिए) या `.aab` (Play Store के लिए) बिल्ड बनाएं।
  - `cd apps/mobile`
  - `eas build --platform android`
- **Goal:** एक वितरण-योग्य (distributable) Android ऐप।

---