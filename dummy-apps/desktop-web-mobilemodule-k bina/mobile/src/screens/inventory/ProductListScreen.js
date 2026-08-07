import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getData } from '../../services/ApiService';
import { getProductsLocal } from '../../../db'; // Offline Database

const ProductListScreen = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // 1. Offline First: Local SQLite Database se products fetch karein
      const localProducts = await getProductsLocal();
      setProducts(localProducts || []);
      
      // (Baad me hum yahan background sync lagaenge)
      // const res = await getData('/inventory');
      // setProducts(res.data?.products || (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      console.error("Fetch Products Error:", err);
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />;
  if (error) return <Text>Error: {error}</Text>;

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.uuid || item._id || Math.random().toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.details}>Price: ₹{item.price || item.sellingPrice || 0}</Text>
            <Text style={styles.details}>Stock: {item.quantity || item.currentStock || 0} {item.unit || 'pcs'}</Text>
            <Text style={styles.details}>Category: {item.category || 'N/A'}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No products found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41 },
      android: { elevation: 2 },
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.2)' }
    })
  },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  details: { fontSize: 14, color: '#666', marginBottom: 2 },
  emptyText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#888' },
});

export default ProductListScreen;