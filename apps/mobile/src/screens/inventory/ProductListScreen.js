import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getData } from '../../services/ApiService';
import { getProductsLocal } from '../../../db';
import { Ionicons } from '@expo/vector-icons';

const ProductListScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const localProducts = await getProductsLocal().catch(() => []);
      if (localProducts.length > 0) setProducts(localProducts);

      const res = await getData('/inventory').catch(() => null);
      const cloudProducts = res?.products || res?.data?.products || (Array.isArray(res) ? res : []);
      if (cloudProducts.length > 0) setProducts(cloudProducts);
    } catch (err) {
      console.error("Fetch Products Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(p => {
    if (!search.trim()) return true;
    const text = `${p.name} ${p.category || ''} ${p.brand || ''} ${p.sku || ''}`.toLowerCase();
    return search.toLowerCase().trim().split(/\s+/).every(term => text.includes(term));
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => navigation?.goBack?.() || navigation?.navigate?.('Dashboard')}
        >
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>Products ({filtered.length})</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#64748B" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, idx) => item.uuid || item._id || String(idx)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.row}>
                <Text style={styles.price}>₹{Number(item.sellingPrice || item.salePrice || item.price || 0).toLocaleString('en-IN')}</Text>
                <Text style={styles.stock}>Stock: {item.currentStock ?? item.stock ?? 0} {item.unit || 'pcs'}</Text>
              </View>
              {item.category ? <Text style={styles.category}>{item.category}</Text> : null}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No products found.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 44, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 1 },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, borderRadius: 12, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0', elevation: 1 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#0F172A', marginLeft: 8 },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 1,
  },
  name: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 15, fontWeight: '800', color: '#4F46E5' },
  stock: { fontSize: 13, color: '#059669', fontWeight: '700' },
  category: { fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: '500' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#94A3B8', fontSize: 14, fontWeight: '600' },
});

export default ProductListScreen;