import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { getData, postData } from '../../services/ApiService';
import { getSettingLocal, saveSettingLocal } from '../../../db'; // Offline DB

const SettingsScreen = ({ navigation }) => {
  const { logout, user } = useContext(AuthContext);
  const [upiId, setUpiId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // 1. Offline First: Fetch from SQLite
      const localUpi = await getSettingLocal('upiId');
      if (localUpi) setUpiId(localUpi);

    } catch (error) {
      console.error("Failed to load settings", error);
    }
  };

  const handleSaveUpi = async () => {
    setSaving(true);
    try {
      // 1. Offline First: Save to SQLite
      const localResult = await saveSettingLocal('upiId', upiId);
      if (!localResult.success) throw new Error("Failed to save locally");

      Alert.alert("Success", "UPI ID saved successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to save UPI ID.");
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    { title: 'Company List', screen: 'CompanyList' },
    { title: 'Warehouses', screen: 'WarehouseList' },
    { title: 'Staff & Salary', screen: 'SalaryList' },
    { title: 'Cloud Sync', screen: 'CloudSync' },
    { title: 'Security Logs', screen: 'SecurityLogs' },
    { title: 'Profile', screen: 'Profile' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Logged in as {user?.name || 'User'}</Text>
      </View>

      {/* Merchant UPI ID Section */}
      <View style={styles.upiCard}>
        <Text style={styles.upiLabel}>Merchant UPI ID (For QR Payments)</Text>
        <TextInput
          style={styles.input}
          value={upiId}
          onChangeText={setUpiId}
          placeholder="e.g. merchant@sbi or 9876543210@paytm"
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveUpi} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save UPI ID</Text>}
        </TouchableOpacity>
        <Text style={styles.helpText}>* This UPI ID will generate dynamic QR codes on your invoices.</Text>
      </View>

      {menuItems.map((item, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.item} 
          onPress={() => navigation.navigate(item.screen)}
        >
          <Text style={styles.itemText}>{item.title}</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: '#fff', marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { color: '#666', marginTop: 5 },
  upiCard: { backgroundColor: '#fff', padding: 20, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  upiLabel: { fontSize: 14, fontWeight: 'bold', color: '#2563eb', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 10, backgroundColor: '#f9f9f9' },
  saveBtn: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  helpText: { fontSize: 12, color: '#666', marginTop: 10 },
  item: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemText: { fontSize: 16, color: '#333' },
  arrow: { fontSize: 20, color: '#ccc' },
  logoutButton: { margin: 20, padding: 15, backgroundColor: '#ff4444', borderRadius: 8, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default SettingsScreen;