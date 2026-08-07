import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function ReportsMenuScreen() {
  const navigation = useNavigation();
  
  // Available routes are kept to only the screens that are wired in the mobile app navigator.
  const reportCategories = [
    {
      title: "Transaction Reports",
      icon: "receipt-outline",
      reports: [
        { name: 'Day Book', route: 'DayBook' },
        { name: 'Expense Report', route: 'DayBook' },
        { name: 'Bill-wise Report', route: 'BillList' },
      ]
    },
    {
      title: "Party & Item Reports",
      icon: "people-outline",
      reports: [
        { name: 'Supplier Ledger', route: 'SupplierLedger' },
        { name: 'Inventory Report', route: 'Inventory' },
        { name: 'Stock Alert', route: 'Inventory' },
      ]
    },
    {
      title: "Accounting & Financial",
      icon: "briefcase-outline",
      reports: [
        { name: 'Bank Auto-Tally', route: 'GstReport' },
        { name: 'GST Report', route: 'GstReport' },
      ]
    }
  ];

  const handleReportPress = (report) => {
    if (report.route && navigation.navigate) {
      navigation.navigate(report.route);
      return;
    }

    Alert.alert('Coming Soon', 'This report is being prepared for the mobile experience.');
  };

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
                onPress={() => handleReportPress(report)}
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