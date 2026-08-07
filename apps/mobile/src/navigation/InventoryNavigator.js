import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import Inventory-related screens
import InventoryScreen from '../screens/inventory/InventoryScreen';
import ProductListScreen from '../screens/inventory/ProductListScreen';
import ProductDetailScreen from '../screens/inventory/ProductDetailScreen';
import AddProductScreen from '../screens/inventory/AddProductScreen';
import BulkUploadScreen from '../screens/inventory/BulkUploadScreen';
import ProductImageUpload from '../screens/inventory/ProductImageUpload';
import PurchaseEntryScreen from '../screens/inventory/PurchaseEntryScreen';
import QRCodeGenerator from '../screens/inventory/QRCodeGenerator';
import SerialBatchScreen from '../screens/inventory/SerialBatchScreen';
import StockThresholdScreen from '../screens/inventory/StockThresholdScreen';
import CategoryAnalyticsScreen from '../screens/inventory/CategoryAnalyticsScreen';
import StockAdjustmentScreen from '../screens/inventory/StockAdjustmentScreen';
import StockTransferScreen from '../screens/inventory/StockTransferScreen';
import SupplierLedgerScreen from '../screens/inventory/SupplierLedgerScreen';

const Stack = createStackNavigator();

/**
 * Navigator for all screens related to Inventory Management.
 */
function InventoryNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InventoryList" component={InventoryScreen} />
      <Stack.Screen name="ProductList" component={ProductListScreen} options={{ headerShown: true, title: 'Product List' }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: true, title: 'Product Details' }} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ headerShown: true, title: 'Add New Product' }} />
      <Stack.Screen name="BulkUpload" component={BulkUploadScreen} options={{ headerShown: true, title: 'Bulk Upload' }} />
      <Stack.Screen name="ProductImageUpload" component={ProductImageUpload} options={{ headerShown: true, title: 'Upload Image' }} />
      <Stack.Screen name="PurchaseEntry" component={PurchaseEntryScreen} options={{ headerShown: true, title: 'Purchase Entry' }} />
      <Stack.Screen name="QRCodeGen" component={QRCodeGenerator} options={{ headerShown: true, title: 'Generate QR Code' }} />
      <Stack.Screen name="SerialBatch" component={SerialBatchScreen} options={{ headerShown: true, title: 'Serial/Batch Tracking' }} />
      <Stack.Screen name="StockThreshold" component={StockThresholdScreen} options={{ headerShown: true, title: 'Stock Threshold' }} />
      <Stack.Screen name="CategoryAnalytics" component={CategoryAnalyticsScreen} options={{ headerShown: true, title: 'Category Analytics' }} />
      <Stack.Screen name="StockAdjustment" component={StockAdjustmentScreen} options={{ headerShown: true, title: 'Stock Adjustment' }} />
      <Stack.Screen name="StockTransfer" component={StockTransferScreen} options={{ headerShown: true, title: 'Stock Transfer' }} />
      <Stack.Screen name="SupplierLedger" component={SupplierLedgerScreen} options={{ headerShown: true, title: 'Supplier Ledger' }} />
    </Stack.Navigator>
  );
}

export default InventoryNavigator;