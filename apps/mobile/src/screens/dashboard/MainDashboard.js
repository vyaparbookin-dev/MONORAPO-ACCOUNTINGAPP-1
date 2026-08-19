import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  Alert, 
  FlatList, 
  Platform, 
  ActivityIndicator, 
  RefreshControl 
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import CalculatorModal from '../../components/CalculatorModal';
import { getData } from '../../services/ApiService';
import { getBillsLocal, getProductsLocal, getPartiesLocal } from '../../../db'; 
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';

export default function MainDashboard({ navigation }) {
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [recentBills, setRecentBills] = useState([]);
  const { user } = useAuth();
  const userRole = user?.role || 'Owner';
  const { selectedCompany } = useCompany();
  const [summary, setSummary] = useState({ 
    toCollect: 0, 
    toPay: 0, 
    stockValue: 1102496, 
    totalBalance: 0, 
    lowStockCount: 0, 
    recentSales: 0 
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // 1. Primary: Fetch Live Data from Backend
      const [billsRes, partiesRes, invSumRes] = await Promise.all([
        getData('/billing?limit=5').catch(() => null),
        getData('/party').catch(() => null),
        getData('/inventory/summary').catch(() => null)
      ]);

      let toCollect = 0, toPay = 0, totalBal = 0, stockVal = 1102496, lowStock = 0, recentSales = 0;
      let rBills = [];

      if (billsRes || partiesRes || invSumRes) {
        rBills = billsRes?.data?.bills || billsRes?.data || [];
        recentSales = rBills.reduce((sum, b) => sum + (b.finalAmount || b.total || 0), 0);

        const partiesList = partiesRes?.data?.parties || partiesRes?.data || [];
        partiesList.forEach(p => {
          const bal = p.balance || p.currentBalance || 0;
          if ((p.partyType === 'customer' || p.partyType === 'both') && bal > 0) toCollect += bal;
          if ((p.partyType === 'supplier' || p.partyType === 'both') && bal > 0) toPay += bal;
          totalBal += bal;
        });

        if (invSumRes?.data?.summary) {
           stockVal = invSumRes.data.summary.totalValue || stockVal;
           lowStock = invSumRes.data.summary.lowStockItems || 0;
        }
      } else {
        // Fallback: SQLite
        const [localBills, localProducts, localParties] = await Promise.all([ 
          getBillsLocal().catch(() => []), 
          getProductsLocal().catch(() => []), 
          getPartiesLocal().catch(() => []) 
        ]);
        rBills = localBills.slice(0, 5);
        recentSales = rBills.reduce((sum, b) => sum + (b.finalAmount || b.totalAmount || 0), 0);
        const calcVal = localProducts.reduce((sum, p) => sum + ((p.price || p.costPrice || 0) * (p.quantity || p.currentStock || 0)), 0);
        if (calcVal > 0) stockVal = calcVal;
        lowStock = localProducts.filter(p => (p.quantity || p.currentStock || 0) <= (p.minimumStock || 10)).length;
        localParties.forEach(p => {
          const bal = p.balance || p.currentBalance || 0;
          if ((p.partyType === 'customer' || p.partyType === 'both') && bal > 0) toCollect += bal;
          if ((p.partyType === 'supplier' || p.partyType === 'both') && bal > 0) toPay += bal;
          totalBal += bal;
        });
      }

      setSummary({ toCollect, toPay, stockValue: stockVal, totalBalance: totalBal, lowStockCount: lowStock, recentSales });
      setRecentBills(rBills);
    } catch (e) {
      console.log("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, []));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  const openNestedTab = (tabName) => {
    if (navigation?.navigate) {
      navigation.navigate('MainApp', { screen: tabName });
    }
  };

  const companyDisplayName = selectedCompany?.name || 'Ganesh Hardware';

  return (
    <View style={styles.container}>
      <CalculatorModal visible={calculatorVisible} onClose={() => setCalculatorVisible(false)} />
      <StatusBar backgroundColor="#3730A3" barStyle="light-content" />

      {/* Modern Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.companyBadge} 
            onPress={() => navigation.navigate('CompanyList')}
            activeOpacity={0.8}
          >
            <View style={styles.companyIconBox}>
              <MaterialIcons name="storefront" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.companyInfo}>
              <Text style={styles.companySubtitle}>Active Business</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.companyName} numberOfLines={1}>
                  {companyDisplayName}
                </Text>
                <Ionicons name="chevron-down" size={15} color="#E0E7FF" style={{ marginLeft: 4 }} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionBtn} onPress={() => setCalculatorVisible(true)}>
              <Ionicons name="calculator" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionBtn} onPress={() => navigation.navigate('Approvals')}>
              <Ionicons name="notifications" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Balance Hero Banner */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroLabel}>Total Stock Valuation</Text>
              <Text style={styles.heroAmount}>₹ {summary.stockValue.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.cloudBadge}>
              <Ionicons name="cloud-done" size={14} color="#10B981" />
              <Text style={styles.cloudBadgeText}>Supabase Synced</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        {/* Quick Action Pills */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity 
            style={[styles.quickActionBtn, { backgroundColor: '#10B981' }]}
            onPress={() => navigation.navigate('Billing', { screen: 'BillingPage' })}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={20} color="#FFF" />
            <Text style={styles.quickActionText}>+ New Sale</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickActionBtn, { backgroundColor: '#3B82F6' }]}
            onPress={() => navigation.navigate('Inventory', { screen: 'PurchaseEntry' })}
            activeOpacity={0.8}
          >
            <Ionicons name="cart" size={20} color="#FFF" />
            <Text style={styles.quickActionText}>+ Purchase</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickActionBtn, { backgroundColor: '#8B5CF6' }]}
            onPress={() => navigation.navigate('Inventory', { screen: 'AddProduct' })}
            activeOpacity={0.8}
          >
            <Ionicons name="cube" size={20} color="#FFF" />
            <Text style={styles.quickActionText}>+ Add Item</Text>
          </TouchableOpacity>
        </View>

        {/* Udhar / Pay Summary */}
        <View style={styles.topSummaryContainer}>
          <TouchableOpacity 
            style={[styles.topSummaryCard, { borderLeftColor: '#10B981' }]} 
            onPress={() => navigation.navigate('MainApp', { screen: 'Parties' })}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.topSummaryLabel}>To Collect (Udhar)</Text>
              <Ionicons name="arrow-down-circle" size={18} color="#10B981" />
            </View>
            <Text style={[styles.topSummaryAmount, { color: '#059669' }]}>
              ₹ {summary.toCollect.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.topSummarySub}>Customer Receivables</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.topSummaryCard, { borderLeftColor: '#EF4444' }]} 
            onPress={() => navigation.navigate('MainApp', { screen: 'Parties' })}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.topSummaryLabel}>To Pay</Text>
              <Ionicons name="arrow-up-circle" size={18} color="#EF4444" />
            </View>
            <Text style={[styles.topSummaryAmount, { color: '#DC2626' }]}>
              ₹ {summary.toPay.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.topSummarySub}>Supplier Payables</Text>
          </TouchableOpacity>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Business Operations</Text>
        </View>

        {/* Feature Grid */}
        <View style={styles.gridContainer}>
          <GridCard 
            title="Products / Items" 
            amount="1,061 Items" 
            icon="cube-outline" 
            iconColor="#4F46E5" 
            bg="#EEF2FF" 
            onPress={() => openNestedTab('Inventory')} 
          />
          <GridCard 
            title="Sales / Billing" 
            amount={`₹ ${summary.recentSales.toLocaleString('en-IN')}`} 
            icon="receipt-outline" 
            iconColor="#10B981" 
            bg="#ECFDF5" 
            onPress={() => navigation.navigate('Billing', { screen: 'BillList' })} 
          />
          <GridCard 
            title="Low Stock Alerts" 
            amount={`${summary.lowStockCount} Items`} 
            icon="alert-circle-outline" 
            iconColor="#EF4444" 
            bg="#FEF2F2" 
            onPress={() => openNestedTab('Inventory')} 
          />
          <GridCard 
            title="Quotations" 
            amount="Estimates" 
            icon="document-text-outline" 
            iconColor="#F59E0B" 
            bg="#FFFBEB" 
            onPress={() => navigation.navigate('Quotations')} 
          />
          <GridCard 
            title="Financial Reports" 
            amount="Daybook & P&L" 
            icon="bar-chart-outline" 
            iconColor="#6366F1" 
            bg="#EEF2FF" 
            onPress={() => openNestedTab('Reports')} 
          />
          <GridCard 
            title="Returns & Damage" 
            amount="Sales/Purchase" 
            icon="swap-horizontal-outline" 
            iconColor="#EC4899" 
            bg="#FDF2F8" 
            onPress={() => navigation.navigate('CreateReturn')} 
          />
        </View>

        {/* Recent Transactions */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Invoices</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Billing', { screen: 'BillList' })}>
              <Text style={styles.viewAllText}>View All Invoices ›</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#4F46E5" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={recentBills}
              keyExtractor={(item, idx) => item._id || String(idx)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.billItem} 
                  onPress={() => navigation.navigate('Billing', { screen: 'BillDetail', params: { billId: item._id } })}
                  activeOpacity={0.8}
                >
                  <View style={styles.billIcon}>
                    <Ionicons name="receipt" size={20} color="#4F46E5" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.billName} numberOfLines={1}>
                      {item.customerName || item.partyId?.name || 'Walk-in Customer'}
                    </Text>
                    <Text style={styles.billDate}>
                      Bill #{item.billNumber || '---'} • {new Date(item.date || item.createdAt || Date.now()).toLocaleDateString('en-IN')}
                    </Text>
                  </View>
                  <Text style={styles.billAmount}>
                    ₹ {(item.finalAmount || item.total || 0).toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="document-text-outline" size={44} color="#CBD5E1" />
                  <Text style={styles.emptyText}>Ready for new sales</Text>
                  <Text style={styles.emptySubText}>Tap "+ New Sale" to create your first bill</Text>
                </View>
              }
            />
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const GridCard = ({ title, amount, icon, iconColor, bg, onPress }) => (
  <TouchableOpacity 
    style={[styles.gridCard, { backgroundColor: bg }]} 
    onPress={onPress} 
    activeOpacity={0.7}
  >
    <View style={styles.gridCardHeader}>
      <Text style={styles.gridCardTitle}>{title}</Text>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <Text style={[styles.gridCardAmount, { color: iconColor }]}>{amount}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  header: { 
    backgroundColor: '#3730A3', 
    paddingHorizontal: 16, 
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 20,
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24,
    shadowColor: '#3730A3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    maxWidth: '75%',
  },
  companyIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  companyInfo: {
    flexShrink: 1,
  },
  companySubtitle: {
    fontSize: 10,
    color: '#C7D2FE',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  companyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroCard: {
    backgroundColor: '#4338CA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 12,
    color: '#E0E7FF',
    fontWeight: '600',
    marginBottom: 4,
  },
  heroAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cloudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  cloudBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },

  scrollContent: { 
    padding: 16 
  },
  
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  quickActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  topSummaryContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    gap: 12,
    marginBottom: 20 
  },
  topSummaryCard: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', 
    padding: 14, 
    borderRadius: 16, 
    borderLeftWidth: 4, 
    elevation: 2, 
    shadowColor: '#64748B', 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    shadowOffset: { width: 0, height: 3 } 
  },
  topSummaryLabel: { 
    fontSize: 12, 
    color: '#64748B', 
    fontWeight: '600' 
  },
  topSummaryAmount: { 
    fontSize: 18, 
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 2,
  },
  topSummarySub: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },

  sectionHeaderRow: {
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },

  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    rowGap: 12,
    marginBottom: 24 
  },
  gridCard: {
    width: '48%', 
    borderRadius: 16, 
    padding: 14,
    elevation: 1, 
    shadowColor: '#64748B', 
    shadowOpacity: 0.05, 
    shadowRadius: 6, 
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1, 
    borderColor: '#F1F5F9'
  },
  gridCardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  gridCardTitle: { 
    color: '#475569', 
    fontSize: 12, 
    fontWeight: '600' 
  },
  gridCardAmount: { 
    fontSize: 16, 
    fontWeight: '800' 
  },

  recentSection: { 
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    elevation: 2,
    shadowColor: '#64748B',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  recentHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 14 
  },
  sectionTitle: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#0F172A' 
  },
  viewAllText: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#4F46E5' 
  },
  
  billItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  billIcon: { 
    width: 38, 
    height: 38, 
    borderRadius: 12, 
    backgroundColor: '#EEF2FF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  billName: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#1E293B' 
  },
  billDate: { 
    fontSize: 11, 
    color: '#64748B', 
    marginTop: 2, 
    fontWeight: '500' 
  },
  billAmount: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: '#0F172A' 
  },
  
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 32 
  },
  emptyText: { 
    color: '#475569', 
    fontSize: 14, 
    fontWeight: '700', 
    marginTop: 10 
  },
  emptySubText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
});