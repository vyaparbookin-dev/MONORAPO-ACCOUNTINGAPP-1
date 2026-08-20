import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform, 
  StatusBar 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function ReportsMenuScreen() {
  const navigation = useNavigation();
  
  const allReports = [
    {
      id: 'party_sales',
      title: 'Party Wise',
      subtitle: '(Sales)',
      icon: 'account-tie',
      iconBg: '#EEF2FF',
      iconColor: '#4F46E5',
      route: 'PartyWise',
      stack: 'Reports'
    },
    {
      id: 'product_sales',
      title: 'Product Wise',
      subtitle: '(Sales)',
      icon: 'file-document-outline',
      iconBg: '#ECFDF5',
      iconColor: '#059669',
      route: 'ItemWise',
      stack: 'Reports'
    },
    {
      id: 'category_report',
      title: 'Category Wise',
      subtitle: 'Sales & Stock',
      icon: 'view-grid-outline',
      iconBg: '#FFFBEB',
      iconColor: '#D97706',
      route: 'InventoryReport',
      stack: 'Reports'
    },
    {
      id: 'party_purchase',
      title: 'Party Wise',
      subtitle: '(Purchase)',
      icon: 'account-group',
      iconBg: '#FFF1F2',
      iconColor: '#E11D48',
      route: 'SupplierLedger',
      stack: 'Inventory'
    },
    {
      id: 'product_purchase',
      title: 'Product Wise',
      subtitle: '(Purchase)',
      icon: 'package-variant-closed',
      iconBg: '#F0F9FF',
      iconColor: '#0284C7',
      route: 'InventoryReport',
      stack: 'Reports'
    },
    {
      id: 'stock_alert',
      title: 'Stock Alert',
      subtitle: 'Low & Zero Stock',
      icon: 'alert-octagon-outline',
      iconBg: '#FEF2F2',
      iconColor: '#DC2626',
      route: 'StockAlert',
      stack: 'Reports'
    },
    {
      id: 'gst_sales',
      title: 'GST Sales Report',
      subtitle: 'Tax Breakdown',
      icon: 'calculator-variant',
      iconBg: '#FDF4FF',
      iconColor: '#A21CAF',
      route: 'GSTReport',
      stack: 'Reports'
    },
    {
      id: 'gst_purchase',
      title: 'GST Purchase Report',
      subtitle: 'ITC Claims',
      icon: 'chart-bar',
      iconBg: '#F0F9FF',
      iconColor: '#0284C7',
      route: 'GSTReport',
      stack: 'Reports'
    },
    {
      id: 'gstr1',
      title: 'GSTR-1',
      subtitle: 'Monthly Sales',
      icon: 'file-certificate-outline',
      iconBg: '#ECFDF5',
      iconColor: '#059669',
      route: 'GSTReport',
      stack: 'Reports'
    },
    {
      id: 'gstr2',
      title: 'GSTR-2',
      subtitle: 'Purchase Reco',
      icon: 'file-check-outline',
      iconBg: '#EEF2FF',
      iconColor: '#4338CA',
      route: 'GSTReport',
      stack: 'Reports'
    },
    {
      id: 'gstr3b',
      title: 'GSTR-3B',
      subtitle: 'Summary Return',
      icon: 'file-percent-outline',
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
      route: 'GSTR3B',
      stack: 'Reports'
    },
    {
      id: 'daybook',
      title: 'Day Book & Cash',
      subtitle: 'Daily Cash In/Out',
      icon: 'book-open-outline',
      iconBg: '#F0FDF4',
      iconColor: '#16A34A',
      route: 'DayBook',
      stack: 'Reports'
    },
    {
      id: 'profit_loss',
      title: 'Profit & Loss',
      subtitle: 'Net Income',
      icon: 'trending-up',
      iconBg: '#ECFDF5',
      iconColor: '#059669',
      route: 'ProfitLoss',
      stack: 'Reports'
    },
    {
      id: 'bank_rec',
      title: 'Bank Auto-Tally',
      subtitle: 'Bank Statement Reco',
      icon: 'bank-outline',
      iconBg: '#EEF2FF',
      iconColor: '#4F46E5',
      route: 'BankReconciliation',
      stack: 'Reports'
    },
    {
      id: 'aging',
      title: 'Aging Analysis',
      subtitle: 'Overdue Udhar',
      icon: 'calendar-clock',
      iconBg: '#FFF7ED',
      iconColor: '#EA580C',
      route: 'AgingReport',
      stack: 'Reports'
    },
    {
      id: 'dispatch_challan',
      title: 'Bill-Wise Report',
      subtitle: 'Invoices & Challan',
      icon: 'truck-delivery-outline',
      iconBg: '#F1F5F9',
      iconColor: '#475569',
      route: 'BillWise',
      stack: 'Reports'
    }
  ];

  const handleReportPress = (report) => {
    try {
      if (report.stack) {
        navigation.navigate(report.stack, { screen: report.route });
      } else {
        navigation.navigate('Reports', { screen: report.route });
      }
    } catch (err) {
      console.log('Report navigation err:', err);
      navigation.navigate(report.route);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#F59E0B" barStyle="dark-content" />

      {/* Top Header matching reference (Image 4) */}
      <View style={styles.topHeader}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Dashboard');
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Please select the report type</Text>

        {/* 2-Column Grid */}
        <View style={styles.grid}>
          {allReports.map((report) => (
            <TouchableOpacity 
              key={report.id}
              style={styles.reportCard}
              onPress={() => handleReportPress(report)}
              activeOpacity={0.75}
            >
              <View style={[styles.iconCircle, { backgroundColor: report.iconBg }]}>
                <MaterialCommunityIcons name={report.icon} size={28} color={report.iconColor} />
              </View>
              <Text style={styles.reportTitle}>{report.title}</Text>
              <Text style={styles.reportSub}>{report.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    paddingBottom: 14,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
    textAlign: 'center',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  reportCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#64748B',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  reportTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  reportSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
});