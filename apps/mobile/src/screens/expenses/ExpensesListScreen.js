// c:\Users\Lenovo1\Desktop\red-accounting-book\frontend\mobile\src\screens\expenses\ExpansesListScreen.js

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../../services/Api';
import { getExpensesLocal } from '../../../db'; // Offline DB

const ExpansesListScreen = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchExpenses();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      
      // 1. Offline First: Fetch from SQLite
      const localExpenses = await getExpensesLocal();
      setExpenses(localExpenses || []);

      // const res = await API.get('/expance');
      // setExpenses(res.data?.expenses || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.amount}>-₹{item.amount}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
      {item.notes || item.description ? <Text style={styles.notes}>{item.notes || item.description}</Text> : null}
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#ef4444" style={{ marginTop: 20 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expenses</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddExpense')}>
          <Ionicons name="add-circle" size={30} color="#ef4444" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={expenses}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No expenses recorded.</Text>}
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
  title: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#ef4444' },
  category: { fontSize: 12, color: '#666', backgroundColor: '#eee', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  date: { fontSize: 12, color: '#888' },
  notes: { fontSize: 12, color: '#666', marginTop: 5, fontStyle: 'italic' },
  empty: { textAlign: 'center', marginTop: 50, color: '#888' }
});

export default ExpansesListScreen;