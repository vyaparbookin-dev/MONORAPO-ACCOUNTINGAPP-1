import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';

const reportsData = [
  { id: '1', name: 'Sales Report', icon: 'bar-chart', screen: 'SalesReport' },
  { id: '2', name: 'Purchase Return', icon: 'return-up-back', screen: 'PurchaseReturn' },
  { id: '3', name: 'Sales Return', icon: 'return-down-back', screen: 'SalesReturn' },
  { id: '4', name: 'GSTR-3B', icon: 'document-text', screen: 'GSTR3B' },
  { id: '5', name: 'Profit & Loss', icon: 'trending-up', screen: 'ProfitLoss' },
  { id: '6', name: 'Balance Sheet', icon: 'scale', screen: 'BalanceSheet' },
  { id: '7', name: 'Stock Alert', icon: 'alert-circle', screen: 'StockAlert' },
  { id: '8', name: 'Expense Report', icon: 'cash', screen: 'ExpenseReport' },
  { id: '9', name: 'Bill Wise', icon: 'receipt', screen: 'BillWise' },
  { id: '10', name: 'Item Wise', icon: 'cube', screen: 'ItemWise' },
  { id: '11', name: 'Party Wise', icon: 'people', screen: 'PartyWise' },
  { id: '12', name: 'GST Report', icon: 'calculator', screen: 'GSTReport' },
  { id: '13', name: 'Inventory Report', icon: 'file-tray-full', screen: 'InventoryReport' },
  { id: '14', name: 'Cash Flow', icon: 'swap-horizontal', screen: 'CashFlow' },
  { id: '15', name: 'Daily Summary', icon: 'calendar', screen: 'DailySellPurchase' },
  { id: '16', name: 'Scheme Report', icon: 'gift', screen: 'SchemeReport' },
  { id: '17', name: 'Sitewise Report', icon: 'business', screen: 'SitewiseReport' },
  { id: '18', name: 'Bank Auto-Tally', icon: 'sync', screen: 'BankReconciliation' },
  { id: '19', name: 'TDS & TCS Register', icon: 'document-text', screen: 'TdsTcs' },
  { id: '20', name: 'Fixed Assets', icon: 'desktop', screen: 'FixedAssets' },
  { id: '21', name: 'E-Way & E-Invoice', icon: 'globe', screen: 'EwayBill' },
];

const ReportScreen = ({ navigation }) => {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        // Navigation will work only if the screen is enabled in Navigator
        navigation.navigate(item.screen);
      }}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={item.icon} size={24} color="#4f46e5" />
      </View>
      <Text style={styles.cardText}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={reportsData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  listContent: { padding: 15 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    ...Platform.select({
      ios: {     },
      android: { ...Platform.select({
      ios: {     },
      android: { elevation: 2 },
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.2)' }
    }), },
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.2)' }
    })
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});

export default ReportScreen;