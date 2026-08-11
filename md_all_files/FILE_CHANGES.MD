# Project Changes Review

## 1. Web App (`apps/web`)

### Modified
- `apps/web/src/app.jsx`
- `apps/web/src/screens/Billing/BillingPage.jsx`
- `apps/web/src/screens/Settings/SecurityLogPage.jsx`
- `apps/web/src/screens/coupons/GenerateCouponPage.jsx`
- `apps/web/src/screens/membership/LoyaltyDetailPage.jsx`

### Deleted
- `apps/web/src/screens/Billing/ScheemApplyModel.jsx` ( वर्तनी की गलती थी, इसे ठीक किया गया है)
- `apps/web/src/screens/Reports/ScheemReportPage.jsx` ( वर्तनी की गलती थी, इसे ठीक किया गया है)
- `apps/web/src/screens/expenses/AddExpansePage.jsx` ( वर्तनी की गलती थी, इसे ठीक किया गया है)
- `apps/web/src/screens/expenses/ExpansesListPage.jsx` ( वर्तनी की गलती थी, इसे ठीक किया गया है)
- `apps/web/src/screens/expenses/ExpensesPage.jsx` ( वर्तनी की गलती थी, इसे ठीक किया गया है)
- `apps/web/web-src-zip-folder.zip`

### Untracked (New/Renamed)
- `apps/web/src/screens/Billing/SchemeApplyModel.jsx` (सही वर्तनी के साथ नई फ़ाइल)
- `apps/web/src/screens/Reports/SchemeReportPage.jsx` (सही वर्तनी के साथ नई फ़ाइल)
- `apps/web/src/screens/expenses/` (यह एक नया फ़ोल्डर है, संभवतः इसमें सही वर्तनी वाली फाइलें हैं)
- `apps/web/web-src-zip-folder.zip`

---

## 2. Desktop App (`apps/desktop`)

### Modified
- `apps/desktop/main.cjs`
- `apps/desktop/src/app.jsx`
- `apps/desktop/src/components/DashboardLayout.jsx`
- `apps/desktop/src/main/database/db.js`
- `apps/desktop/src/main/database/schema.js`
- `apps/desktop/src/main/ipc/handlers.js`
- `apps/desktop/src/main/services/SyncService.js`
- `apps/desktop/src/navigation/AppNavigator.jsx`
- `apps/desktop/src/navigation/WebRoutes.jsx`
- `apps/desktop/src/screens/Billing/BillingPage.jsx`
- `apps/desktop/src/screens/membership/LoyaltyDetailPage.jsx`

### Deleted
- `apps/desktop/desktop-src-zip-folder.zip`
- `apps/desktop/src/screens/Billing/ScheemApplyModel.jsx`
- `apps/desktop/src/screens/Reports/ScheemReportPage.jsx`
- `apps/desktop/src/screens/expanses/*`

### Untracked (New/Renamed)
- `apps/desktop/desktop-src-zip-folder.zip`
- `apps/desktop/index.js`
- `apps/desktop/src/screens/Billing/SchemeApplyModel.jsx`
- `apps/desktop/src/screens/Reports/SchemeReportPage.jsx`
- `apps/desktop/src/screens/expenses/`

---

## 3. Mobile App (`apps/mobile`)

### Modified
- `apps/mobile/ignoreWarnings.js`
- `apps/mobile/package.json`
- `apps/mobile/src/navigation/*` (All Navigators)
- `apps/mobile/src/screens/billing/*`
- `apps/mobile/src/screens/company/*`
- `apps/mobile/src/screens/coupons/*`
- `apps/mobile/src/screens/dashboard/MainDashboard.js`
- `apps/mobile/src/screens/expenses/ExpensesListScreen.js`
- `apps/mobile/src/screens/inventory/*`
- `apps/mobile/src/screens/laterpad/*`
- `apps/mobile/src/screens/membership/*`
- `apps/mobile/src/screens/notification/ReminderScreen.js`
- `apps/mobile/src/screens/report/*`
- `apps/mobile/src/services/*`

### Deleted
- `apps/mobile/mobile-src-zip-folder.zip`
- `apps/mobile/src/screens/expenses/AddExpenseScreen.js`

### Untracked (New/Renamed)
- `apps/mobile/mobile-src-zip-folder-1.zip`
- `apps/mobile/mobile-src-zip-folder.zip`
- `apps/mobile/src/screens/expenses/AddExpensesScreen.js`

---

## 4. Backend (`apps/backend`)

### Modified
- `apps/backend/seed.js`
- `apps/backend/server.js`
- `apps/backend/src/controllers/*`
- `apps/backend/src/model/membership.js`
- `apps/backend/src/model/product.js`
- `apps/backend/src/routes/*`

### Deleted
- `apps/backend/backendsrczipfolder.zip`
- `apps/backend/src/controllers/bulkDelete.txt`
- `apps/backend/src/controllers/coupanController.js`
- `apps/backend/src/controllers/expanceController.js`
- `apps/backend/src/model/coupan.js`
- `apps/backend/src/model/expance.js`
- `apps/backend/src/routes/coupanRoutes.js`
- `apps/backend/src/routes/expanceRoutes.js`

### Untracked (New/Renamed)
- `apps/backend/backend-src-zip-folder.zip`
- `apps/backend/src/controllers/couponController.js`
- `apps/backend/src/controllers/expensesController.js`
- `apps/backend/src/model/coupon.js`
- `apps/backend/src/model/expenses.js`
- `apps/backend/src/routes/couponRoutes.js`
- `apps/backend/src/routes/expensesRoutes.js`

---

## 5. Shared Package (`packages/shared`)

### Modified
- `packages/shared/package.json`
- `packages/shared/src/constant/apiRoutes.js`

### Deleted
- `packages/shared/src/models/CoupanModel.js`

### Untracked (New/Renamed)
- `packages/shared/src/models/CouponModel.js`

---

## 6. Project Level Files

### Modified
- `full_structure_tree.txt`
- `md_all_files/new_file_projectes_deatiles.md`
- `md_all_files/project_script_deatailes.md`

### Deleted
- `scripts-all copy-zipfolder.zip`
- `scripts-all-zipfolder.zip`
- `scripts-zipfolder.zip`
- `scripts_documentation.md`
- `sharedpackageszipfolder.zip`

### Untracked
- `apps/website/src/components/ErrorBoundary.jsx`
- `audit-report-zip-folder-1.zip`
- `audit-report/`
- `md_all_files/scripts_documentation.md`
- `packages-zip-folder.zip`
