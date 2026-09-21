# Business Module Refactor System

## 1. Main rule for this project

Abhi we are not going to split by random folder names.

Hum is project ko is tarah structure karenge:

1. shared/common accounting core ko stable rakhenge
2. business-specific unique logic ko module me alag karenge
3. hardware/electrical ko last me move karenge
4. jo common accounting files already ban chuke hain, unko disturb nahi karenge
5. sabse pahle un business modules ko link karenge jo already independent hain
6. baad me hardware/electrical ko integrate karenge

This is important because hardware/electrical is a vertical where common business logic is already being reused heavily. So its final module should be attached only after the base accounting layer is stable.

---

## 2. Core idea

Aapka project should become:

- shared core foundation
- shared accounting engine
- independent business modules
- final glue layer to connect all modules

Not:

- one mixed app in which all business logic sits together

---

## 3. What is common and what is unique

### Common / shared logic

Ye cheezein sab business me common rahegi:

- company
- user & roles
- branch
- party/customer/supplier
- chart of accounts
- ledger
- journal
- invoice engine
- tax engine
- payment engine
- bank/cash entries
- stock ledger
- inventory movement
- reports
- dashboard widgets
- notification system
- settings

Yeh sab shared modules me rahenge.

### Unique business logic

Ye business-specific logic har business ke liye alag rahega:

- hardware/electrical: product specification, warranty, project sales, technical catalog, dealer pricing
- medical: medicine, batch, expiry, prescription, compliance
- cloth: size, design, season, fabric, style
- mobile: IMEI, warranty, accessories, repair, activation
- restaurant: menu, table, kitchen, inventory consumption
- supermarket: POS, barcode, retail billing, discounting
- gamezone: ticketing, credit balance, game usage
- banquet: booking, guest count, hall schedule
- salon: appointments, stylist, services, package

Yeh modules alag rakhenge.

---

## 4. Recommended folder structure

```txt
apps/
  backend/
    src/
      core/
        auth/
        company/
        branch/
        users/
        settings/
        permissions/

      shared/
        accounting/
          ledger/
          invoice/
          payment/
          tax/
          accounts/
          reports/
        infra/
          config/
          middleware/
          utils/
          validators/

      modules/
        retail/
          cloth/
          supermarket/
          salon/
          mobile/

        service/
          medical/
          banquet/
          restaurant/
          gamezone/

        industrial/
          hardware-electrical/

      app/
        routes/
        bootstrap/
        app.js
```

This structure gives you:
- shared common logic in one place
- business modules separate
- hardware/electrical as an industrial vertical
- easier linking later

---

## 5. Concrete file-to-module mapping

Below is the actual assignment for the files already present in this project. This is the part that matters most when you start moving code.

### 5.1 Core foundation (do first)

These are not domain businesses; they are platform and shared base files.

- Auth and users:
  - [apps/backend/src/routes/authRoutes.js](../apps/backend/src/routes/authRoutes.js)
  - [apps/backend/src/routes/userRoutes.js](../apps/backend/src/routes/userRoutes.js)
  - [apps/backend/src/controllers/authController.js](../apps/backend/src/controllers/authController.js)
  - [apps/backend/src/controllers/userController.js](../apps/backend/src/controllers/userController.js)
  - [apps/backend/src/model/user.js](../apps/backend/src/model/user.js)

- Company and settings:
  - [apps/backend/src/routes/companyRoutes.js](../apps/backend/src/routes/companyRoutes.js)
  - [apps/backend/src/routes/settingsRoutes.js](../apps/backend/src/routes/settingsRoutes.js)
  - [apps/backend/src/routes/notificationRoutes.js](../apps/backend/src/routes/notificationRoutes.js)
  - [apps/backend/src/controllers/companyController.js](../apps/backend/src/controllers/companyController.js)
  - [apps/backend/src/controllers/settingsController.js](../apps/backend/src/controllers/settingsController.js)
  - [apps/backend/src/controllers/notificationController.js](../apps/backend/src/controllers/notificationController.js)
  - [apps/backend/src/model/company.js](../apps/backend/src/model/company.js)
  - [apps/backend/src/model/notification.js](../apps/backend/src/model/notification.js)

- Shared infra and accounting basis:
  - [apps/backend/src/config](../apps/backend/src/config)
  - [apps/backend/src/middleware](../apps/backend/src/middleware)
  - [apps/backend/src/utils](../apps/backend/src/utils)
  - [apps/backend/src/services](../apps/backend/src/services)

### 5.2 Sales and CRM module

- Routes:
  - [apps/backend/src/routes/leadRoutes.js](../apps/backend/src/routes/leadRoutes.js)
  - [apps/backend/src/routes/partyRoutes.js](../apps/backend/src/routes/partyRoutes.js)
  - [apps/backend/src/routes/quotationRoutes.js](../apps/backend/src/routes/quotationRoutes.js)
  - [apps/backend/src/routes/billingRoutes.js](../apps/backend/src/routes/billingRoutes.js)
  - [apps/backend/src/routes/b2bRoutes.js](../apps/backend/src/routes/b2bRoutes.js)
  - [apps/backend/src/routes/reminderRoutes.js](../apps/backend/src/routes/reminderRoutes.js)

- Controllers:
  - [apps/backend/src/controllers/leadController.js](../apps/backend/src/controllers/leadController.js)
  - [apps/backend/src/controllers/partyController.js](../apps/backend/src/controllers/partyController.js)
  - [apps/backend/src/controllers/quotationController.js](../apps/backend/src/controllers/quotationController.js)
  - [apps/backend/src/controllers/billingController.js](../apps/backend/src/controllers/billingController.js)
  - [apps/backend/src/controllers/b2bController.js](../apps/backend/src/controllers/b2bController.js)
  - [apps/backend/src/controllers/reminderController.js](../apps/backend/src/controllers/reminderController.js)

- Models:
  - [apps/backend/src/model/lead.js](../apps/backend/src/model/lead.js)
  - [apps/backend/src/model/party.js](../apps/backend/src/model/party.js)
  - [apps/backend/src/model/quotation.js](../apps/backend/src/model/quotation.js)
  - [apps/backend/src/model/bill.js](../apps/backend/src/model/bill.js)

This module is independent and can be moved early.

### 5.3 Inventory and warehouse module

- Routes:
  - [apps/backend/src/routes/categoryRoutes.js](../apps/backend/src/routes/categoryRoutes.js)
  - [apps/backend/src/routes/subCategoryRoutes.js](../apps/backend/src/routes/subCategoryRoutes.js)
  - [apps/backend/src/routes/unitRoutes.js](../apps/backend/src/routes/unitRoutes.js)
  - [apps/backend/src/routes/brandRoutes.js](../apps/backend/src/routes/brandRoutes.js)
  - [apps/backend/src/routes/inventoryRoutes.js](../apps/backend/src/routes/inventoryRoutes.js)
  - [apps/backend/src/routes/warehouseRoutes.js](../apps/backend/src/routes/warehouseRoutes.js)
  - [apps/backend/src/routes/stockTransferRoutes.js](../apps/backend/src/routes/stockTransferRoutes.js)

- Controllers:
  - [apps/backend/src/controllers/categoryController.js](../apps/backend/src/controllers/categoryController.js)
  - [apps/backend/src/controllers/subCategoryController.js](../apps/backend/src/controllers/subCategoryController.js)
  - [apps/backend/src/controllers/unitController.js](../apps/backend/src/controllers/unitController.js)
  - [apps/backend/src/controllers/brandController.js](../apps/backend/src/controllers/brandController.js)
  - [apps/backend/src/controllers/inventoryController.js](../apps/backend/src/controllers/inventoryController.js)
  - [apps/backend/src/controllers/warehouseController.js](../apps/backend/src/controllers/warehouseController.js)
  - [apps/backend/src/controllers/stockTransferController.js](../apps/backend/src/controllers/stockTransferController.js)

- Models:
  - [apps/backend/src/model/category.js](../apps/backend/src/model/category.js)
  - [apps/backend/src/model/subCategory.js](../apps/backend/src/model/subCategory.js)
  - [apps/backend/src/model/unit.js](../apps/backend/src/model/unit.js)
  - [apps/backend/src/model/brand.js](../apps/backend/src/model/brand.js)
  - [apps/backend/src/model/stockTransfer.js](../apps/backend/src/model/stockTransfer.js)

This module is also a good early split because it already behaves as a real domain boundary.

### 5.4 Procurement and expenses module

- Routes:
  - [apps/backend/src/routes/purchaseRoutes.js](../apps/backend/src/routes/purchaseRoutes.js)
  - [apps/backend/src/routes/purchaseOrderRoutes.js](../apps/backend/src/routes/purchaseOrderRoutes.js)
  - [apps/backend/src/routes/expensesRoutes.js](../apps/backend/src/routes/expensesRoutes.js)
  - [apps/backend/src/routes/paymentRoutes.js](../apps/backend/src/routes/paymentRoutes.js)

- Controllers:
  - [apps/backend/src/controllers/purchaseController.js](../apps/backend/src/controllers/purchaseController.js)
  - [apps/backend/src/controllers/purchaseOrderController.js](../apps/backend/src/controllers/purchaseOrderController.js)
  - [apps/backend/src/controllers/expensesController.js](../apps/backend/src/controllers/expensesController.js)
  - [apps/backend/src/controllers/paymentController.js](../apps/backend/src/controllers/paymentController.js)

- Models:
  - [apps/backend/src/model/purchase.js](../apps/backend/src/model/purchase.js)
  - [apps/backend/src/model/PurchaseOrder.js](../apps/backend/src/model/PurchaseOrder.js)
  - [apps/backend/src/model/expenses.js](../apps/backend/src/model/expenses.js)

This module should be linked to shared accounting services for ledger and payment posting.

### 5.5 Finance and tax module

- Routes:
  - [apps/backend/src/routes/gstRoutes.js](../apps/backend/src/routes/gstRoutes.js)
  - [apps/backend/src/routes/tdsTcsRoutes.js](../apps/backend/src/routes/tdsTcsRoutes.js)
  - [apps/backend/src/routes/daybookRoutes.js](../apps/backend/src/routes/daybookRoutes.js)
  - [apps/backend/src/routes/bankRecRoutes.js](../apps/backend/src/routes/bankRecRoutes.js)
  - [apps/backend/src/routes/capitalRoutes.js](../apps/backend/src/routes/capitalRoutes.js)
  - [apps/backend/src/routes/savingsRoutes.js](../apps/backend/src/routes/savingsRoutes.js)

- Controllers:
  - [apps/backend/src/controllers/gstController.js](../apps/backend/src/controllers/gstController.js)
  - [apps/backend/src/controllers/tdsTcsController.js](../apps/backend/src/controllers/tdsTcsController.js)
  - [apps/backend/src/controllers/daybookController.js](../apps/backend/src/controllers/daybookController.js)
  - [apps/backend/src/controllers/bankRecController.js](../apps/backend/src/controllers/bankRecController.js)
  - [apps/backend/src/controllers/capitalController.js](../apps/backend/src/controllers/capitalController.js)
  - [apps/backend/src/controllers/savingsController.js](../apps/backend/src/controllers/savingsController.js)

This is a shared accounting-heavy module and should remain very close to the accounting core, not mixed with hardware logic.

### 5.6 HR and payroll module

- Routes:
  - [apps/backend/src/routes/staffRoutes.js](../apps/backend/src/routes/staffRoutes.js)
  - [apps/backend/src/routes/attendanceRoutes.js](../apps/backend/src/routes/attendanceRoutes.js)
  - [apps/backend/src/routes/salaryRoutes.js](../apps/backend/src/routes/salaryRoutes.js)
  - [apps/backend/src/routes/approvalRoutes.js](../apps/backend/src/routes/approvalRoutes.js)
  - [apps/backend/src/routes/securityRoutes.js](../apps/backend/src/routes/securityRoutes.js)

- Controllers:
  - [apps/backend/src/controllers/staffController.js](../apps/backend/src/controllers/staffController.js)
  - [apps/backend/src/controllers/attendanceController.js](../apps/backend/src/controllers/attendanceController.js)
  - [apps/backend/src/controllers/salaryController.js](../apps/backend/src/controllers/salaryController.js)
  - [apps/backend/src/controllers/approvalController.js](../apps/backend/src/controllers/approvalController.js)
  - [apps/backend/src/controllers/securityController.js](../apps/backend/src/controllers/securityController.js)

- Models:
  - [apps/backend/src/model/staff.js](../apps/backend/src/model/staff.js)
  - [apps/backend/src/model/attendance.js](../apps/backend/src/model/attendance.js)
  - [apps/backend/src/model/salary.js](../apps/backend/src/model/salary.js)
  - [apps/backend/src/model/securitylog.js](../apps/backend/src/model/securitylog.js)

### 5.7 Membership and customer programs module

- Routes:
  - [apps/backend/src/routes/membershipRoutes.js](../apps/backend/src/routes/membershipRoutes.js)
  - [apps/backend/src/routes/couponRoutes.js](../apps/backend/src/routes/couponRoutes.js)
  - [apps/backend/src/routes/stampRoutes.js](../apps/backend/src/routes/stampRoutes.js)
  - [apps/backend/src/routes/laterpadRoutes.js](../apps/backend/src/routes/laterpadRoutes.js)

- Controllers:
  - [apps/backend/src/controllers/membershipController.js](../apps/backend/src/controllers/membershipController.js)
  - [apps/backend/src/controllers/couponController.js](../apps/backend/src/controllers/couponController.js)
  - [apps/backend/src/controllers/stampController.js](../apps/backend/src/controllers/stampController.js)
  - [apps/backend/src/controllers/laterpadController.js](../apps/backend/src/controllers/laterpadController.js)

- Models:
  - [apps/backend/src/model/membership.js](../apps/backend/src/model/membership.js)
  - [apps/backend/src/model/coupon.js](../apps/backend/src/model/coupon.js)
  - [apps/backend/src/model/stampProgram.js](../apps/backend/src/model/stampProgram.js)
  - [apps/backend/src/model/laterpad.js](../apps/backend/src/model/laterpad.js)

### 5.8 Hospitality and vertical operations module

- Routes:
  - [apps/backend/src/routes/banquetRoutes.js](../apps/backend/src/routes/banquetRoutes.js)

- Controllers:
  - [apps/backend/src/controllers/banquetController.js](../apps/backend/src/controllers/banquetController.js)

- Models:
  - [apps/backend/src/model/banquetBooking.js](../apps/backend/src/model/banquetBooking.js)
  - [apps/backend/src/model/banquetHall.js](../apps/backend/src/model/banquetHall.js)
  - [apps/backend/src/model/banquetInquiry.js](../apps/backend/src/model/banquetInquiry.js)

### 5.9 Reporting and analytics module

- Routes:
  - [apps/backend/src/routes/reportRoutes.js](../apps/backend/src/routes/reportRoutes.js)
  - [apps/backend/src/routes/consolidatedStatementRoutes.js](../apps/backend/src/routes/consolidatedStatementRoutes.js)
  - [apps/backend/src/routes/agingRoutes.js](../apps/backend/src/routes/agingRoutes.js)

- Controllers:
  - [apps/backend/src/controllers/reportController.js](../apps/backend/src/controllers/reportController.js)
  - [apps/backend/src/controllers/consolidatedStatementController.js](../apps/backend/src/controllers/consolidatedStatementController.js)
  - [apps/backend/src/controllers/agingController.js](../apps/backend/src/controllers/agingController.js)
  - [apps/backend/src/controllers/productAnalyticsController.js](../apps/backend/src/controllers/productAnalyticsController.js)

### 5.10 Integrations and automation module

- Routes:
  - [apps/backend/src/routes/syncRoutes.js](../apps/backend/src/routes/syncRoutes.js)
  - [apps/backend/src/routes/cloudRoutes.js](../apps/backend/src/routes/cloudRoutes.js)
  - [apps/backend/src/routes/whatsappRoutes.js](../apps/backend/src/routes/whatsappRoutes.js)
  - [apps/backend/src/routes/aiAdvisorRoutes.js](../apps/backend/src/routes/aiAdvisorRoutes.js)
  - [apps/backend/src/routes/aiGatewayRoutes.js](../apps/backend/src/routes/aiGatewayRoutes.js)
  - [apps/backend/src/routes/tallyRoutes.js](../apps/backend/src/routes/tallyRoutes.js)

- Controllers:
  - [apps/backend/src/controllers/whatsappController.js](../apps/backend/src/controllers/whatsappController.js)
  - [apps/backend/src/controllers/aiAdvisorController.js](../apps/backend/src/controllers/aiAdvisorController.js)
  - [apps/backend/src/controllers/aiGatewayController.js](../apps/backend/src/controllers/aiGatewayController.js)
  - [apps/backend/src/controllers/tallyController.js](../apps/backend/src/controllers/tallyController.js)

### 5.11 Hardware and electrical module (final phase)

This is the business module you want to keep for the end.

Do not split it first. Keep it as the final integration layer because it depends heavily on already built common accounting logic.

This module will ultimately contain the domain-specific files built from these existing shared flow areas:

- [apps/backend/src/routes/inventoryRoutes.js](../apps/backend/src/routes/inventoryRoutes.js)
- [apps/backend/src/routes/categoryRoutes.js](../apps/backend/src/routes/categoryRoutes.js)
- [apps/backend/src/routes/brandRoutes.js](../apps/backend/src/routes/brandRoutes.js)
- [apps/backend/src/routes/unitRoutes.js](../apps/backend/src/routes/unitRoutes.js)
- [apps/backend/src/routes/warehouseRoutes.js](../apps/backend/src/routes/warehouseRoutes.js)
- [apps/backend/src/routes/purchaseRoutes.js](../apps/backend/src/routes/purchaseRoutes.js)
- [apps/backend/src/routes/purchaseOrderRoutes.js](../apps/backend/src/routes/purchaseOrderRoutes.js)
- [apps/backend/src/routes/quotationRoutes.js](../apps/backend/src/routes/quotationRoutes.js)
- [apps/backend/src/routes/billingRoutes.js](../apps/backend/src/routes/billingRoutes.js)
- [apps/backend/src/routes/partyRoutes.js](../apps/backend/src/routes/partyRoutes.js)

And matching controller/model files under:

- [apps/backend/src/controllers/inventoryController.js](../apps/backend/src/controllers/inventoryController.js)
- [apps/backend/src/controllers/categoryController.js](../apps/backend/src/controllers/categoryController.js)
- [apps/backend/src/controllers/brandController.js](../apps/backend/src/controllers/brandController.js)
- [apps/backend/src/controllers/unitController.js](../apps/backend/src/controllers/unitController.js)
- [apps/backend/src/controllers/warehouseController.js](../apps/backend/src/controllers/warehouseController.js)
- [apps/backend/src/controllers/purchaseController.js](../apps/backend/src/controllers/purchaseController.js)
- [apps/backend/src/controllers/purchaseOrderController.js](../apps/backend/src/controllers/purchaseOrderController.js)
- [apps/backend/src/controllers/quotationController.js](../apps/backend/src/controllers/quotationController.js)
- [apps/backend/src/controllers/billingController.js](../apps/backend/src/controllers/billingController.js)
- [apps/backend/src/controllers/partyController.js](../apps/backend/src/controllers/partyController.js)

This is the final business layer for hardware/electrical after the common accounting engine is already stable.

---

## 6. Exact migration principle for your case

### We will not do this:

- hardware/electrical ko sabse pehle module bana kar app me mix nahi karenge
- common accounting logic ko break nahi karenge
- sab business logic ko one by one app root me push nahi karenge

### We will do this:

1. Common accounting logic ko lock karenge
2. Existing common files ko leave karenge
3. Unique business modules ko separate karenge
4. Shared accounts + ledger + invoice layer ko business modules se attach karenge
5. Hardware/electrical ko last me integrate karenge

This ensures no major breakage in current system.

---

## 6. Business module order

### Phase 1: Move already independent business logic first

Ye modules aise hain jo generally common accounting se already independent ya easy to split hain:

- medical
- cloth
- salon
- restaurant
- supermarket
- banquet
- gamezone
- mobile

Reason:
- unka business flow comparatively separate hai
- common accounting engine already available hai
- inko module-level route/controller/service se join karna easier hai

### Phase 2: Keep hardware/electrical at the end

Hardware/electrical ko last me karna because:

- yeh business already common logic ka maximum consumer hai
- isme existing shared engine ka role strong hai
- yeh module already mature hai inside current app
- if we move it early, then all shared core references might break or get mixed

So sequence should be:

1. core platform
2. shared accounting core
3. medical
4. cloth
5. salon
6. restaurant
7. supermarket
8. banquet
9. gamezone
10. mobile
11. hardware-electrical

This order keeps project stable.

---

## 7. How to map existing files

### Step A: identify common files

These files remain shared and should not move into business modules:

- auth middleware
- company/user modules
- invoice engine
- ledger engine
- tax engine
- payment service
- reports module
- settings
- notification
- shared utility helpers

### Step B: identify business unique files

For each business domain, create a folder like:

```txt
apps/backend/src/modules/
  medical/
    routes/
    controllers/
    services/
    models/
    validators/
```

```txt
apps/backend/src/modules/
  cloth/
    routes/
    controllers/
    services/
    models/
    validators/
```

```txt
apps/backend/src/modules/
  hardware-electrical/
    routes/
    controllers/
    services/
    models/
    validators/
```

### Step C: keep shared accounting calls inside each module

Har module ke controller me logic should be:

- validate data
- call business service
- call shared accounting service
- save module-specific data
- create ledger/invoice/payment entries through shared layer

Example pattern:

```js
// module: hardware-electrical/service.js
export const createSale = async (payload, user) => {
  const sale = await saveSale(payload);
  await createInvoiceEntry({ sale, party: payload.party, type: 'sale' });
  await updateInventoryLedger({ productId, qty, movement: 'out' });
  return sale;
};
```

This keeps module unique but accounting is still shared.

---

## 8. Link strategy

### Link pattern

After modules are separated, we connect them in app entry using routes only.

```js
app.use('/api/core', coreRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/cloth', clothRoutes);
app.use('/api/salon', salonRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/supermarket', supermarketRoutes);
app.use('/api/banquet', banquetRoutes);
app.use('/api/gamezone', gamezoneRoutes);
app.use('/api/mobile', mobileRoutes);
app.use('/api/hardware', hardwareElectricalRoutes);
```

This way:
- app root is clean
- no mixed logic
- each module routes independently
- shared accounting layer still reused

---

## 9. How to decide file ownership

A file belongs to a module only if:

- it is about product flow for that business
- it contains business rules specific to that domain
- it does not normally belong to general ledger/invoice/accounting

A file belongs to shared core if:

- it is used by most modules
- it handles generic financial processing
- it is the base system logic

So in your case:

- hardware/electrical product catalog, warranty, purchase/sale flow => hardware-electrical module
- invoice, stock ledger, sales posting, tax, payment => shared accounting layer

---

## 10. Why hardware/electrical should be last

Because your current system already has strong common accounting logic in place.

If you split hardware/electrical too early:

- you may accidentally duplicate accounting logic
- shared invoice/ledger logic may become inconsistent
- you may create cross dependency mess
- future module integration becomes difficult

So better approach:

- first modularize the business modules that are easier to isolate
- keep accounting core stable
- then attach hardware/electrical to the shared basis

---

## 11. Practical refactor flow

### Step 1: Create folder structure

Create these top-level folders:

```txt
apps/backend/src/shared
apps/backend/src/core
apps/backend/src/modules
apps/backend/src/app
```

### Step 2: Move common files to shared/core

- auth
- company
- settings
- ledger
- invoice
- reports
- tax
- payment

### Step 3: Move business modules one by one

- medical
- cloth
- salon
- restaurant
- supermarket
- banquet
- gamezone
- mobile

### Step 4: Link each module to accounting core

Each module service calls:

- createInvoice()
- postLedger()
- updateStock()
- createPaymentEntry()
- generateReport()

### Step 5: Move hardware/electrical last

Once all other modules are working independently:

- shift hardware/electrical files into its own folder
- connect to same shared accounting engine
- keep product-specific rules inside hardware module

---

## 12. Final architecture principle for your project

This is the right principle:

- Module = unique business behavior
- Shared core = common accounting behavior
- App layer = route registration only

So:

- cloth module = cloth-specific business logic
- medical module = medical-specific business logic
- restaurant module = restaurant-specific business logic
- hardware-electrical module = hardware-electrical-specific business logic

but all of them still depend on the shared accounting engine for:

- sale entry
- purchase entry
- inventory ledger
- tax
- invoice
- payment
- reports

This is the cleanest and safest architecture for your current project.

---

## 13. Final recommendation

For your exact need, do this:

- First modularize obvious independent businesses
- Keep shared accounting engine untouched and stable
- Link each independent module to the common engine
- Do hardware/electrical last
- Do not mix domain logic into shared core

This will prevent mess and keep the app maintainable.

---

## 14. Next concrete action

Ab aapko jo karna hai:

1. shared/core folder create karo
2. modules folder create karo
3. medical, cloth, salon, restaurant, supermarket, banquet, gamezone, mobile ko module me move karo
4. shared accounting service ko connect karo
5. hardware/electrical module ko last me move karo
6. app entry me route linking finalize karo

Ye system aapko confusion se bachayega aur project ko actual modular business architecture me badal dega.

Frontend mapping:
- product list page
- inventory dashboard
- warehouse management page
- stock transfer page
- category/unit/brand forms

---

### Module 4: Procurement & Expenses

Purpose:
- purchase orders
- purchases
- vendor/expense management
- payment settlement

Files to move:

- backend:
  - [apps/backend/src/routes/purchaseRoutes.js](../apps/backend/src/routes/purchaseRoutes.js)
  - [apps/backend/src/routes/purchaseOrderRoutes.js](../apps/backend/src/routes/purchaseOrderRoutes.js)
  - [apps/backend/src/routes/expensesRoutes.js](../apps/backend/src/routes/expensesRoutes.js)
  - [apps/backend/src/routes/paymentRoutes.js](../apps/backend/src/routes/paymentRoutes.js)

- controllers:
  - [apps/backend/src/controllers/purchaseController.js](../apps/backend/src/controllers/purchaseController.js)
  - [apps/backend/src/controllers/purchaseOrderController.js](../apps/backend/src/controllers/purchaseOrderController.js)
  - [apps/backend/src/controllers/expensesController.js](../apps/backend/src/controllers/expensesController.js)
  - [apps/backend/src/controllers/paymentController.js](../apps/backend/src/controllers/paymentController.js)

- models:
  - [apps/backend/src/model/purchase.js](../apps/backend/src/model/purchase.js)
  - [apps/backend/src/model/PurchaseOrder.js](../apps/backend/src/model/PurchaseOrder.js)
  - [apps/backend/src/model/expenses.js](../apps/backend/src/model/expenses.js)

Frontend mapping:
- purchase register
- vendor payments
- purchase order approvals
- expense entries

---

### Module 5: Finance & Tax

Purpose:
- GST
- TDS/TCS
- daybook
- bank reconciliation
- capital
- savings
- taxation reports

Files to move:

- backend:
  - [apps/backend/src/routes/gstRoutes.js](../apps/backend/src/routes/gstRoutes.js)
  - [apps/backend/src/routes/tdsTcsRoutes.js](../apps/backend/src/routes/tdsTcsRoutes.js)
  - [apps/backend/src/routes/daybookRoutes.js](../apps/backend/src/routes/daybookRoutes.js)
  - [apps/backend/src/routes/bankRecRoutes.js](../apps/backend/src/routes/bankRecRoutes.js)
  - [apps/backend/src/routes/capitalRoutes.js](../apps/backend/src/routes/capitalRoutes.js)
  - [apps/backend/src/routes/savingsRoutes.js](../apps/backend/src/routes/savingsRoutes.js)

- controllers:
  - [apps/backend/src/controllers/gstController.js](../apps/backend/src/controllers/gstController.js)
  - [apps/backend/src/controllers/tdsTcsController.js](../apps/backend/src/controllers/tdsTcsController.js)
  - [apps/backend/src/controllers/daybookController.js](../apps/backend/src/controllers/daybookController.js)
  - [apps/backend/src/controllers/bankRecController.js](../apps/backend/src/controllers/bankRecController.js)
  - [apps/backend/src/controllers/capitalController.js](../apps/backend/src/controllers/capitalController.js)
  - [apps/backend/src/controllers/savingsController.js](../apps/backend/src/controllers/savingsController.js)

Frontend mapping:
- ledger page
- GST compliance page
- TDS page
- bank reconciliation page
- capital flow page

---

### Module 6: HR & Payroll

Purpose:
- staff
- attendance
- salary
- approvals
- security logs

Files to move:

- backend:
  - [apps/backend/src/routes/staffRoutes.js](../apps/backend/src/routes/staffRoutes.js)
  - [apps/backend/src/routes/attendanceRoutes.js](../apps/backend/src/routes/attendanceRoutes.js)
  - [apps/backend/src/routes/salaryRoutes.js](../apps/backend/src/routes/salaryRoutes.js)
  - [apps/backend/src/routes/approvalRoutes.js](../apps/backend/src/routes/approvalRoutes.js)
  - [apps/backend/src/routes/securityRoutes.js](../apps/backend/src/routes/securityRoutes.js)

- controllers:
  - [apps/backend/src/controllers/staffController.js](../apps/backend/src/controllers/staffController.js)
  - [apps/backend/src/controllers/attendanceController.js](../apps/backend/src/controllers/attendanceController.js)
  - [apps/backend/src/controllers/salaryController.js](../apps/backend/src/controllers/salaryController.js)
  - [apps/backend/src/controllers/approvalController.js](../apps/backend/src/controllers/approvalController.js)
  - [apps/backend/src/controllers/securityController.js](../apps/backend/src/controllers/securityController.js)

- models:
  - [apps/backend/src/model/staff.js](../apps/backend/src/model/staff.js)
  - [apps/backend/src/model/attendance.js](../apps/backend/src/model/attendance.js)
  - [apps/backend/src/model/salary.js](../apps/backend/src/model/salary.js)
  - [apps/backend/src/model/securitylog.js](../apps/backend/src/model/securitylog.js)

Frontend mapping:
- employee directory
- attendance page
- payroll page
- approval center

---

### Module 7: Membership / Loyalty / Programs

Purpose:
- membership
- coupons
- stamp programs
- laterpad

Files to move:

- backend:
  - [apps/backend/src/routes/membershipRoutes.js](../apps/backend/src/routes/membershipRoutes.js)
  - [apps/backend/src/routes/couponRoutes.js](../apps/backend/src/routes/couponRoutes.js)
  - [apps/backend/src/routes/stampRoutes.js](../apps/backend/src/routes/stampRoutes.js)
  - [apps/backend/src/routes/laterpadRoutes.js](../apps/backend/src/routes/laterpadRoutes.js)

- controllers:
  - [apps/backend/src/controllers/membershipController.js](../apps/backend/src/controllers/membershipController.js)
  - [apps/backend/src/controllers/couponController.js](../apps/backend/src/controllers/couponController.js)
  - [apps/backend/src/controllers/stampController.js](../apps/backend/src/controllers/stampController.js)
  - [apps/backend/src/controllers/laterpadController.js](../apps/backend/src/controllers/laterpadController.js)

- models:
  - [apps/backend/src/model/membership.js](../apps/backend/src/model/membership.js)
  - [apps/backend/src/model/coupon.js](../apps/backend/src/model/coupon.js)
  - [apps/backend/src/model/stampProgram.js](../apps/backend/src/model/stampProgram.js)
  - [apps/backend/src/model/laterpad.js](../apps/backend/src/model/laterpad.js)

Frontend mapping:
- customer membership page
- coupon management page
- stamp program UI

---

### Module 8: Hospitality / Vertical ops

Purpose:
- banquet bookings
- relevant booking workflows

Files to move:

- backend:
  - [apps/backend/src/routes/banquetRoutes.js](../apps/backend/src/routes/banquetRoutes.js)

- controllers:
  - [apps/backend/src/controllers/banquetController.js](../apps/backend/src/controllers/banquetController.js)

- models:
  - [apps/backend/src/model/banquetBooking.js](../apps/backend/src/model/banquetBooking.js)
  - [apps/backend/src/model/banquetHall.js](../apps/backend/src/model/banquetHall.js)
  - [apps/backend/src/model/banquetInquiry.js](../apps/backend/src/model/banquetInquiry.js)

Frontend mapping:
- booking dashboard
- banquet list page
- hall management screen

---

### Module 9: Reporting & Analytics

Purpose:
- financial/revenue analytics
- reports
- dashboards
- product analytics

Files to move:

- backend:
  - [apps/backend/src/routes/reportRoutes.js](../apps/backend/src/routes/reportRoutes.js)
  - [apps/backend/src/routes/consolidatedStatementRoutes.js](../apps/backend/src/routes/consolidatedStatementRoutes.js)
  - [apps/backend/src/routes/agingRoutes.js](../apps/backend/src/routes/agingRoutes.js)

- controllers:
  - [apps/backend/src/controllers/reportController.js](../apps/backend/src/controllers/reportController.js)
  - [apps/backend/src/controllers/consolidatedStatementController.js](../apps/backend/src/controllers/consolidatedStatementController.js)
  - [apps/backend/src/controllers/agingController.js](../apps/backend/src/controllers/agingController.js)
  - [apps/backend/src/controllers/productAnalyticsController.js](../apps/backend/src/controllers/productAnalyticsController.js)

Frontend mapping:
- report dashboard
- sales report page
- aging summary
- analytics charts

---

### Module 10: Integrations & automation

Purpose:
- sync APIs
- chat/whatsapp
- cloud services
- AI gateway
- external system connections

Files to move:

- backend:
  - [apps/backend/src/routes/syncRoutes.js](../apps/backend/src/routes/syncRoutes.js)
  - [apps/backend/src/routes/cloudRoutes.js](../apps/backend/src/routes/cloudRoutes.js)
  - [apps/backend/src/routes/whatsappRoutes.js](../apps/backend/src/routes/whatsappRoutes.js)
  - [apps/backend/src/routes/aiAdvisorRoutes.js](../apps/backend/src/routes/aiAdvisorRoutes.js)
  - [apps/backend/src/routes/aiGatewayRoutes.js](../apps/backend/src/routes/aiGatewayRoutes.js)
  - [apps/backend/src/routes/tallyRoutes.js](../apps/backend/src/routes/tallyRoutes.js)

- controllers:
  - [apps/backend/src/controllers/syncController.js](../apps/backend/src/controllers/syncController.js)
  - [apps/backend/src/controllers/cloudController.js](../apps/backend/src/controllers/cloudController.js)
  - [apps/backend/src/controllers/whatsappController.js](../apps/backend/src/controllers/whatsappController.js)
  - [apps/backend/src/controllers/aiAdvisorController.js](../apps/backend/src/controllers/aiAdvisorController.js)
  - [apps/backend/src/controllers/aiGatewayController.js](../apps/backend/src/controllers/aiGatewayController.js)
  - [apps/backend/src/controllers/tallyController.js](../apps/backend/src/controllers/tallyController.js)

Frontend mapping:
- sync settings page
- cloud backup page
- AI assistant screen
- WhatsApp message center

---

## 4. Which files should stay shared

Aise files ko module-specific nahi hona chahiye:

- [apps/backend/server.js](../apps/backend/server.js)
- [apps/backend/src/config](../apps/backend/src/config)
- [apps/backend/src/middleware](../apps/backend/src/middleware)
- [apps/backend/src/utils](../apps/backend/src/utils)
- [apps/backend/src/services](../apps/backend/src/services)
- [apps/backend/src/routes/index.js](../apps/backend/src/routes) (if created later)

Frontend shared files:

- [apps/web/src/components](../apps/web/src/components)
- [apps/web/src/services/api.jsx](../apps/web/src/services/api.jsx)
- [apps/mobile/src/components](../apps/mobile/src/components)
- [apps/mobile/src/navigation](../apps/mobile/src/navigation)
- [apps/mobile/src/hooks](../apps/mobile/src/hooks)
- [apps/mobile/src/utils](../apps/mobile/src/utils)

Agar common component hai, toh usko `shared/components` me rakho.

---

## 5. How to link modules correctly

### Backend linking pattern

Har module me ek main pattern rakho:

```txt
module/
  routes.js
  controller.js
  service.js
  model.js
  validation.js
```

Then in app entry point:

```js
import authModule from './src/modules/core/auth/routes.js';
import companyModule from './src/modules/core/company/routes.js';
import salesModule from './src/modules/sales/routes.js';
import inventoryModule from './src/modules/inventory/routes.js';

app.use('/api/auth', authModule);
app.use('/api/company', companyModule);
app.use('/api/sales', salesModule);
app.use('/api/inventory', inventoryModule);
```

Important rule:
- controller should call service
- service should call model / repository
- route should only map HTTP to controller

### Frontend linking pattern

```txt
apps/web/src/modules/sales/
  pages/
  components/
  services/
  hooks/
```

Example:

- `sales/pages/LeadPage.jsx`
- `sales/components/LeadForm.jsx`
- `sales/services/leadService.js`
- `sales/hooks/useLeads.js`

Then route config:

```jsx
<Route path="/sales/leads" element={<LeadPage />} />
```

And API call:

```js
import { fetchLeads } from '../modules/sales/services/leadService';
```

---

## 6. Phase-wise execution plan

## Phase 0: Audit and freeze

Goal:
- identify all existing features
- no random migration
- define module boundaries

Tasks:

1. All route files list kiya jaaye
2. Each route mapped to business domain
3. Shared utilities identified
4. Each page/component mapped to a domain
5. Add architecture docs and naming convention

Output:
- module map
- file ownership list
- no-break migration checklist

---

## Phase 1: Core platform module

Migrate first:

- auth
- user
- company
- settings
- notifications

Why first?
- sab modules is par depend karte hain
- login and company context setup required before other modules

Expected outcome:
- app starts with core module working
- user/company data available globally

---

## Phase 2: Sales and inventory

Migrate next:

- leads
- party
- quotations
- billing
- inventory
- warehouse
- stock transfer

Why second?
- these are revenue-generating modules
- business users usually need these first

---

## Phase 3: Procurement and finance

Migrate after sales/inventory:

- purchase
- purchase orders
- expenses
- GST
- TDS/TCS
- bank reconciliation
- payments

---

## Phase 4: HR + loyalty + hospitality

Migrate later:

- staff
- attendance
- salary
- security
- membership
- coupon
- stamp
- banquet

---

## Phase 5: Reporting + integrations

Migrate at the end:

- report
- analytics
- AI gateway
- sync
- cloud
- tally
- whatsapp

Why last?
- these are usually cross-cutting and depend on other modules

---

## Phase 6: Frontend cleanup

After backend modules stable:

1. [apps/web/src/pages](../apps/web/src/pages) ko module pages me split
2. [apps/web/src/components](../apps/web/src/components) ko shared vs feature-specific me split
3. [apps/mobile/src/screens](../apps/mobile/src/screens) ko module-based screens me move
4. services layer isolate
5. route config clear

---

## 7. Recommended file migration order

### Backend priority order

1. authRoutes.js
2. companyRoutes.js
3. userRoutes.js
4. settingsRoutes.js
5. notificationRoutes.js
6. leadRoutes.js
7. partyRoutes.js
8. billingRoutes.js
9. quotationRoutes.js
10. inventoryRoutes.js
11. warehouseRoutes.js
12. purchaseRoutes.js
13. purchaseOrderRoutes.js
14. gstRoutes.js
15. daybookRoutes.js
16. staffRoutes.js
17. salaryRoutes.js
18. attendanceRoutes.js
19. membershipRoutes.js
20. reportRoutes.js
21. syncRoutes.js
22. whatsappRoutes.js
23. aiGatewayRoutes.js

### Frontend priority order

1. auth pages
2. company profile/settings
3. dashboard/home
4. sales pages
5. inventory pages
6. purchase pages
7. finance pages
8. payroll pages
9. reporting pages
10. secure admin/integration pages

---

## 8. How to decide if a file belongs to which module

Use this rule:

- If file deals with user/company/account setup -> Core
- If file deals with revenue or customer pipeline -> Sales
- If file deals with stock/warehouse/items -> Inventory
- If file deals with vendor purchase/payment -> Procurement
- If file deals with tax/ledger/bank -> Finance
- If file deals with staff/salary/attendance -> HR
- If file deals with rewards/stamps/membership -> Membership
- If file deals with bookings/hospitality -> Hospitality
- If file deals with analytics/reports -> Reporting
- If file deals with external apps/APIs/sync -> Integrations

If a file touches 3 different domains, then it is shared or should be split into smaller files.

---

## 9. Example: company module extraction

Aapka current company controller already shows the pattern of a domain module. Example:

- [apps/backend/src/controllers/companyController.js](../apps/backend/src/controllers/companyController.js)
- [apps/backend/src/routes/companyRoutes.js](../apps/backend/src/routes/companyRoutes.js)
- [apps/backend/src/model/company.js](../apps/backend/src/model/company.js)

This should be transformed into:

```txt
apps/backend/src/modules/core/company/
  routes.js
  controller.js
  service.js
  model.js
  validator.js
```

And then imported in app entry:

```js
import companyModule from './src/modules/core/company/routes.js';
app.use('/api/company', companyModule);
```

Same pattern for other modules.

---

## 10. Component and page split guidance

### Shared UI components

Keep in shared folder:

- buttons
- modals
- datatable
- loader
- card layout
- forms
- toggles
- toast
- security wrappers

Examples from current project:

- [apps/web/src/components/Button.jsx](../apps/web/src/components/Button.jsx)
- [apps/web/src/components/Datatable.jsx](../apps/web/src/components/Datatable.jsx)
- [apps/web/src/components/Loader.jsx](../apps/web/src/components/Loader.jsx)
- [apps/web/src/components/DashboardLayout.jsx](../apps/web/src/components/DashboardLayout.jsx)

### Feature-specific components

Move to module folders:

- sales components -> sales module
- inventory components -> inventory module
- finance components -> finance module
- payroll components -> hr module
- reporting charts -> reporting module

### Pages

Web pages currently not much visible due to project structure, but future structure should be:

```txt
apps/web/src/modules/
  sales/
    pages/
      LeadsPage.jsx
      QuotationsPage.jsx
      InvoicesPage.jsx
  inventory/
    pages/
      InventoryPage.jsx
      WarehousePage.jsx
  finance/
    pages/
      GSTPage.jsx
      DaybookPage.jsx
  hr/
    pages/
      StaffPage.jsx
      PayrollPage.jsx
```

Mobile also similar:

```txt
apps/mobile/src/modules/
  sales/
    screens/
      LeadListScreen.js
      InvoiceScreen.js
```

---

## 11. Migration rules to avoid chaos

1. Do not move everything at once.
2. One module at a time only.
3. Keep shared utility imports as shared layer only.
4. Never mix business logic into app entry file.
5. Each module should have its own route and service boundaries.
6. Keep API contract stable while refactor is happening.
7. Update imports only after each module works.
8. Validate each module before moving to next.

---

## 12. Recommended final state

After complete refactor, aapke project me ye structure honi chahiye:

- backend domain modules
- frontend feature modules
- shared reusable layer
- minimal root app file
- clear dependency flow

This ensures:
- business logic independent
- easier team ownership
- easier maintenance
- future feature addition easy

---

## 13. My recommendation for this project

For your current project, do this exact sequence:

1. Core platform
2. Sales & CRM
3. Inventory
4. Procurement
5. Finance & tax
6. HR & payroll
7. Membership
8. Reporting
9. Integrations
10. Hospitality

This sequence is most practical because:
- core auth/company is base
- sales/inventory generate main operational flow
- finance/payments require working data first
- HR and loyalty are secondary but important
- reporting/integrations are cross-domain and should be last

---

## 14. Final answer in one line

Haan, isko alag-alag business module me split karna possible hai, aur ye project ke liye 8–10 modules ka clean target design best hai, with phased migration of routes, controllers, models, pages, and components, step by step without breaking the app.

---

## 15. Next action

Agar aap chaho, next step me main inhi files ke liye ek exact migration checklist bana sakta hoon, jisme:

- which file moves to which module
- exact folder structure
- backend route imports
- frontend page/component grouping
- one-by-one refactor order

Main isko ek practical execution sheet format me bhi bana sakta hoon so aap direct project me apply kar sakte ho.
