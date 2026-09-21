# Pending Module Files & Transfer Checklist

This document tracks all files across business vertical modules and shared domains during the modular refactoring.

---

## 1. Inventory & Warehouse Module (`modules/inventory/`)
These files exist in core and are scheduled to be integrated into `modules/inventory/`:
- [x] `controllers/warehouseController.js` (from `src/controllers/warehouseController.js`)
- [x] `controllers/stockTransferController.js` (from `src/controllers/stockTransferController.js`)
- [x] `controllers/productAnalyticsController.js` (from `src/controllers/productAnalyticsController.js`)
- [x] `models/warehouse.js` (from `src/model/warehouse.js`)
- [x] `models/stockTransfer.js` (from `src/model/stockTransfer.js`)
- [x] `routes/warehouseRoutes.js` (from `src/routes/warehouseRoutes.js`)
- [x] `routes/stockTransferRoutes.js` (from `src/routes/stockTransferRoutes.js`)

Existing inventory files in module:
- `brandController.js`, `categoryController.js`, `inventoryController.js`, `subCategoryController.js`, `unitController.js`
- `brand.js`, `category.js`, `product.js`, `stockAdjustment.js`, `subCategory.js`, `unit.js`
- `brandRoutes.js`, `categoryRoutes.js`, `inventoryRoutes.js`, `subCategoryRoutes.js`, `unitRoutes.js`

---

## 2. Business Vertical Modules (Status: Prepared)
- **Cloth (`modules/cloth/`)**: `clothController.js`, `cloth.js`, `clothRoutes.js`
- **Medical (`modules/medical/`)**: `medicineController.js`, `medicine.js`, `medicalRoutes.js`
- **Salon (`modules/salon/`)**: `appointmentController.js`, `appointment.js`, `salonRoutes.js`
- **Restaurant (`modules/restaurant/`)**: `restaurantController.js`, `restaurantMenuItem.js`, `restaurantRoutes.js`
- **Supermarket (`modules/supermarket/`)**: `supermarketItemController.js`, `supermarketItem.js`, `supermarketRoutes.js`
- **Banquet (`modules/banquet/`)**: `banquetController.js`, `banquetBooking.js`, `banquetHall.js`, `banquetInquiry.js`, `banquetRoutes.js`
- **Gamezone (`modules/gamezone/`)**: `gameZoneController.js`, `gameZoneItem.js`, `gameZoneRoutes.js`
- **Mobile (`modules/mobile/`)**: `mobileDeviceController.js`, `mobileDevice.js`, `mobileRoutes.js`
- **Hardware-Electrical (`modules/hardware-electrical/`)**: `equipmentController.js`, `equipment.js`, `hardwareElectricalRoutes.js`
- **Sales/Leads (`modules/sales/`)**: `leadController.js`, `lead.js`, `leadRoutes.js`

---

## 3. Core & Shared Engine (Keep Intact in Core/Shared)
- **Core Platform**: `auth`, `user`, `company`, `branch`, `settings`, `security`, `adminDashboard`
- **Accounting Engine**: `billing`, `daybook`, `party`, `payment`, `purchase`, `purchaseOrder`, `quotation`, `return`, `expenses`, `capital`, `bankAccount`, `bankRec`, `creditLimit`, `consolidatedStatement`, `gst`, `tdsTcs`, `eWayBill`, `aging`, `report`, `fixedAsset`
- **Staff & HR**: `staff`, `salary`, `attendance`
- **Loyalty & Promotions**: `coupon`, `stamp`, `scheme`, `membership`, `savings`
- **Integrations & AI**: `whatsapp`, `cloud`, `aiAdvisor`, `aiGateway`, `approval`, `laterpad`, `b2b`
