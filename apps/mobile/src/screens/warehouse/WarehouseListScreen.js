// c:\Users\Lenovo1\Desktop\red-accounting-book\frontend\mobile\src\screens\warehouse\WarehouseListScreen.js

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getData } from '../../services/ApiService';
import { getWarehousesLocal } from '../../../db'; // Offline DB

const WarehouseListScreen = ({ navigation }) => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const localWarehouses = await getWarehousesLocal();
      setWarehouses(localWarehouses || []);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
      ios: {     },
      android: { ...Platform.select({
      ios: {     },
      android: { elevation: 2 },
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.2)' }
    }), },
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
