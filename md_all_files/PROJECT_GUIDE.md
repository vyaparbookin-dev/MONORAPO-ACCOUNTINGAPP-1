# 📘 Monorepo Accounting App - Project Guide

यह फाइल आपके प्रोजेक्ट का नक्शा (Map) और गाइड है। जब भी आप प्रोजेक्ट को दोबारा शुरू करें, यहाँ दिए गए स्टेप्स फॉलो करें।

## 🗺️ प्रोजेक्ट संरचना (Project Structure)
यह एक **Monorepo** है, जिसका मतलब है कि सभी ऐप्स एक ही जगह जुड़े हुए हैं:

1.  **`apps/backend`**: Node.js & Express (API सर्वर)।
2.  **`apps/web`**: React & Vite (वेब डैशबोर्ड)।
3.  **`apps/mobile`**: React Native & Expo (मोबाइल ऐप)।
4.  **`apps/desktop`**: Electron & React (कंप्यूटर सॉफ्टवेयर)।
5.  **`packages/shared`**: कॉमन कोड (API, Constants) जो सभी ऐप्स इस्तेमाल करते हैं।

---

## 🛠️ प्रोजेक्ट को रीस्टार्ट/सेटअप कैसे करें (Clean Install)

अगर आपको कभी भी `node_modules` या वर्जन की दिक्कत आए, तो **Root Terminal** में ये कमांड्स चलाएं:

### 1. सफाई (Clean Old Files)
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
```

### 2. इंस्टॉल (Install Dependencies)
```powershell
npm install
```

### 3. रन (Run Project)
मोबाइल ऐप को कैश क्लियर करके चलाने के लिए:
```powershell
npm run mobile -- --clear
```

बाकी ऐप्स चलाने के लिए:
- **सब एक साथ:** `npm run dev:all`
- **सिर्फ वेब:** `npm run web`
- **सिर्फ बैकएंड:** `npm run backend`

---

## 📱 मोबाइल ऐप जरूरी फाइल्स (Reference Code)

अगर `apps/mobile` में कोई गड़बड़ हो जाए, तो नीचे दिए गए कोड को कॉपी-पेस्ट कर लें।

### 1. `apps/mobile/package.json` (Correct Versions)
यह वर्जन Expo Go (SDK 52/54) के साथ सही चलेगा।

```json
{
  "name": "mobile-inventory-app",
  "version": "1.0.0",
  "main": "app.js",
  "scripts": {
    "start": "npx expo start --offline --port 8082",
    "android": "npx expo run:android",
    "ios": "npx expo run:ios",
    "web": "npx expo start --web --port 8082"
  },
  "dependencies": {
    "@expo/metro-runtime": "~4.0.0",
    "@expo/vector-icons": "^14.0.0",
    "@react-native-async-storage/async-storage": "1.23.1",
    "@react-native-community/datetimepicker": "8.2.0",
    "@react-native-community/netinfo": "11.4.1",
    "@react-native-picker/picker": "2.9.0",
    "@react-navigation/bottom-tabs": "^6.5.20",
    "@react-navigation/native": "^6.1.17",
    "@react-navigation/stack": "^6.3.29",
    "@repo/shared": "*",
    "axios": "^1.6.7",
    "crypto-js": "^4.2.0",
    "expo": "~52.0.0",
    "expo-barcode-scanner": "~13.0.1",
    "expo-constants": "~17.0.0",
    "expo-document-picker": "~13.0.0",
    "expo-file-system": "~18.0.0",
    "expo-font": "~13.0.0",
    "expo-image-picker": "~16.0.0",
    "expo-print": "~14.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-sharing": "~13.0.0",
    "qrcode": "^1.5.3",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-native": "0.76.6",
    "react-native-gesture-handler": "~2.20.2",
    "react-native-get-random-values": "~1.11.0",
    "react-native-qrcode-svg": "^6.3.1",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.4.0",
    "react-native-svg": "15.8.0",
    "react-native-web": "~0.19.13"
  },
  "devDependencies": {
    "@expo/ngrok": "^4.1.3"
  }
}
```

### 2. `apps/mobile/metro.config.js` (Monorepo Config)
यह फाइल मोनोरेपो और Axios एरर को ठीक करती है।

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
```

### 3. `apps/mobile/app.js` (Imports)
सबसे ऊपर ये इम्पोर्ट्स होने चाहिए:

```javascript
import "react-native-get-random-values";
import "./ignoreWarnings";
import "react-native-gesture-handler";
import { registerRootComponent } from "expo";
// ... बाकी कोड
```

---

## 🧠 Shared Logic - Monorepo का दिमाग

एक अच्छे Monorepo में, सभी ऐप्स (Mobile, Web, Desktop) एक ही **Business Logic** का इस्तेमाल करते हैं। यह लॉजिक `packages/shared` में रहता है।

### सिद्धांत (Principle)
1.  **`apps/*` (UI Layer):** ये सिर्फ "चेहरा" हैं। इनका काम यूजर को इंटरफ़ेस दिखाना और यूजर इनपुट लेना है।
2.  **`packages/shared` (Logic Layer):** यह प्रोजेक्ट का "दिमाग" है। API कॉल्स, डेटा की गणना, और सभी कॉमन फंक्शन यहीं रहते हैं।

### उदाहरण: API सर्विस को शेयर करना

1.  **Shared Service (`packages/shared/src/services/api.js`):**
    ```javascript
    import axios from 'axios';

    let API_BASE_URL = '';

    // App के शुरू होते ही इसे कॉल करें
    export const initializeApi = (baseUrl) => {
      API_BASE_URL = baseUrl;
    };

    export const sharedGetData = async (endpoint, token) => {
      // ... Axios GET logic ...
    };
    ```

2.  **Mobile App में इस्तेमाल (`apps/mobile/app.js`):**
    ```javascript
    import { initializeApi } from '@repo/shared';
    import { API_BASE_URL } from './src/services/config';

    // ऐप शुरू होते ही Shared API को URL बताएं
    initializeApi(API_BASE_URL);
    ```
```


monorapo-accountingapp-1/
├── apps/
│   ├── mobile/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── context/
│   │   │   ├── navigation/
│   │   │   ├── screens/
│   │   │   └── services/
│   │   │       ├── ApiService.js   <- (यह फाइल अब सिर्फ shared से इम्पोर्ट करेगी)
│   │   │       ├── config.js       <- (यह यहीं रहेगी, क्योंकि IP एड्रेस ऐप स्पेसिफिक है)
│   │   │       └── KeyManager.js   <- (यह भी यहीं रहेगी, क्योंकि SecureStore/localStorage प्लेटफॉर्म स्पेसिफिक है)
│   │   └── app.js                <- (यहां हम shared API को initialize करेंगे)
│   │
│   ├── web/
│   │   └── src/
│   │       └── services/           <- (यहां भी ApiService.js नहीं होगा, shared से इम्पोर्ट होगा)
│   │
│   └── backend/
│
└── packages/
    └── shared/
        ├── src/
        │   ├── services/
        │   │   └── api.js          <- (सारा API लॉजिक (fetch/axios) अब यहां रहेगा)
        │   └── index.js            <- (यहां से हम api.js को export करेंगे)
        │
        └── package.json            <- (यहां axios जैसी dependencies होंगी)

📊 1. TOTAL FILE IMPACT (REAL COUNT)
तुम्हारे project के हिसाब से (approx realistic count 👇)
🔴 WEB
utils → 6 files
services → 7 files
👉 Total ~13 files
🔴 MOBILE
utils → 8 files
services → 15 files
👉 Total ~23 files
🔴 DESKTOP
utils → 6 files
services → 7 files
👉 Total ~13 files
🟢 SHARED (already base ready)
utils → 5+
services → 7+
✅ TOTAL CHANGE
👉 लगभग:
Id="total-impact"
Copy code
~50 files touch होंगे
🧠 2. IMPORTANT RULE (तुम्हारा main concept सही है)
👉 तुमने जो बोला वो 100% सही है:
✔ web + mobile + desktop तीनों में change होगा
✔ same feature के सारे files एक साथ change होंगे
✔ partial change नहीं करना
👉 यही सही monorepo migration है 💯
🔥 3. MIGRATION STRATEGY (GROUP SYSTEM)
👉 हम 50 files को एक साथ नहीं छुएंगे ❌
👉 हम इसे 5 groups में divide करेंगे ✅
📦 GROUP PLAN
🟢 GROUP 1 — CORE UTILS (सबसे safe)
Files:
calculateTax
currency
formateDate
Impact:
Web → 3
Mobile → 3
Desktop → 3
👉 Total ~9 files
🟢 GROUP 2 — API LAYER
Files:
api.js / ApiService.js
config
cloudApi
Impact:
Web → 2–3
Mobile → 3–4
Desktop → 2–3
👉 Total ~10 files
🟢 GROUP 3 — BUSINESS LOGIC
Files:
schemeEngine
validators
gstValidator
👉 Total ~8–10 files
🟢 GROUP 4 — SECURITY & SYSTEM
Files:
KeyManager
encryption
securityTracker
👉 Total ~8 files
🟢 GROUP 5 — SYNC & OFFLINE
Files:
sync.js
syncqueue
offline hooks
👉 Total ~10 files
📊 FINAL BREAKDOWN
Id="group-summary"
Copy code
Group 1 → 9 files
Group 2 → 10 files
Group 3 → 9 files
Group 4 → 8 files
Group 5 → 10 files

TOTAL ≈ 46–50 files
🚀 4. EXECUTION RULE (VERY IMPORTANT)
हर group के लिए same pattern follow करना:
✅ STEP FLOW
STEP 1
Shared में move
STEP 2
Shared index export
STEP 3
Web import change
STEP 4
Mobile import change
STEP 5
Desktop import change
STEP 6
Run test
👉 फिर next group
⚠️ GOLDEN RULE
❌ ये मत करना:
half files change
mobile छोड़ देना
duplicate छोड़ देना
✔ ये करना:
“एक feature = तीनों apps में full replace”

TASK: Controlled Monorepo Migration (Safe Mode)

OBJECTIVE:
Convert project into monorepo using shared package WITHOUT breaking apps.

STRATEGY:
Migration will be done in GROUPS, not all at once.

---

RULES:

1. Only migrate PURE LOGIC:
   
   - utils (tax, currency, date)
   - services (api, sync, security)
   - constants

2. DO NOT TOUCH:
   
   - UI components
   - Screens
   - Navigation

3. MIGRATION PATTERN (STRICT):

For each group:

STEP 1:
Move files to:
packages/shared/src/

STEP 2:
Export from:
packages/shared/src/index.js

STEP 3:
Replace imports in ALL apps:

Web:
../../utils → @repo/shared

Mobile:
../../utils → @repo/shared

Desktop:
../../utils → @repo/shared

STEP 4:
Delete old duplicate files

STEP 5:
Test apps:

- web
- mobile
- desktop

---

GROUP ORDER:

GROUP 1:

- calculateTax
- currency
- formateDate

GROUP 2:

- api
- config
- cloudApi

GROUP 3:

- schemeEngine
- validators
- gstValidator

GROUP 4:

- KeyManager
- encryption
- securityTracker

GROUP 5:

- sync
- syncqueue
- offline logic

---

IMPORTANT:

- Do NOT migrate partial logic
- Do NOT leave duplicates
- Each group must be fully replaced in all apps

GOAL:

Single shared logic used by:

- web
- mobile
- desktop

---
