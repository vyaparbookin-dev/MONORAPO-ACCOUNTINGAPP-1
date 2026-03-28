import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../../services/Api';
import { getCouponsLocal } from '../../../db'; // Offline DB

const CouponListScreen = ({ navigation }) => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchCoupons);
    return unsubscribe;
  }, [navigation]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      // 1. Offline First: Fetch from SQLite
      const localCoupons = await getCouponsLocal();
      setCoupons(localCoupons || []);

      // const res = await API.get('/coupons');
      // setCoupons(res.data?.coupons || res.data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch coupons.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.name}>{item.code}</Text>
        <Text style={styles.details}>Discount: {item.discountPercentage}%</Text>
        <Text style={styles.details}>Expires: {new Date(item.expiryDate).toLocaleDateString()}</Text>
      </View>
      <Ionicons name="pricetag-outline" size={24} color="#007bff" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Coupons</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddCoupon')}>
          <Ionicons name="add-circle" size={30} color="#007bff" />
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} /> : (
        <FlatList
          data={coupons}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No coupons found.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  card: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
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
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  details: { color: '#666', marginTop: 5, fontSize: 14 },
  empty: { textAlign: 'center', marginTop: 50, color: '#888' }
});

export default CouponListScreen;