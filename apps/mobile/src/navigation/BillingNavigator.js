import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import BillListScreen from '../screens/billing/BillListScreen';
import CreateBillScreen from '../screens/billing/CreateBillScreen';
import BillDetailscreen from '../screens/billing/BillDetailscreen';
import ImportBillScreen from '../screens/billing/ImportBillScreen';
import NongstBillingScreen from '../screens/billing/NongstBillingScreen';
import ThirdPartyDispatchBilling from '../screens/billing/ThirdPartyDispatchBilling';
import ConsolidatedStatementDetail from '../screens/billing/ConsolidatedStatementDetail';
import ConsolidateUdharScreen from '../screens/billing/ConsolidateUdharScreen';
import ReviewParsedBillScreen from '../screens/billing/ReviewParsedBillScreen';
import SchemeApplyModel from '../screens/billing/SchemeApplyModel'; // File rename required: Scheem -> Scheme
import MultiSiteBillingScreen from '../screens/billing/MultiSiteBillingScreen';

const Stack = createStackNavigator();

export default function BillingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="BillList" component={BillListScreen} options={{ title: 'Invoices' }} />
      <Stack.Screen name="CreateBill" component={CreateBillScreen} options={{ title: 'New Invoice' }} />
      <Stack.Screen name="BillDetail" component={BillDetailscreen} options={{ title: 'Invoice Details' }} />
      <Stack.Screen name="ImportBill" component={ImportBillScreen} />
      <Stack.Screen name="NonGSTBilling" component={NongstBillingScreen} />
      <Stack.Screen name="ThirdPartyBilling" component={ThirdPartyDispatchBilling} />
      <Stack.Screen name="ConsolidatedStatement" component={ConsolidatedStatementDetail} />
      <Stack.Screen name="ConsolidateUdhar" component={ConsolidateUdharScreen} />
      <Stack.Screen name="ReviewParsedBill" component={ReviewParsedBillScreen} />
      <Stack.Screen name="MultiSiteBilling" component={MultiSiteBillingScreen} />
      <Stack.Screen name="SchemeApply" component={SchemeApplyModel} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}