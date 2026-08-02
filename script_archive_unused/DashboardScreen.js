import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, FlatList, Platform } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getData } from '../../services/ApiService';
import Footer from '../../components/Footer';
import { getBillsLocal, getProductsLocal, getPartiesLocal } from '../../../db'; // Offline DB

const SummaryCard = ({ title, value, icon, color, fullWidth }) => (
  <View style={[styles.summaryCard, fullWidth && styles.summaryCardFull]}>
    <View style={[styles.iconWrapper, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={fullWidth ? 32 : 28} color={color} />
    </View>
    <View style={fullWidth ? { marginLeft: 16, flex: 1 } : { marginTop: 12, alignItems: 'center' }}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={[styles.cardValue, { color }]}>₹{Number(value).toLocaleString()}</Text>
    </View>
  </View>
);

const QuickActionButton = ({ title, icon, onPress, color = '#4338ca' }) => (
  <TouchableOpacity style={styles.quickActionBtn} onPress={onPress}>
    <View style={[styles.quickIconBg, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={26} color={color} />
    </View>
    <Text style={styles.quickActionText}>{title}</Text>
  </TouchableOpacity>
);

const DashboardScreen = () => {
  const navigation = useNavigation();
  const [summary, setSummary] = useState({ totalAssets: 0, accountsReceivable: 0, inventoryValue: 0 });
  const [recentBills, setRecentBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      // 1. Offline First: Fetch local data
      const [localBills, localProducts, localParties] = await Promise.all([
        getBillsLocal(),
        getProductsLocal(),
        getPartiesLocal()
      ]);

      // Calculate summaries offline
      const totalSales = localBills.reduce((sum, b) => sum + (b.totalAmount || b.finalAmount || 0), 0);
      const inventoryValue = localProducts.reduce((sum, p) => sum + ((p.price || 0) * (p.quantity || 0)), 0);
      const accountsReceivable = localParties.reduce((sum, p) => sum + Math.abs(p.balance || 0), 0);

      setSummary({ totalAssets: totalSales, accountsReceivable, inventoryValue });

      // Set recent bills from local DB (show latest 5)
      setRecentBills(localBills.slice(0, 5));

    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // useFocusEffect will refetch data every time the screen comes into view
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const renderBillItem = ({ item }) => (
    <TouchableOpacity style={styles.recentBillCard} onPress={() => navigation.navigate('Billing', { screen: 'BillDetail', params: { billId: item._id } })}>
      <View style={styles.billIconBg}><Ionicons name="receipt" size={20} color="#4338ca" /></View>
      <View style={{ flex: 1, paddingHorizontal: 12 }}>
        <Text style={styles.billParty} numberOfLines={1}>{item.customerName || item.partyId?.name || 'Cash Customer'}</Text>
        <Text style={styles.billDate}>#{item.billNumber} • {new Date(item.date).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.billAmount}>₹{Number(item.finalAmount || item.totalAmount || item.total || 0).toLocaleString()}</Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.greetingText}>Welcome Back 👋</Text>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <SummaryCard title="Total Revenue" value={summary.totalAssets.toFixed(0)} icon="trending-up" color="#4338ca" fullWidth />
        <View style={styles.rowCards}>
          <SummaryCard title="To Receive (Udhar)" value={summary.accountsReceivable.toFixed(0)} icon="arrow-down-circle" color="#dc2626" />
          <SummaryCard title="Stock Value" value={summary.inventoryValue.toFixed(0)} icon="cube" color="#059669" />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {/* Row 1 */}
          <QuickActionButton title="Sale Bill" icon="receipt" onPress={() => navigation.navigate('Billing', { screen: 'CreateBill' })} color="#4338ca" />
          <QuickActionButton title="Purchase" icon="cart" onPress={() => navigation.navigate('Inventory', { screen: 'PurchaseEntry' })} color="#059669" />
          <QuickActionButton title="Parties" icon="people" onPress={() => navigation.navigate('Parties')} color="#d97706" />
          
          {/* Row 2 */}
          <QuickActionButton title="Items" icon="cube" onPress={() => navigation.navigate('Inventory', { screen: 'ProductList' })} color="#7c3aed" />
          <QuickActionButton title="Expenses" icon="wallet" onPress={() => navigation.navigate('Expenses')} color="#e11d48" />
          <QuickActionButton title="B2B Docs" icon="document-text" onPress={() => navigation.navigate('B2bDocuments')} color="#0ea5e9" />

          {/* Row 3 */}
          <QuickActionButton title="Returns" icon="return-up-back" onPress={() => navigation.navigate('CreateReturn')} color="#c2410c" />
          <QuickActionButton title="Staff/Salary" icon="person-add" onPress={() => navigation.navigate('StaffManagement')} color="#4d7c0f" />
          <QuickActionButton title="Reports" icon="bar-chart" onPress={() => navigation.navigate('Reports', { screen: 'ReportsHome' })} color="#be185d" />

        </View>
        {/* Extra actions can go here or in a "More" menu */}
        <TouchableOpacity style={styles.viewMoreBtn} onPress={() => navigation.navigate('More')}><Text style={styles.viewMoreText}>More Options...</Text></TouchableOpacity>
      </View>

      {/* Recent Bills */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Invoices</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Billing', { screen: 'BillList' })}>
                <Text style={styles.viewAll}>See All</Text>
            </TouchableOpacity>
        </View>
        <FlatList
          data={recentBills}
          keyExtractor={(item) => item._id}
          renderItem={renderBillItem}
          ListEmptyComponent={<Text style={styles.emptyText}>No recent bills found.</Text>}
          scrollEnabled={false} // Disable scrolling for the inner list
        />
      </View>
      <Footer />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F6F8' },
  headerContainer: { backgroundColor: '#fff', padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: '#312e81', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 4, marginBottom: 15 },
  greetingText: { fontSize: 14, color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#111827' },
  
  summaryContainer: { paddingHorizontal: 15 },
  rowCards: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, width: '48%', marginBottom: 15, shadowColor: '#312e81', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  summaryCardFull: { width: '100%', flexDirection: 'row', alignItems: 'center', paddingVertical: 20 },
  iconWrapper: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 13, color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardValue: { fontSize: 24, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 },

  section: { paddingHorizontal: 15, marginTop: 10, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  viewAll: { color: '#4338ca', fontWeight: '700', fontSize: 14 },

  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', backgroundColor: '#fff', borderRadius: 20, padding: 15, shadowColor: '#312e81', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, marginTop: 10 },
  quickActionBtn: { alignItems: 'center', width: '33.33%', marginBottom: 20 },
  quickIconBg: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickActionText: { fontSize: 12, color: '#374151', fontWeight: '700', textAlign: 'center' },

  viewMoreBtn: { alignItems: 'center', marginTop: 10 },
  viewMoreText: { color: '#4338ca', fontWeight: '600' },

  recentBillCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#312e81', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  billIconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
  billParty: { fontSize: 16, fontWeight: '800', color: '#1f2937' },
  billDate: { fontSize: 13, color: '#6b7280', marginTop: 2, fontWeight: '600' },
  billAmount: { fontSize: 18, fontWeight: '900', color: '#4338ca' },
  emptyText: { textAlign: 'center', color: '#9ca3af', paddingVertical: 30, fontSize: 15, fontWeight: '600' },
});

export default DashboardScreen;