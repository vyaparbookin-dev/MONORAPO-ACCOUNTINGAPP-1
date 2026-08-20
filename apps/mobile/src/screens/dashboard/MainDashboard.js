import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  FlatList, 
  Platform, 
  ActivityIndicator, 
  RefreshControl,
  Share,
  Modal
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import CalculatorModal from '../../components/CalculatorModal';
import { getData } from '../../services/ApiService';
import { getBillsLocal, getProductsLocal, getPartiesLocal } from '../../../db'; 
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';

export default function MainDashboard({ navigation }) {
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [referralModalVisible, setReferralModalVisible] = useState(false);
  const [ecosystemModalVisible, setEcosystemModalVisible] = useState(false);
  const [recentBills, setRecentBills] = useState([]);
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const [summary, setSummary] = useState({ 
    toCollect: 0, 
    toPay: 0, 
    stockValue: 1826505, 
    totalBalance: 0, 
    lowStockCount: 0, 
    recentSales: 0,
    todaySales: 0,
    todayCash: 0,
    todayCredit: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // 1. Primary: Fetch Live Data from Backend
      const [billsRes, partiesRes, invRes] = await Promise.all([
        getData('/billing?limit=10').catch(() => null),
        getData('/party').catch(() => null),
        getData('/inventory').catch(() => null)
      ]);

      let toCollect = 0, toPay = 0, totalBal = 0, stockVal = 1826505, lowStock = 0, recentSales = 0;
      let todaySales = 0, todayCash = 0, todayCredit = 0;
      let rBills = [];

      if (billsRes || partiesRes || invRes) {
        rBills = billsRes?.data?.bills || billsRes?.bills || billsRes?.data || [];
        recentSales = rBills.reduce((sum, b) => sum + (Number(b.finalAmount) || Number(b.total) || 0), 0);

        // Daily Breakdown
        const todayStr = new Date().toDateString();
        rBills.forEach(b => {
          const bDate = new Date(b.date || b.createdAt).toDateString();
          const amt = Number(b.finalAmount) || Number(b.total) || 0;
          if (bDate === todayStr) {
            todaySales += amt;
            if (b.paymentMode === 'cash' || b.paymentType === 'cash') todayCash += amt;
            else todayCredit += amt;
          }
        });

        const partiesList = partiesRes?.data?.parties || partiesRes?.parties || partiesRes?.data || [];
        partiesList.forEach(p => {
          const bal = Number(p.balance || p.currentBalance || 0);
          if ((p.partyType === 'customer' || p.partyType === 'both') && bal > 0) toCollect += bal;
          if ((p.partyType === 'supplier' || p.partyType === 'both') && bal > 0) toPay += bal;
          totalBal += bal;
        });

        const productList = invRes?.data?.products || invRes?.products || (Array.isArray(invRes) ? invRes : []);
        if (productList.length > 0) {
          stockVal = productList.reduce((acc, it) => {
            const s = Number(it.currentStock ?? it.stock ?? it.openingStock ?? 0);
            const p = Number(it.sellingPrice ?? it.price ?? 0);
            return acc + (s > 0 ? s * p : p);
          }, 0);
          lowStock = productList.filter(it => (Number(it.currentStock ?? it.stock ?? 0) <= (it.minimumStock || 10))).length;
        }
      } else {
        // Fallback: SQLite
        const [localBills, localProducts, localParties] = await Promise.all([ 
          getBillsLocal().catch(() => []), 
          getProductsLocal().catch(() => []), 
          getPartiesLocal().catch(() => []) 
        ]);
        rBills = localBills.slice(0, 10);
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

      setSummary({ 
        toCollect, 
        toPay, 
        stockValue: stockVal, 
        totalBalance: totalBal, 
        lowStockCount: lowStock, 
        recentSales,
        todaySales,
        todayCash,
        todayCredit
      });
      setRecentBills(rBills);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, []));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, []);

  const handleShareOnWhatsApp = (bill) => {
    try {
      const party = bill.customerName || bill.partyId?.name || 'Customer';
      const amt = bill.finalAmount || bill.total || 0;
      Share.share({
        message: `Dear ${party}, your invoice #${bill.billNumber || '001'} for ₹${amt} is generated by Ganesh Hardware. Thank you for doing business with us!`
      });
    } catch (err) {
      console.log("Share error:", err);
    }
  };

  const handleShareReferral = () => {
    const msg = `Namaste! Try Ganesh Hardware ERP & Accounting App for billing, GST reports, inventory and khata management. Use referral code GANESH-CASH-100 to get ₹100 Cash Tokens discount on your account! Download now: https://ganeshhardware.in`;
    Share.share({ message: msg });
  };

  const companyDisplayName = selectedCompany?.name || 'GANESH HARDWARE';

  return (
    <View style={styles.container}>
      <CalculatorModal visible={calculatorVisible} onClose={() => setCalculatorVisible(false)} />
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      {/* 1. TOP WHITE HEADER */}
      <View style={styles.topHeader}>
        <TouchableOpacity 
          style={styles.companySelector} 
          onPress={() => navigation.navigate('CompanyList')}
          activeOpacity={0.7}
        >
          <Text style={styles.companyTitle} numberOfLines={1}>
            {companyDisplayName.toUpperCase()}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#6366F1" style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        <View style={styles.topHeaderIcons}>
          {/* 1. Calculator */}
          <TouchableOpacity style={styles.iconBtn} onPress={() => setCalculatorVisible(true)}>
            <Ionicons name="calculator-outline" size={22} color="#475569" />
          </TouchableOpacity>

          {/* 2. Refer & Earn Cash Tokens (Gift Icon) */}
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#EEF2FF' }]} onPress={() => setReferralModalVisible(true)}>
            <Ionicons name="gift" size={22} color="#6366F1" />
          </TouchableOpacity>

          {/* 3. Multi-Platform Ecosystem Showcase (Device Icon) */}
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#ECFDF5' }]} onPress={() => setEcosystemModalVisible(true)}>
            <Ionicons name="tv-outline" size={22} color="#059669" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />}
      >
        {/* 2. TOP BANNER */}
        <View style={styles.promoBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTag}>Supabase Cloud & Offline POS Active</Text>
            <Text style={styles.promoHeadline}>Ganesh Hardware ERP v2.0 Live</Text>
          </View>
          <TouchableOpacity style={styles.promoBtn} onPress={() => navigation.navigate('MainApp', { screen: 'Items' })}>
            <Text style={styles.promoBtnText}>View Stock →</Text>
          </TouchableOpacity>
        </View>

        {/* 3. 2x3 METRICS GRID */}
        <View style={styles.metricsGrid}>
          {/* Row 1 */}
          <TouchableOpacity 
            style={[styles.metricCard, styles.toCollectCard]}
            onPress={() => navigation.navigate('MainApp', { screen: 'Parties' })}
            activeOpacity={0.8}
          >
            <View style={styles.metricCardHeader}>
              <Text style={styles.toCollectAmount}>₹ {summary.toCollect.toLocaleString('en-IN')}</Text>
              <Ionicons name="chevron-forward" size={16} color="#059669" />
            </View>
            <View style={styles.metricLabelRow}>
              <Text style={styles.toCollectLabel}>To Collect</Text>
              <Ionicons name="arrow-down" size={13} color="#059669" style={{ marginLeft: 3 }} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.metricCard, styles.toPayCard]}
            onPress={() => navigation.navigate('MainApp', { screen: 'Parties' })}
            activeOpacity={0.8}
          >
            <View style={styles.metricCardHeader}>
              <Text style={styles.toPayAmount}>₹ {summary.toPay.toLocaleString('en-IN')}</Text>
              <Ionicons name="chevron-forward" size={16} color="#E11D48" />
            </View>
            <View style={styles.metricLabelRow}>
              <Text style={styles.toPayLabel}>To Pay</Text>
              <Ionicons name="arrow-up" size={13} color="#E11D48" style={{ marginLeft: 3 }} />
            </View>
          </TouchableOpacity>

          {/* Row 2 */}
          <TouchableOpacity 
            style={styles.metricCard}
            onPress={() => navigation.navigate('MainApp', { screen: 'Items' })}
            activeOpacity={0.8}
          >
            <View style={styles.metricCardHeader}>
              <Text style={styles.neutralTitle}>Stock Value</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>
            <Text style={styles.neutralSubtitle}>
              ₹ {summary.stockValue > 0 ? (summary.stockValue / 100000).toFixed(2) + ' Lakhs' : '0'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.metricCard}
            onPress={() => navigation.navigate('Billing', { screen: 'BillList' })}
            activeOpacity={0.8}
          >
            <View style={styles.metricCardHeader}>
              <Text style={styles.neutralTitle}>₹ {summary.recentSales.toLocaleString('en-IN')}</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>
            <Text style={styles.neutralSubtitle}>This week's sale</Text>
          </TouchableOpacity>

          {/* Row 3 */}
          <TouchableOpacity 
            style={styles.metricCard}
            onPress={() => navigation.navigate('DayBook')}
            activeOpacity={0.8}
          >
            <View style={styles.metricCardHeader}>
              <Text style={styles.neutralTitle}>Total Balance</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>
            <Text style={styles.neutralSubtitle}>Cash + Bank Balance</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.metricCard}
            onPress={() => navigation.navigate('MainApp', { screen: 'Reports' })}
            activeOpacity={0.8}
          >
            <View style={styles.metricCardHeader}>
              <Text style={styles.neutralTitle}>Reports</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>
            <Text style={styles.neutralSubtitle}>Sales, Party, GST...</Text>
          </TouchableOpacity>
        </View>

        {/* 4. MULTI-DEVICE / CLOUD SYNC PROMPT */}
        <TouchableOpacity 
          style={styles.multiDeviceRow}
          onPress={() => navigation.navigate('FeatureControl')}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="shield-checkmark" size={18} color="#D97706" style={{ marginRight: 8 }} />
            <Text style={styles.multiDeviceText}>Multi-device Sync & Realtime Supabase Active</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#6366F1" />
        </TouchableOpacity>

        {/* 5. EOD DAILY SUMMARY WIDGET */}
        <View style={styles.eodCard}>
          <View style={styles.eodHeader}>
            <Text style={styles.eodTitle}>Today's Business Summary (EOD)</Text>
            <Text style={styles.eodDate}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
          </View>
          <View style={styles.eodRow}>
            <View style={styles.eodItem}>
              <Text style={styles.eodLabel}>Today's Sales</Text>
              <Text style={styles.eodVal}>₹ {summary.todaySales.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.eodDivider} />
            <View style={styles.eodItem}>
              <Text style={styles.eodLabel}>Cash Sales</Text>
              <Text style={[styles.eodVal, { color: '#059669' }]}>₹ {summary.todayCash.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.eodDivider} />
            <View style={styles.eodItem}>
              <Text style={styles.eodLabel}>Credit (Udhar)</Text>
              <Text style={[styles.eodVal, { color: '#DC2626' }]}>₹ {summary.todayCredit.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* 6. TRANSACTIONS SECTION HEADER */}
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>Transactions</Text>
          <View style={styles.filterPill}>
            <Ionicons name="calendar-outline" size={14} color="#6366F1" style={{ marginRight: 4 }} />
            <Text style={styles.filterPillText}>LAST 365 DAYS</Text>
          </View>
        </View>

        {/* 7. TRANSACTION LIST ITEMS */}
        {loading ? (
          <ActivityIndicator size="small" color="#6366F1" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={recentBills}
            keyExtractor={(item, idx) => item._id || String(idx)}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const partyName = item.customerName || item.partyId?.name || 'Walk-in Customer';
              const billNo = item.billNumber || item.invoiceNumber || '001';
              const dateStr = new Date(item.date || item.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
              const isUnpaid = item.paymentStatus === 'unpaid' || item.paymentStatus === 'pending' || item.status === 'unpaid';
              const finalAmt = (item.finalAmount || item.total || 0).toLocaleString('en-IN');

              return (
                <TouchableOpacity 
                  style={styles.transactionCard}
                  onPress={() => navigation.navigate('Billing', { screen: 'BillDetail', params: { billId: item._id } })}
                  activeOpacity={0.8}
                >
                  <View style={styles.txLeft}>
                    <Text style={styles.txPartyName} numberOfLines={1}>{partyName}</Text>
                    <Text style={styles.txMeta}>
                      Invoice #{billNo} • {dateStr} {isUnpaid ? '• Due' : '• Paid'}
                    </Text>
                  </View>

                  <View style={styles.txRight}>
                    <Text style={styles.txAmount}>₹ {finalAmt}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: isUnpaid ? '#FEE2E2' : '#ECFDF5' }]}>
                      <Text style={[styles.statusBadgeText, { color: isUnpaid ? '#DC2626' : '#059669' }]}>
                        {isUnpaid ? 'Unpaid' : 'Paid'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.shareIconBtn} onPress={() => handleShareBill(item)}>
                    <FontAwesome5 name="whatsapp" size={16} color="#059669" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={44} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Transactions Yet</Text>
                <Text style={styles.emptySub}>Tap "+ Bill / Invoice" below to create your first sale bill</Text>
              </View>
            }
          />
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* 8. FLOATING BOTTOM ACTION PILL BAR */}
      <View style={styles.floatingActionBar}>
        <TouchableOpacity 
          style={styles.receivedPaymentBtn}
          onPress={() => navigation.navigate('MainApp', { screen: 'Parties' })}
          activeOpacity={0.85}
        >
          <Text style={styles.receivedPaymentText}>Received Payment</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.centerPlusCircle}
          onPress={() => navigation.navigate('FastPos')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.billInvoiceBtn}
          onPress={() => navigation.navigate('Billing', { screen: 'BillingPage' })}
          activeOpacity={0.85}
        >
          <Text style={styles.billInvoiceText}>+ Bill / Invoice</Text>
        </TouchableOpacity>
      </View>

      {/* 9. REFER & EARN CASH TOKENS MODAL */}
      <Modal 
        visible={referralModalVisible} 
        animationType="fade" 
        transparent={true}
        onRequestClose={() => setReferralModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="gift" size={22} color="#6366F1" style={{ marginRight: 6 }} />
                <Text style={styles.modalTitle}>Refer & Earn Cash Tokens</Text>
              </View>
              <TouchableOpacity onPress={() => setReferralModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.referralBanner}>
              <Text style={styles.referralBannerTag}>EARN ₹100 PER REFERRAL</Text>
              <Text style={styles.referralBannerHeadline}>Share Ganesh Hardware App with your Merchant Friends</Text>
              <Text style={styles.referralBannerSub}>When a friend downloads and signs up, you both get ₹100 Cash Tokens to use as a direct discount on your next subscription renewal!</Text>
            </View>

            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
              <Text style={styles.codeVal}>GANESH-CASH-100</Text>
            </View>

            <TouchableOpacity 
              style={styles.whatsappShareBtn}
              onPress={handleShareReferral}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.whatsappShareText}>Share on WhatsApp & Earn ₹100</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 10. MULTI-PLATFORM ECOSYSTEM & FEATURES MODAL */}
      <Modal 
        visible={ecosystemModalVisible} 
        animationType="fade" 
        transparent={true}
        onRequestClose={() => setEcosystemModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="tv" size={22} color="#059669" style={{ marginRight: 6 }} />
                <Text style={styles.modalTitle}>Ganesh Hardware Ecosystem</Text>
              </View>
              <TouchableOpacity onPress={() => setEcosystemModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.earlyAccessBadge}>
                <Text style={styles.earlyAccessText}>✨ Multi-Device Live Sync Active (Early Access)</Text>
              </View>

              {/* 1. Mobile */}
              <View style={styles.ecosystemCard}>
                <View style={[styles.ecosystemIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="phone-portrait" size={22} color="#4F46E5" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ecosystemTitle}>📱 Android Mobile App</Text>
                  <Text style={styles.ecosystemDesc}>• Fast 1-tap billing & offline pos sale{'\n'}• 1-Click WhatsApp bill & PDF sharing{'\n'}• Barcode scanner & instant khata entry</Text>
                </View>
              </View>

              {/* 2. Desktop */}
              <View style={styles.ecosystemCard}>
                <View style={[styles.ecosystemIcon, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="laptop-outline" size={22} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ecosystemTitle}>💻 Windows Desktop App</Text>
                  <Text style={styles.ecosystemDesc}>• Wholesale high-speed billing with F1-F12 shortcuts{'\n'}• Thermal printer & barcode printer support{'\n'}• Bulk Excel import with zero lag</Text>
                </View>
              </View>

              {/* 3. Cloud Web */}
              <View style={styles.ecosystemCard}>
                <View style={[styles.ecosystemIcon, { backgroundColor: '#FFFBEB' }]}>
                  <Ionicons name="cloud-outline" size={22} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ecosystemTitle}>☁️ Cloud Web Dashboard</Text>
                  <Text style={styles.ecosystemDesc}>• 20+ GSTR & audit accounting reports{'\n'}• Multi-user roles (Admin, Cashier, Billing){'\n'}• Real-time stock valuation & inventory ledger</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.closeEcosystemBtn}
                onPress={() => setEcosystemModalVisible(false)}
              >
                <Text style={styles.closeEcosystemText}>Got It</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  companySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  companyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.3,
  },
  topHeaderIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },

  // Promo Banner
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FDF4FF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F5D0FE',
  },
  promoTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C026D3',
    textTransform: 'uppercase',
  },
  promoHeadline: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginTop: 2,
  },
  promoBtn: {
    backgroundColor: '#C026D3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  promoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // 2x3 Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toCollectCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  toPayCard: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  toCollectAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  toCollectLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  toPayAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E11D48',
  },
  toPayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  neutralTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  neutralSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },

  // Multi-device Prompt
  multiDeviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  multiDeviceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },

  // EOD Summary Card
  eodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  eodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  eodTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eodDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
  },
  eodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eodItem: {
    alignItems: 'center',
    flex: 1,
  },
  eodLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  eodVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },
  eodDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#F1F5F9',
  },

  // Transactions Header
  transactionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  transactionsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  filterPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366F1',
  },

  // Transaction Card
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  txLeft: {
    flex: 1,
  },
  txPartyName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  txMeta: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 3,
  },
  txRight: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  shareIconBtn: {
    padding: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },

  // Floating Bottom Action Bar
  floatingActionBar: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  receivedPaymentBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  receivedPaymentText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  centerPlusCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  billInvoiceBtn: {
    flex: 1,
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#6366F1',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  billInvoiceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Referral & Ecosystem Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  referralBanner: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  referralBannerTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
    marginBottom: 4,
  },
  referralBannerHeadline: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  referralBannerSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  codeBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  codeVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4F46E5',
    letterSpacing: 2,
  },
  whatsappShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 12,
  },
  whatsappShareText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // Ecosystem Modal Styles
  earlyAccessBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  earlyAccessText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  ecosystemCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  ecosystemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  ecosystemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  ecosystemDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  closeEcosystemBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  closeEcosystemText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});