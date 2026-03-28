import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function ReportsMenuScreen() {
  const navigation = useNavigation();
  
  // हमने सारी रिपोर्ट्स को अच्छी कैटेगरीज में बांट दिया है
  const reportCategories = [
    {
      title: "Transaction Reports",
      icon: "receipt-outline",
      reports: [
        { name: 'Sale Report', route: 'Reports', screen: 'SalesReport' },
        { name: 'Sales Return', route: 'Reports', screen: 'SalesReturn' },
        { name: 'Purchase Return', route: 'Reports', screen: 'PurchaseReturn' },
        { name: 'Day Book', route: 'DayBook' }, // DayBook is in the main stack
        { name: 'Expense Report', route: 'Reports', screen: 'ExpenseReport' },
        { name: 'Daily Sell & Purchase', route: 'Reports', screen: 'DailySellPurchase' },
      ]
    },
    {
      title: "Party & Item Reports",
      icon: "people-outline",
      reports: [
        { name: 'Party-wise Report', route: 'Reports', screen: 'PartyWise' },
        { name: 'Item-wise Report', route: 'Reports', screen: 'ItemWise' },
        { name: 'Bill-wise Report', route: 'Reports', screen: 'BillWise' },
        { name: 'Stock Alert', route: 'Reports', screen: 'StockAlert' },
        { name: 'Inventory Report', route: 'Reports', screen: 'InventoryReport' },
        { name: 'Supplier Ledger', route: 'SupplierLedger' }, // Inventory folder se link kiya
      ]
    },
    {
      title: "Accounting & Financial",
      icon: "briefcase-outline",
      reports: [
        { name: 'Profit & Loss', route: 'Reports', screen: 'ProfitLoss' },
        { name: 'Balance Sheet', route: 'Reports', screen: 'BalanceSheet' },
        { name: 'Cash Flow', route: 'Reports', screen: 'CashFlow' },
        { name: 'Aging Analysis', route: 'Reports', screen: 'AgingReport' },
        { name: 'Bank Auto-Tally', route: 'Reports', screen: 'BankReconciliation' },
      ]
    },
    {
      title: "Tax & Compliance",
      icon: "document-text-outline",
      reports: [
        { name: 'GST Report', route: 'Reports', screen: 'GSTReport' },
        { name: 'GSTR-3B', route: 'Reports', screen: 'GSTR3B' },
        { name: 'TDS & TCS Register', route: 'Reports', screen: 'TdsTcs' },
        { name: 'E-Way Bills', route: 'Reports', screen: 'EwayBill' },
      ]
    },
    {
      title: "Other Reports",
      icon: "layers-outline",
      reports: [
        { name: 'Site-wise Report', route: 'Reports', screen: 'SitewiseReport' },
        { name: 'Fixed Assets', route: 'Reports', screen: 'FixedAssets' },
        { name: 'Scheme Report', route: 'Reports', screen: 'SchemeReport' },
        { name: 'Custom Master Report', route: 'Reports', screen: 'Report' }, // ReportScreen.js link kiya
      ]
    }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {reportCategories.map((category, idx) => (
        <View key={idx} style={styles.categoryContainer}>
          <View style={styles.categoryHeader}>
            <Ionicons name={category.icon} size={20} color="#6C4CF1" style={styles.icon} />
            <Text style={styles.categoryTitle}>{category.title}</Text>
          </View>
          <View style={styles.grid}>
            {category.reports.map((report, rIdx) => (
              <TouchableOpacity 
                key={rIdx} 
                style={styles.card}
                onPress={() => report.screen ? navigation.navigate(report.route, { screen: report.screen }) : navigation.navigate(report.route)}
              >
                <Text style={styles.reportName}>{report.name}</Text>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA', padding: 16 },
  categoryContainer: { marginBottom: 20 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 },
  icon: { marginRight: 8 },
  categoryTitle: { fontSize: 15, fontWeight: 'bold', color: '#34495E', textTransform: 'uppercase', letterSpacing: 0.5 },
  grid: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', elevation: 1, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }) },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  reportName: { fontSize: 14, color: '#334155', fontWeight: '500' }
});