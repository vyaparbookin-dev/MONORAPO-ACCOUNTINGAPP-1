import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import ReportScreen from '../screens/report/ReportScreen';
import BalanceSheetReport from '../screens/report/BalanceSheetReport';
import BillWiseReport from '../screens/report/BillWiseReport';
import CashFlowReportScreen from '../screens/report/CashFlowReportScreen';
import DailySellPurchaseReport from '../screens/report/DailySellPurchaseReport';
import ExpenseReportScreen from '../screens/report/ExpenseReportScreen';
import Gstr3bReportScreen from '../screens/report/Gstr3bReportScreen';
import GstReportScreen from '../screens/report/GstReportScreen';
import InventoryReportScreen from '../screens/report/InventoryReportScreen';
import ItemWiseReport from '../screens/report/ItemWiseReport'; // Added missing import
import PartyWiseReport from '../screens/report/PartyWiseReport';
import ProfitLossReport from '../screens/report/ProfitLossReport';
import PurchaseReturnReport from '../screens/report/PurchaseReturnReport';
import SalesReportScreen from '../screens/report/SalesReportScreen'; // Corrected typo
import SalesReturnReport from '../screens/report/SalesReturnReport';
import SchemeReport from '../screens/report/SchemeReport';
import SitewiseReportScreen from '../screens/report/SitewiseReportScreen';
import StockalertReport from '../screens/report/StockalertReport';
import BankReconciliationScreen from '../screens/report/BankReconciliationScreen';
import TdsTcsScreen from '../screens/report/TdsTcsScreen';
import FixedAssetsScreen from '../screens/report/FixedAssetsScreen';
import EwayBillScreen from '../screens/report/EwayBillScreen';
import AgingReportScreen from '../screens/report/AgingReportScreen';

const Stack = createStackNavigator();

export default function ReportNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="ReportsHome" component={ReportScreen} options={{ title: 'Reports' }} />
      <Stack.Screen name="Report" component={ReportScreen} options={{ title: 'Master Report' }} />
      <Stack.Screen name="BalanceSheet" component={BalanceSheetReport} />
      <Stack.Screen name="BillWise" component={BillWiseReport} />
      <Stack.Screen name="CashFlow" component={CashFlowReportScreen} />
      <Stack.Screen name="DailySellPurchase" component={DailySellPurchaseReport} />
      <Stack.Screen name="ExpenseReport" component={ExpenseReportScreen} />
      <Stack.Screen name="GSTR3B" component={Gstr3bReportScreen} />
      <Stack.Screen name="GSTReport" component={GstReportScreen} />
      <Stack.Screen name="InventoryReport" component={InventoryReportScreen} />
      <Stack.Screen name="ItemWise" component={ItemWiseReport} />
      <Stack.Screen name="PartyWise" component={PartyWiseReport} />
      <Stack.Screen name="ProfitLoss" component={ProfitLossReport} />
      <Stack.Screen name="PurchaseReturn" component={PurchaseReturnReport} />
      <Stack.Screen name="SalesReport" component={SalesReportScreen} />
      <Stack.Screen name="SalesReturn" component={SalesReturnReport} />
      <Stack.Screen name="SchemeReport" component={SchemeReport} />
      <Stack.Screen name="SitewiseReport" component={SitewiseReportScreen} />
      <Stack.Screen name="StockAlert" component={StockalertReport} />
      <Stack.Screen name="BankReconciliation" component={BankReconciliationScreen} options={{ title: 'Bank Auto-Tally' }} />
      <Stack.Screen name="TdsTcs" component={TdsTcsScreen} options={{ title: 'TDS & TCS Register' }} />
      <Stack.Screen name="FixedAssets" component={FixedAssetsScreen} options={{ title: 'Fixed Assets' }} />
      <Stack.Screen name="EwayBill" component={EwayBillScreen} options={{ title: 'E-Way Bills' }} />
      <Stack.Screen name="AgingReport" component={AgingReportScreen} options={{ title: 'Aging Analysis' }} />
    </Stack.Navigator>
  );
}