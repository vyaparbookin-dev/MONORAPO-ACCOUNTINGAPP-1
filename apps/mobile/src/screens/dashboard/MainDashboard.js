import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, FlatList, Platform, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import CalculatorModal from '../../components/CalculatorModal';
import { getData } from '../../services/ApiService';


export default function MainDashboard({ navigation }) {
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [recentBills, setRecentBills] = useState([]);
  const [summary, setSummary] = useState({ toCollect: 0, toPay: 0, stockValue: 0, totalBalance: 0 });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [billsRes, partiesRes, invRes] = await Promise.all([
        getData('/billing?limit=5'),
        getData('/party'),
        getData('/inventory')
      ]);

      if (billsRes.data?.bills) setRecentBills(billsRes.data.bills);

      let toCollect = 0, toPay = 0, totalBal = 0;
      if (partiesRes.data?.parties) {
        partiesRes.data.parties.forEach(p => {
          const bal = p.balance || p.currentBalance || 0;
          if (p.partyType === 'customer' && bal > 0) toCollect += bal;
          if (p.partyType === 'supplier' && bal > 0) toPay += bal;
          totalBal += bal;
        });
      }

      let stockVal = 0;
      if (invRes.data?.products) {
        invRes.data.products.forEach(p => { stockVal += (p.currentStock || 0) * (p.costPrice || 0); });
      }

      setSummary({ toCollect, toPay, stockValue: stockVal, totalBalance: totalBal });
    } catch (e) {
      console.log("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, []));

  return (
    <View style={styles.container}>
      <CalculatorModal visible={calculatorVisible} onClose={() => setCalculatorVisible(false)} />
      <StatusBar backgroundColor="#5B3FD0" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.businessNameContainer}>
            <Text style={styles.businessName}>GANESH TRADERS <Ionicons name="chevron-down" size={16} color="#FFF" /></Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setCalculatorVisible(true)}>
            <Ionicons name="calculator-outline" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Approvals')}>
            <Ionicons name="checkmark-done-circle-outline" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => Alert.alert('Desktop App', 'Visit our website!')}>
            <Ionicons name="desktop-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* To Collect & To Pay Summary */}
        <View style={styles.topSummaryContainer}>
          <TouchableOpacity style={[styles.topSummaryCard, { borderLeftColor: '#10B981' }]} onPress={() => navigation.navigate('Parties')}>
            <Text style={styles.topSummaryLabel}>To Collect (Udhar)</Text>
            <Text style={[styles.topSummaryAmount, { color: '#10B981' }]}>₹ {summary.toCollect.toLocaleString('en-IN')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.topSummaryCard, { borderLeftColor: '#EF4444' }]} onPress={() => navigation.navigate('Parties')}>
            <Text style={styles.topSummaryLabel}>To Pay</Text>
            <Text style={[styles.topSummaryAmount, { color: '#EF4444' }]}>₹ {summary.toPay.toLocaleString('en-IN')}</Text>
          </TouchableOpacity>
        </View>

        {/* Main Grid Cards */}
        <View style={styles.gridContainer}>
          <GridCard title="Stock Value" amount={`₹ ${summary.stockValue.toLocaleString('en-IN')}`} icon="cube-outline" iconColor="#64748B" bg="#FFFFFF" onPress={() => navigation.navigate('Inventory', { screen: 'ProductList' })} />
          <GridCard title="This Week's Sale" amount="View Sales" icon="cart-outline" iconColor="#64748B" bg="#FFFFFF" onPress={() => navigation.navigate('Billing', { screen: 'BillList' })} />
          <GridCard title="Total Balance" amount={`₹ ${summary.totalBalance.toLocaleString('en-IN')}`} icon="wallet-outline" iconColor="#64748B" bg="#FFFFFF" onPress={() => navigation.navigate('Parties')} />
          <GridCard title="Reports" amount="View All" icon="bar-chart-outline" iconColor="#5B3FD0" bg="#FFFFFF" onPress={() => navigation.navigate('ReportsTab')} actionText />
        </View>

        {/* Premium Banner */}
        <TouchableOpacity style={styles.premiumBanner}>
          <View style={styles.premiumIconBg}>
            <MaterialCommunityIcons name="crown" size={24} color="#F59E0B" />
          </View>
          <View style={styles.premiumTextContainer}>
            <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
            <Text style={styles.premiumSub}>Unlock Desktop Sync & E-Way Bills</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Recent Transactions */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Billing', { screen: 'BillList' })}><Text style={styles.viewAllText}>View All</Text></TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color="#5B3FD0" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={recentBills}
              keyExtractor={item => item._id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.billItem} onPress={() => navigation.navigate('Billing', { screen: 'BillDetail', params: { billId: item._id } })}>
                  <View style={styles.billIcon}><Ionicons name="receipt-outline" size={20} color="#5B3FD0" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.billName} numberOfLines={1}>{item.customerName || item.partyId?.name || 'Cash Customer'}</Text>
                    <Text style={styles.billDate}>#{item.billNumber} • {new Date(item.date || item.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.billAmount}>₹ {(item.finalAmount || item.total || 0).toLocaleString('en-IN')}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyText}>No Transactions Found</Text>
                </View>
              }
            />
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const GridCard = ({ title, amount, icon, iconColor, bg, onPress, actionText }) => (
  <TouchableOpacity style={[styles.gridCard, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.gridCardHeader}>
      <Text style={styles.gridCardTitle}>{title}</Text>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <Text style={[styles.gridCardAmount, actionText && { color: '#5B3FD0', fontSize: 15, marginTop: 4 }]}>{amount}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  
  header: { 
    backgroundColor: '#5B3FD0', padding: 16, paddingTop: Platform.OS === 'ios' ? 50 : 40, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 4,
    shadowColor: '#5B3FD0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  businessNameContainer: { justifyContent: 'center' },
  businessName: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  headerRight: { flexDirection: 'row' },
  iconButton: { marginLeft: 16 },
  scrollContent: { padding: 16 },
  
  topSummaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  topSummaryCard: { width: '48%', backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderLeftWidth: 4, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  topSummaryLabel: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 4 },
  topSummaryAmount: { fontSize: 18, fontWeight: '800' },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  gridCard: {
    width: '48%', borderRadius: 16, padding: 16, marginBottom: 16,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  gridCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  gridCardTitle: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  gridCardAmount: { color: '#0F172A', fontSize: 18, fontWeight: '800' },

  premiumBanner: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, 
    borderRadius: 16, marginBottom: 24, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 
  },
  premiumIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFBEB', justifyContent: 'center', alignItems: 'center' },
  premiumTextContainer: { flex: 1, marginLeft: 12 },
  premiumTitle: { color: '#0F172A', fontSize: 15, fontWeight: 'bold' },
  premiumSub: { color: '#64748B', fontSize: 12, marginTop: 2 },

  recentSection: { flex: 1 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  viewAllText: { fontSize: 13, fontWeight: '700', color: '#5B3FD0' },
  
  billItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 14, borderRadius: 16, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },
  billIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3F0FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  billName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  billDate: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500' },
  billAmount: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { color: '#94A3B8', fontSize: 14, fontWeight: '600', marginTop: 10 },
});