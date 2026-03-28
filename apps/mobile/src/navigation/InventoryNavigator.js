import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

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

const Stack = createStackNavigator();

export default function InventoryNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="InventoryHome" component={InventoryScreen} options={{ title: 'Inventory' }} />
      <Stack.Screen name="ProductList" component={ProductListScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="BulkUpload" component={BulkUploadScreen} />
      <Stack.Screen name="ProductImageUpload" component={ProductImageUpload} />
      <Stack.Screen name="PurchaseEntry" component={PurchaseEntryScreen} />
      <Stack.Screen name="QRCodeGen" component={QRCodeGenerator} />
      <Stack.Screen name="SerialBatch" component={SerialBatchScreen} />
      <Stack.Screen name="StockThreshold" component={StockThresholdScreen} />
    </Stack.Navigator>
  );
}