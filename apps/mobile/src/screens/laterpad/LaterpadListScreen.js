// c:\Users\Lenovo1\Desktop\red-accounting-book\frontend\mobile\src\screens\laterpad\LaterpadListScreen.js

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../../services/Api';

const LaterpadListScreen = ({ navigation }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchEntries();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await API.get('/laterpad');
      setEntries(res.data?.entries || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markPaid = async (id) => {
    try {
      await API.put(`/laterpad/${id}/paid`);
      Alert.alert('Success', 'Marked as Paid');
      fetchEntries();
    } catch (err) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.customerName}</Text>
        <Text style={styles.amount}>₹{item.amount}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.date}>{new Date(item.date || item.createdAt).toLocaleDateString()}</Text>
        {item.status === 'pending' ? (
          <TouchableOpacity onPress={() => markPaid(item._id)} style={styles.payBtn}>
            <Text style={styles.payText}>Mark Paid</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.paidText}>PAID</Text>
        )}
      </View>
      {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 20 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Laterpad (Udhar)</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddLaterpad')}>
          <Ionicons name="add-circle" size={30} color="#f59e0b" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={entries}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No pending payments.</Text>}
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#f59e0b' },
  date: { fontSize: 12, color: '#888' },
  payBtn: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  payText: { color: '#16a34a', fontSize: 12, fontWeight: 'bold' },
  paidText: { color: '#16a34a', fontSize: 12, fontWeight: 'bold' },
  notes: { fontSize: 12, color: '#666', marginTop: 5 },
  empty: { textAlign: 'center', marginTop: 50, color: '#888' }
});

export default LaterpadListScreen;
