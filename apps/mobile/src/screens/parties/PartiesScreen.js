import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  RefreshControl,
  Linking,
  Platform
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getData } from '../../services/ApiService';
import { getPartiesLocal } from '../../../db';

export default function PartiesScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('All');
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchParties = async () => {
    try {
      const localParties = await getPartiesLocal().catch(() => []);
      if (localParties && localParties.length > 0) {
        setParties(localParties);
        setLoading(false);
      }

      const res = await getData('/party').catch(() => null);
      if (res) {
        setParties(res.data?.parties || (Array.isArray(res.data) ? res.data : []));
      }
    } catch (err) {
      console.error("Error fetching parties:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchParties(); }, []));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchParties();
    setRefreshing(false);
  }, []);

  const handleWhatsAppRemind = (party) => {
    const bal = party.balance || party.currentBalance || 0;
    const phone = party.mobileNumber || party.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = `Namaste ${party.name}, this is a gentle reminder regarding your outstanding balance of ₹${bal.toLocaleString('en-IN')} with Ganesh Hardware. Please let us know if you need any assistance with payment.`;
    const url = `whatsapp://send?phone=${cleanPhone ? (cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone) : ''}&text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      alert("WhatsApp is not installed on this device.");
    });
  };

  const toCollectCount = parties.filter(p => (p.partyType === 'customer' || p.partyType === 'both') && (p.balance || p.currentBalance || 0) > 0).length;
  const toPayCount = parties.filter(p => (p.partyType === 'supplier' || p.partyType === 'both') && (p.balance || p.currentBalance || 0) > 0).length;

  const filteredParties = parties.filter(item => {
    const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (item.mobileNumber || '').includes(searchQuery);
    const bal = item.balance || item.currentBalance || 0;
    const isToCollect = (item.partyType === 'customer' || item.partyType === 'both') && bal > 0;
    const isToPay = (item.partyType === 'supplier' || item.partyType === 'both') && bal > 0;

    if (!matchesSearch) return false;
    if (activeTab === 'To Collect' && !isToCollect) return false;
    if (activeTab === 'To Pay' && !isToPay) return false;
    return true;
  });

  const renderParty = ({ item }) => {
    const bal = Number(item.balance || item.currentBalance || 0);
    const isToCollect = (item.partyType === 'customer' || item.partyType === 'both') && bal > 0;
    const isToPay = (item.partyType === 'supplier' || item.partyType === 'both') && bal > 0;
    const amountStr = bal.toLocaleString('en-IN');
    const displayType = item.partyType ? item.partyType.charAt(0).toUpperCase() + item.partyType.slice(1) : 'Customer';

    return (
      <TouchableOpacity 
        style={styles.partyCard}
        onPress={() => navigation.navigate('PartyDetail', { partyId: item._id || item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.partyInfo}>
          <View style={[styles.avatar, { backgroundColor: isToCollect ? '#ECFDF5' : (isToPay ? '#FFF1F2' : '#EEF2FF') }]}>
            <Text style={[styles.avatarText, { color: isToCollect ? '#059669' : (isToPay ? '#E11D48' : '#4F46E5') }]}>
              {(item.name || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.partyName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.partyMeta}>
              {displayType} {item.mobileNumber ? `• ${item.mobileNumber}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.amountSection}>
          <Text style={[styles.amountText, { color: isToCollect ? '#059669' : (isToPay ? '#DC2626' : '#64748B') }]}>
            ₹ {amountStr}
          </Text>
          <Text style={styles.amountSubtext}>
            {isToCollect ? 'To Collect ⬇' : (isToPay ? 'To Pay ⬆' : 'Settled')}
          </Text>
          
          {isToCollect && (
            <TouchableOpacity style={styles.whatsappBtn} onPress={() => handleWhatsAppRemind(item)}>
              <FontAwesome5 name="whatsapp" size={12} color="#059669" />
              <Text style={styles.whatsappText}>Remind</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Parties & Khata</Text>
          <Text style={styles.headerSubtitle}>{parties.length} Total Parties</Text>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput 
            placeholder="Search party by name or phone..." 
            style={styles.searchInput} 
            placeholderTextColor="#94A3B8" 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.quickActionRow}>
        <TouchableOpacity 
          style={[styles.paymentActionBtn, styles.paymentInBtn]}
          onPress={() => navigation.navigate('Billing', { screen: 'CreateBill' })}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-down-circle" size={20} color="#059669" />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.paymentActionTitle}>+ Payment In</Text>
            <Text style={styles.paymentActionSub}>रुपये प्राप्त किए</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.paymentActionBtn, styles.paymentOutBtn]}
          onPress={() => navigation.navigate('Inventory', { screen: 'PurchaseEntry' })}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-up-circle" size={20} color="#DC2626" />
          <View style={{ marginLeft: 8 }}>
            <Text style={[styles.paymentActionTitle, { color: '#DC2626' }]}>- Payment Out</Text>
            <Text style={styles.paymentActionSub}>रुपये दिए</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        {[
          { id: 'All', label: 'All Parties', count: parties.length },
          { id: 'To Collect', label: 'To Collect', count: toCollectCount },
          { id: 'To Pay', label: 'To Pay', count: toPayCount },
        ].map(tab => (
          <TouchableOpacity 
            key={tab.id} 
            onPress={() => setActiveTab(tab.id)} 
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="small" color="#6366F1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredParties}
          keyExtractor={item => item._id || item.id || String(Math.random())}
          renderItem={renderParty}
          contentContainerStyle={{ padding: 14, paddingBottom: 110 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={44} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Parties Found</Text>
              <Text style={styles.emptySub}>Add customers and suppliers to track khata and udhar</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={styles.floatingAddBtn} 
        onPress={() => navigation.navigate('CreateParty')}
        activeOpacity={0.85}
      >
        <Ionicons name="person-add" size={18} color="#FFF" />
        <Text style={styles.floatingAddText}>+ Add Party</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  header: { 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 16, 
    paddingTop: Platform.OS === 'ios' ? 44 : 12, 
    paddingBottom: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitle: { 
    color: '#0F172A', 
    fontSize: 18, 
    fontWeight: '800' 
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  searchBar: { 
    flexDirection: 'row', 
    backgroundColor: '#F1F5F9', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    alignItems: 'center', 
    height: 42 
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 8, 
    fontSize: 14,
    color: '#0F172A',
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  paymentActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  paymentInBtn: {
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  paymentOutBtn: {
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
  },
  paymentActionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  paymentActionSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  tabsContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 14, 
    paddingTop: 12,
    gap: 8,
  },
  tab: { 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 10, 
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeTab: { 
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  tabText: { 
    color: '#64748B', 
    fontWeight: '700', 
    fontSize: 12 
  },
  activeTabText: { 
    color: '#FFFFFF' 
  },
  partyCard: { 
    backgroundColor: '#FFFFFF', 
    padding: 12, 
    borderRadius: 14, 
    marginBottom: 8, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  partyInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  avatar: { 
    width: 38, 
    height: 38, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 10 
  },
  avatarText: { 
    fontWeight: '800', 
    fontSize: 16 
  },
  partyName: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#1E293B', 
    marginBottom: 2 
  },
  partyMeta: { 
    fontSize: 11, 
    color: '#64748B',
    fontWeight: '500',
  },
  amountSection: { 
    alignItems: 'flex-end' 
  },
  amountText: { 
    fontSize: 15, 
    fontWeight: '800' 
  },
  amountSubtext: { 
    fontSize: 10, 
    color: '#94A3B8', 
    marginBottom: 4,
    fontWeight: '600',
  },
  whatsappBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#ECFDF5', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 6, 
    borderWidth: 1, 
    borderColor: '#A7F3D0' 
  },
  whatsappText: { 
    color: '#059669', 
    fontSize: 10, 
    fontWeight: '700', 
    marginLeft: 4 
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  floatingAddBtn: { 
    position: 'absolute', 
    bottom: 24, 
    right: 16, 
    backgroundColor: '#6366F1', 
    flexDirection: 'row', 
    paddingHorizontal: 18, 
    height: 46, 
    borderRadius: 23, 
    alignItems: 'center', 
    elevation: 4,
    shadowColor: '#6366F1',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  floatingAddText: { 
    color: '#FFF', 
    fontWeight: '700', 
    marginLeft: 6,
    fontSize: 13,
  }
});