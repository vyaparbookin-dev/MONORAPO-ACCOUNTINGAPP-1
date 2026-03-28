import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Platform } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getData } from '../../services/ApiService';
import WhatsappSender from '../../components/WhatsappSender';
import { getBillsLocal } from '../../../db'; // Offline DB

const BillListScreen = () => {
  const navigation = useNavigation();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchBills = async (pageNumber = 1, shouldRefresh = false) => {
    try {
      if (pageNumber === 1 && !shouldRefresh) setLoading(true);
      if (pageNumber > 1) setLoadingMore(true);

      try {
        // Try fetching from API first
        const res = await getData(`/billing?page=${pageNumber}&limit=20`);
        const apiBills = res.data?.bills || [];
        
        setBills(prev => shouldRefresh ? apiBills : [...prev, ...apiBills]);
        setHasMore(res.data?.pagination?.totalPages > pageNumber);
        setPage(pageNumber);
      } catch (apiError) {
        console.log("API fetch failed, falling back to local DB", apiError.message);
        // Fallback to local DB if API fails
        const localBills = await getBillsLocal();
        setBills(localBills || []);
        setHasMore(false); // Offline fetch loads all
      }
    } catch (error) {
      console.error("Error fetching bills:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchBills();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    fetchBills(1, true);
  }, []);

  const loadMoreBills = () => {
    if (hasMore && !loadingMore && !loading) {
      fetchBills(page + 1);
    }
  };

  const filteredBills = bills.filter(bill => 
    (bill.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) || bill.partyId?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (bill.billNumber?.toString().toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return { bg: '#dcfce7', text: '#166534', label: 'Cash (Paid)' };
      case 'issued': return { bg: '#dbeafe', text: '#1e40af', label: 'Credit (Udhar)' };
      case 'draft': return { bg: '#f3f4f6', text: '#374151', label: 'Draft' };
      case 'cancelled': return { bg: '#fee2e2', text: '#991b1b', label: 'Cancelled' };
      default: return { bg: '#f3f4f6', text: '#374151', label: status || 'Issued' };
    }
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStatusColor(item.status);
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('BillDetail', { billId: item.uuid || item._id })}
      >
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.billNumber}>#{item.billNumber}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
            </View>
          </View>
          <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.customerName}>{item.customerName || item.partyId?.name || 'N/A'}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }}>
          <WhatsappSender bill={item} />
          <Text style={styles.amount}>₹{(item.finalAmount || item.totalAmount || item.total || 0).toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filteredBills}
          keyExtractor={(item) => item.uuid || item._id || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 15 }}
          onEndReached={loadMoreBills}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color="#2563eb" />
              </View>
            ) : null
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
          ListHeaderComponent={
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search invoices or customers..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          }
          ListEmptyComponent={<Text style={styles.emptyText}>No invoices found.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  searchContainer: { 
    marginBottom: 15, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    paddingHorizontal: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  card: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#312e81', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  billNumber: { fontSize: 17, fontWeight: '800', color: '#111827', letterSpacing: 0.5 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  date: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  customerName: { fontSize: 16, color: '#4b5563', marginVertical: 4, fontWeight: '500' },
  amount: { fontSize: 22, fontWeight: '900', color: '#4338ca', textAlign: 'right', marginTop: 5 },
  emptyText: { textAlign: 'center', marginTop: 60, color: '#9ca3af', fontSize: 16, fontWeight: '500' },
});

export default BillListScreen;