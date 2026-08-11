# Project Change Log

## Date: [Current Date]

### 1. IP Address Utility
- **File Created:** `show-ip.js`
- **Work:** Created a script to easily find the local IP address because `ipconfig` was not working in the user's environment.

### 2. Shared Package Updates
- **File Updated:** `packages/shared/package.json`
  - **Work:** Added `axios` dependency for API calls.
- **File Updated:** `packages/shared/index.js`
  - **Work:** Fixed the export path to point correctly to `./src/services/api`.

### 3. Mobile App Refactoring
- **File Updated:** `apps/mobile/src/services/ApiService.js`
  - **Work:** Removed direct `fetch` calls. Now imports `sharedGetData` and `sharedPostData` from `@repo/shared`. This connects the mobile app to the shared logic layer.

### Next Steps
1. Run `node show-ip.js` to get the IP.
2. Update `apps/mobile/src/services/config.js` with that IP.
3. Run `npm install` in the root folder (to install axios in shared).
4. Restart the mobile app with `npm run mobile -- --clear`.

### 4. Monorepo Migration - Group 1 (Utils) & Group 2 (API)
**Status:** ✅ Completed

#### Shared Package Updates (`packages/shared`)
- **Created:** `src/utils/taxCalculator.js` (Unified GST logic)
- **Created:** `src/utils/currency.js` (Unified Currency formatting)
- **Created:** `src/utils/dateFormatter.js` (Unified Date formatting)
- **Created:** `src/constant/apiRoutes.js` (Centralized API Endpoints)
- **Updated:** `src/index.js` (Exported new utils and constants)

#### App Updates (Integration)
- **Web App (`apps/web`):**
  - Updated `services/api.jsx` to use `API_ROUTES` from shared.
  - (Pending) Delete old utils (`calculateTax.jsx`, `currency.jsx`, etc.) after verification.
- **Mobile App (`apps/mobile`):**
  - Updated `context/AuthContext.js` to use `API_ROUTES`.
  - (Pending) Delete old utils (`calculateTax.js`, `currency.js`, etc.) after verification.
- **Desktop App (`apps/desktop`):**
  - Updated `services/api.jsx` to use `API_ROUTES` from shared.
  - (Pending) Delete old utils (`calculateTax.jsx`, `currency.jsx`, etc.) after verification.

### 5. Monorepo Migration - Group 2 (API Instance Centralization)
**Status:** ✅ Completed

#### Shared Package Updates (`packages/shared`)
- **Updated:** `services/api.js` to include robust request/response interceptors from web/desktop apps. The API instance now handles token, company ID, and error redirects centrally. It also unwraps the `.data` object from successful responses for consistency.

#### App Updates (Integration)
- **Web App (`apps/web`):** Updated `services/api.jsx` to remove its local Axios instance and use the centralized `api` from `@repo/shared`.
- **Desktop App (`apps/desktop`):** Updated `services/api.jsx` to remove its local Axios instance and use the centralized `api` from `@repo/shared`.
- **Mobile App (`apps/mobile`):** Updated `services/ApiService.js` to correctly handle the unwrapped data from the shared `api` instance.

### 6. Monorepo Migration - Phase 3 (Business Logic)
**Status:** ✅ Completed

#### Shared Package Updates (`packages/shared`)
- **Updated:** `src/utils/validators.js` added `validateGST` alias for mobile compatibility.
- **Created:** `src/services/schemeEngine.js` for centralized discount/scheme application logic.
- **Updated:** `src/index.js` to export the new validators and schemeEngine.

#### App Updates (Integration)
- **Mobile App:** Updated `GstValidator.js` and `SchemeEngine.js` to re-export logic from `@repo/shared`.
- **Web & Desktop Apps:** Updated `schemeEngine.jsx` in both apps to re-export `applyScheme` from `@repo/shared`.

### 7. Monorepo Migration - Phase 4 (Security & KeyManager)
**Status:** ✅ Completed

#### Shared Package Updates (`packages/shared`)
- **Created:** `src/services/KeyManager.js` (API Key Management Logic).
- **Created:** `src/services/securityTracker.js` (Security Logging Logic).
- **Updated:** `src/index.js` exported new services.

#### App Updates
- **Web & Desktop:** Replaced local `KeyManager` and `SecurityTracker` logic with shared imports.
- **Mobile:** Updated `SecurityTracker.js` to use shared logic.

### 8. Monorepo Migration - Phase 5 (Sync Logic)
**Status:** ✅ Completed

#### Shared Package Updates (`packages/shared`)
- **Updated:** `src/services/sync.js` to implement `SyncService` using centralized `API_ROUTES`.

#### App Updates
- **Web & Desktop:** Updated `sync.jsx` to re-export `SyncService` from `@repo/shared`.
- **Note:** Mobile app uses a complex `cloudsyncservices.js` which handles SQLite sync, so we kept it separate for now but it can use shared API routes internally.

### 9. Post-Audit Fixes (Critical & Issues)
**Status:** ✅ Completed

#### Shared Package Updates (`packages/shared`)
- **Fixed:** `src/hooks/useAuth.js` now uses the centralized `api` instance instead of a local axios call.
- **Fixed:** `src/services/cloudApi.js` removed hardcoded URLs and switched to centralized `api`.

#### Mobile App Updates (`apps/mobile`)
- **Updated:** `src/services/ApiService.js` comments updated to reflect that data is already unwrapped (kept wrapper for backward compatibility).

### 10. Post-Audit Final Fixes
**Status:** ✅ Completed

#### Shared Package Updates (`packages/shared`)
- **Fixed (Critical):** `src/hooks/useAuth.js` was using a rogue `axios` instance. It now correctly uses the centralized `api` service and `get/setStorage` helpers, making it safe for use.

#### Mobile App Updates (`apps/mobile`)
- **Fixed:** `src/services/ApiService.js` now returns data directly without wrapping it in `{ data: ... }`. This aligns it with the shared API's behavior.
- **Fixed:** `src/context/AuthContext.js` updated to handle the direct data from `ApiService`, resolving the login crash.

### 11. Final Cleanup & Mobile Fixes
**Status:** ✅ Completed

#### Mobile App Updates (`apps/mobile`)
- **Refactored:** `src/services/ApiService.js` to act as a wrapper for `@repo/shared`. It now re-wraps the response in `{ data: ... }` to maintain compatibility with existing mobile screens that expect `response.data`.
- **Updated:** `src/services/index.js` and `src/utils/index.js` to export directly from `@repo/shared`, replacing deleted local files.
- **Deleted:** Unused local services and utils (`KeyManager.js`, `SchemeEngine.js`, `calculateTax.js`, etc.) after verifying they are safe to delete.

#### Web & Desktop App Updates
- **Cleanup:** Deleted unused local services and utils (`KeyManager.jsx`, `calculateTax.jsx`, etc.) from both Web and Desktop apps.
- **Context Fix:** Updated `CompanyContext.jsx` in both Web and Desktop to handle the unwrapped response from the shared API (changed `response.data.companies` to `response.companies`).

### ⚠️ Critical API Change (Action Required)
The new Shared API (`@repo/shared/services/api.js`) automatically unwraps the response.
-   **Old Behavior:** `response.data` contained the payload.
-   **New Behavior:** `response` IS the payload.

**Fix for Web/Desktop Contexts:**
If you see `Cannot read properties of undefined (reading 'companies')`, update your API calls:
```javascript
// ❌ OLD
const res = await api.get('/company');
setCompanies(res.data.companies);

// ✅ NEW
const res = await api.get('/company');
setCompanies(res.companies); // Direct access
```
## 🖥️ Desktop App Setup (Windows Fix)

अगर Desktop App चलाते समय `better-sqlite3` या `NODE_MODULE_VERSION` का एरर आए, तो यह स्टेप्स फॉलो करें।

### 1. Visual Studio Build Tools इंस्टॉल करें (Manual Way)
पुराना `windows-build-tools` कमांड अब काम नहीं करता। आपको इसे मैन्युअली डालना होगा:

1.  Visual Studio Build Tools डाउनलोड करें
2.  इंस्टॉलर चलाएं (`vs_BuildTools.exe`)।
3.  लिस्ट में **"Desktop development with C++"** वाले बॉक्स पर टिक (✅) लगाएं।
4.  Right side में चेक करें कि **"MSVC v143..."** और **"Windows 10/11 SDK"** सिलेक्टेड हैं।
5.  **Install** बटन दबाएं (यह 1-2 GB लेगा)।
6.  इंस्टॉलेशन के बाद कंप्यूटर **Restart** करें।

### 2. Desktop App को Rebuild करें
कंप्यूटर रीस्टार्ट होने के बाद, प्रोजेक्ट फोल्डर में वापस आएं:

```powershell
cd apps/desktop
npx electron-rebuild
npm run start
--- /dev/null
+++ c:\Users\Lenovo1\Desktop\monorapo-accountingapp-1\CHANGE_LOG.md
@@ -0,0 +1,38 @@
+# 📝 Change Log & Version Guide
+
+## 📱 Mobile App (Expo SDK 54 Update) - Fixed
+
+**Status:** ✅ Fixed & Running on Port 8082
+
+Mobile App को **Expo SDK 54** (Latest) पर अपडेट किया गया है ताकि Expo Go App के साथ कम्पैटिबिलिटी बनी रहे।
+
+### 📦 Correct Versions (apps/mobile/package.json)
+अगर कभी `node_modules` डिलीट हो जाए, तो ये वर्जन्स सुनिश्चित करें (Expo 54 Compatible):
+
+- **Expo:** `~54.0.0`
+- **React Native:** `0.81.5`
+- **React:** `19.1.0`
+- **React DOM:** `19.1.0`
+- **React Native Web:** `^0.21.0`
+
+### 🛠️ Setup Instructions (Clean Install)
+अगर मोबाइल ऐप क्रैश हो या "Version Mismatch" एरर आए:
+
+1.  **Clean:**
+    ```powershell
+    cd apps/mobile
+    Remove-Item -Recurse -Force node_modules
+    Remove-Item -Force package-lock.json
+    ```
+2.  **Install (Root):**
+    ```powershell
+    cd ../..
+    npm install
+    ```
+3.  **Fix Dependencies (Auto):**
+    ```powershell
+    cd apps/mobile
+    npx expo install --fix
+    ```
+4.  **Start:**
+    ```powershell
+    npm run start
+    ```
+
+### 🐛 Known Issues & Fixes
+- **Port Conflict:** Mobile App अब **8082** पर चलता है (8081 बिजी होने के कारण)।
+- **API Connection:** Backend **5001** पर है। `config.js` में `LOCALHOST_API` को `http://localhost:5001/api` सेट किया गया है।
# 📝 Change Log & Version Guide

## 📱 Mobile App (Expo SDK 54 Update) - Fixed

**Status:** ✅ Fixed & Running on Port 8082

Mobile App को **Expo SDK 54** (Latest) पर अपडेट किया गया है ताकि Expo Go App के साथ कम्पैटिबिलिटी बनी रहे।

### 📦 Correct Versions (apps/mobile/package.json)
अगर कभी `node_modules` डिलीट हो जाए, तो ये वर्जन्स सुनिश्चित करें (Expo 54 Compatible):
- **Expo:** `~54.0.0`
- **React Native:** `0.75.1` (Official for SDK 54)
- **React:** `18.2.0` (Official for SDK 54)
- **React DOM:** `18.2.0` (Official for SDK 54)
- **React Native Web:** `~0.19.10` (Official for SDK 54)

### 🛠️ Setup Instructions (Clean Install)
अगर मोबाइल ऐप क्रैश हो या "Version Mismatch" एरर आए:

1.  **Clean:**
    ```powershell
    cd apps/mobile
    Remove-Item -Recurse -Force node_modules
    Remove-Item -Force package-lock.json
    ```
2.  **Install (Root):**
    ```powershell
    cd ../..
    npm install
    ```
3.  **Fix Dependencies (Auto):**
    ```powershell
    cd apps/mobile
    npx expo install --fix
    ```
4.  **Start:**
    ```powershell
    npm run start
    ```

### 🐛 Known Issues & Fixes
- **Port Conflict:** Mobile App अब **8082** पर चलता है (8081 बिजी होने के कारण)।
- **API Connection:** Backend **5001** पर है। `config.js` में `LOCALHOST_API` को `http://localhost:5001/api` सेट किया गया है।

---

## 🚧 Backend Pending Tasks (To Be Implemented)

### 1. Balance Sheet Report Logic
**Issue:** Mobile/Web Dashboard पर `/api/report/balancesheet` 404 Error दे रहा था।
**Current Fix:** `apps/backend/src/routes/reportRoutes.js` में एक Temporary Route बनाया गया है जो खाली डेटा भेजता है।

**TODO (Next Steps):**
1.  `apps/backend/src/controllers/reportController.js` में `getBalanceSheet` फंक्शन बनाएं।
2.  Database से Assets और Liabilities का डेटा कैलकुलेट करें।
3.  `reportRoutes.js` में Temporary Route को हटाकर Controller फंक्शन कनेक्ट करें।

**File Location:** `apps/backend/src/routes/reportRoutes.js`
