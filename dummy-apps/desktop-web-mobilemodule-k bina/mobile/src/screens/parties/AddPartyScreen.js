import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { postData } from '../../services/ApiService';
import { addPartyLocal } from '../../../db'; // Offline Database
import { syncQueue } from '@repo/shared/src/services/syncqueue.native';

const AddPartyScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    name: '',
    mobileNumber: '',
    address: '',
    partyType: 'customer',
    openingBalance: '0',
    creditLimit: '0'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => setForm({ ...form, [name]: value });

  const handleSubmit = async () => {
    // Backend validation requires Name, MobileNumber, and Address
    if (!form.name || !form.mobileNumber || !form.address) {
      return Alert.alert('Error', 'Name, Mobile Number, and Address are required');
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        openingBalance: parseFloat(form.openingBalance) || 0,
        creditLimit: parseFloat(form.creditLimit) || 0
      };
      
      // 1. Offline First: Local SQLite Database me party save karein
      const localResult = await addPartyLocal({
        name: form.name,
        phone: form.mobileNumber,
        address: form.address,
        partyType: form.partyType,
        balance: parseFloat(form.openingBalance) || 0
      });

      if (!localResult.success) throw new Error("Failed to save locally");

      // 2. Background Sync: Cloud par bhejne ke liye queue me daalein
      syncQueue.enqueue({
        method: 'post',
        url: '/party',
        data: payload
      });

      Alert.alert('Success', 'Party added successfully!');
      navigation.goBack(); // Wapas Parties list par bhej dega
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to add party');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Party</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Party Name *</Text>
        <TextInput placeholder="Enter name" value={form.name} onChangeText={t => handleChange('name', t)} style={styles.input} />
        
        <Text style={styles.label}>Mobile Number *</Text>
        <TextInput placeholder="Enter 10-digit number" value={form.mobileNumber} onChangeText={t => handleChange('mobileNumber', t)} style={styles.input} keyboardType="phone-pad" maxLength={10} />
        
        <Text style={styles.label}>Address *</Text>
        <TextInput placeholder="Enter city/address" value={form.address} onChangeText={t => handleChange('address', t)} style={styles.input} />
        
        <Text style={styles.label}>Opening Balance</Text>
        <TextInput placeholder="₹ 0.00" value={form.openingBalance} onChangeText={t => handleChange('openingBalance', t)} style={styles.input} keyboardType="numeric" />
        
        <Text style={styles.label}>Credit Limit (Udhar Limit)</Text>
        <TextInput placeholder="₹ 0.00 (0 means no limit)" value={form.creditLimit} onChangeText={t => handleChange('creditLimit', t)} style={styles.input} keyboardType="numeric" />
        
        <Text style={styles.label}>Party Type</Text>
        <View style={styles.typeContainer}>
          {['customer', 'supplier', 'both'].map((type) => (
            <TouchableOpacity 
              key={type} 
              style={[styles.typeButton, form.partyType === type && styles.activeType]} 
              onPress={() => handleChange('partyType', type)}
            >
              <Text style={[styles.typeText, form.partyType === type && styles.activeTypeText]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Party</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  form: { marginTop: 10 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16, backgroundColor: '#f9f9f9' },
  typeContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typeButton: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, alignItems: 'center' },
  activeType: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  typeText: { color: '#555', fontWeight: '600' },
  activeTypeText: { color: '#fff' },
  button: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default AddPartyScreen;