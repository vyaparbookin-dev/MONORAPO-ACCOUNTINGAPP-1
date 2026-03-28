import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { getData } from '../../services/ApiService';
import { Ionicons } from '@expo/vector-icons';

const InventoryScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchInventory();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchInventory = async () => {
    try {
      const res = await getData('/inventory');
      // Adjust mapping based on exact backend response format (e.g. res.data.items or res.data)
      setItems(res.data?.items || res.data?.products || (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
  }, []);

  const filteredItems = items.filter(i => i.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.iconBg}>
        <Ionicons name="cube" size={24} color="#4338ca" />
      </View>
      <View style={{ flex: 1, paddingHorizontal: 12 }}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemStock}>Stock: <Text style={{ fontWeight: 'bold', color: (item.stock || item.quantity) > 0 ? '#16a34a' : '#dc2626' }}>{item.stock || item.quantity || 0}</Text></Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.price}>₹{item.price || item.sellingPrice || 0}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
          ListHeaderComponent={
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Inventory</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddProduct')}>
                  <Text style={styles.addButtonText}>+ New Item</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                <TextInput 
                  style={styles.searchInput} 
                  placeholder="Search items..." 
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </>
          }
          ListEmptyComponent={<Text style={styles.emptyText}>No items found in inventory.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 24, fontWeight: '900', color: '#111827' },
  addButton: { backgroundColor: '#4338ca', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, shadowColor: '#4338ca', shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  searchContainer: { margin: 15, marginBottom: 5, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#1f2937' },
  list: { padding: 15 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#312e81', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 4 },
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.2)' }
    }),
  },
  iconBg: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 17, fontWeight: '700', color: '#1f2937' },
  itemStock: { fontSize: 13, color: '#6b7280', marginTop: 4, fontWeight: '500' },
  price: { fontSize: 18, fontWeight: '900', color: '#4338ca' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#9ca3af', fontSize: 16, fontWeight: '500' }
});

export default InventoryScreen;