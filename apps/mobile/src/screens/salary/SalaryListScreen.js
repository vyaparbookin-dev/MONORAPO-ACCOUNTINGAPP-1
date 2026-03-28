import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getData } from '../../services/ApiService';
import { useFocusEffect } from '@react-navigation/native';
import { getStaffLocal } from '../../../db'; // Offline DB

const SalaryListScreen = ({ navigation }) => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchStaffData();
    }, [])
  );

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      // 1. Offline First: Fetch staff from SQLite
      const localStaff = await getStaffLocal();
      setStaffList(localStaff || []);
      
    } catch (err) {
      console.error("Fetch staff error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staffList.filter(s => 
    (s.name || s.employeeName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.name}>{item.name || item.employeeName || 'Unknown Staff'}</Text>
          <Text style={styles.roleBadge}>{item.role?.toUpperCase() || 'STAFF'}</Text>
        </View>
        <View style={{alignItems: 'flex-end'}}>
           <Text style={styles.wageType}>{item.wageType === 'daily' ? 'Daily Wages' : 'Monthly'}</Text>
           <Text style={styles.wageAmount}>₹{item.salary || item.wageAmount || 0}</Text>
        </View>
      </View>

      <View style={styles.balanceRow}>
        <Text style={styles.balanceText}>
          Balance: <Text style={{color: (item.balance || 0) < 0 ? '#dc2626' : '#16a34a'}}>
            ₹{Math.abs(item.balance || 0)} {(item.balance || 0) < 0 ? '(Advance)' : '(Due)'}
          </Text>
        </Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#f59e0b'}]} onPress={() => navigation.navigate('MarkAttendance', { staffId: item.uuid || item._id, name: item.name })}>
          <Ionicons name="calendar-outline" size={16} color="#fff" />
          <Text style={styles.actionBtnText}>Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#2563eb'}]} onPress={() => navigation.navigate('AddSalary', { staffId: item.uuid || item._id, name: item.name })}>
          <Ionicons name="cash-outline" size={16} color="#fff" />
          <Text style={styles.actionBtnText}>Payment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#10b981'}]} onPress={() => navigation.navigate('StaffStatement', { staffId: item.uuid || item._id, name: item.name })}>
          <Ionicons name="document-text-outline" size={16} color="#fff" />
          <Text style={styles.actionBtnText}>Statement</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Staff & Salary</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddStaff')} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Staff</Text>
        </TouchableOpacity>
      </View>
      
      <TextInput
        style={styles.searchInput}
        placeholder="Search Staff..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredStaff}
          keyExtractor={(item, index) => item._id || String(index)}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No staff found. Please add a new staff member.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  addButton: { backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  searchInput: { backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 15 },
  card: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 10, 
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
      web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' }
    })
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  roleBadge: { fontSize: 11, color: '#2563eb', backgroundColor: '#dbeafe', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4, fontWeight: 'bold' },
  wageType: { fontSize: 13, color: '#6b7280' },
  wageAmount: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
  balanceRow: { backgroundColor: '#f9fafb', padding: 10, borderRadius: 8, marginBottom: 15 },
  balanceText: { fontSize: 14, fontWeight: '600', color: '#4b5563' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 6, marginHorizontal: 3 },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 5 },
  empty: { textAlign: 'center', marginTop: 50, color: '#888' }
});

export default SalaryListScreen;