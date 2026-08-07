// c:\Users\Lenovo1\Desktop\red-accounting-book\frontend\mobile\src\screens\warehouse\WarehouseListScreen.js

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getData } from '../../services/ApiService';
import { getWarehousesLocal } from '../../../db'; // Offline DB

const WarehouseListScreen = ({ navigation }) => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchWarehouses();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      
      // 1. Offline First: Fetch from SQLite
      const localWarehouses = await getWarehousesLocal().catch(() => []);
      if (localWarehouses && localWarehouses.length > 0) {
        setWarehouses(localWarehouses);
        setLoading(false);
      }
      
      // 2. Background Sync
      const res = await getData('/warehouse').catch(() => null);
      if (res) {
        setWarehouses(res.data?.warehouses || res.data?.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWarehouses();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.capacity}>{item.capacity ? `${item.capacity} sq ft` : ''}</Text>
      </View>
      <Text style={styles.location}>{item.location}</Text>
      {item.manager ? <Text style={styles.manager}>Manager: {item.manager}</Text> : null}
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#d97706" style={{ marginTop: 20 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Warehouses</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddWarehouse')}>
          <Ionicons name="add-circle" size={30} color="#d97706" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={warehouses}
        keyExtractor={item => item.uuid || item._id || Math.random().toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#d97706']} />}
        ListEmptyComponent={<Text style={styles.empty}>No warehouses found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  card: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 10, 
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41 },
      android: { elevation: 2 },
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.2)' }
    })
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  capacity: { fontSize: 14, color: '#d97706', fontWeight: 'bold' },
  location: { fontSize: 14, color: '#666', marginBottom: 5 },
  manager: { fontSize: 12, color: '#888', fontStyle: 'italic' },
  empty: { textAlign: 'center', marginTop: 50, color: '#888' }
});

export default WarehouseListScreen;
