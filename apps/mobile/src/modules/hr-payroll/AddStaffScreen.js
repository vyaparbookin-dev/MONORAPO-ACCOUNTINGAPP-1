import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { postData } from '../../services/ApiService';
import { addStaffLocal } from '../../../db'; // Offline DB

const AddStaffScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    role: 'staff',
    wageType: 'monthly',
    wageAmount: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => setForm({ ...form, [name]: value });

  const handleSubmit = async () => {
    if (!form.name || !form.wageAmount) {
      return Alert.alert('Error', 'Name and Wage Amount are required');
    }

    setLoading(true);
    try {
      // 1. Offline First: Save to SQLite
      const localResult = await addStaffLocal({ ...form, wageAmount: parseFloat(form.wageAmount) });
      if (!localResult.success) throw new Error("Failed to save locally");

      // await postData('/staff', { ...form, wageAmount: parseFloat(form.wageAmount) });
      Alert.alert('Success', 'Staff member added successfully!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add staff');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Staff</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput placeholder="Enter staff name" value={form.name} onChangeText={t => handleChange('name', t)} style={styles.input} />
        
        <Text style={styles.label}>Mobile Number</Text>
        <TextInput placeholder="10-digit mobile number" value={form.mobile} onChangeText={t => handleChange('mobile', t)} style={styles.input} keyboardType="phone-pad" maxLength={10} />
        
        <Text style={styles.label}>Role / Designation</Text>
        <TextInput placeholder="e.g., Manager, Helper, Driver" value={form.role} onChangeText={t => handleChange('role', t)} style={styles.input} />
        
        <Text style={styles.label}>Wage Type</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={form.wageType} onValueChange={v => handleChange('wageType', v)} style={styles.picker}>
            <Picker.Item label="Monthly Salary" value="monthly" />
            <Picker.Item label="Daily Wages (Majdoori)" value="daily" />
          </Picker>
        </View>

        <Text style={styles.label}>Salary / Wage Amount (₹) *</Text>
        <TextInput placeholder="0.00" value={form.wageAmount} onChangeText={t => handleChange('wageAmount', t)} style={styles.input} keyboardType="numeric" />
        
        <View style={styles.switchRow}>
          <Text style={styles.label}>Active Staff Member?</Text>
          <Switch value={form.isActive} onValueChange={v => handleChange('isActive', v)} trackColor={{ false: "#767577", true: "#2563eb" }} />
        </View>
        <Text style={styles.hintText}>Turn off to remove/hide this staff from daily operations.</Text>

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Staff</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9fafb' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#111827' },
  form: { marginTop: 10 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16, backgroundColor: '#fff' },
  pickerContainer: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, marginBottom: 15, backgroundColor: '#fff', justifyContent: 'center' },
  picker: { height: 50, width: '100%' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  hintText: { fontSize: 12, color: '#6b7280', marginBottom: 20, marginTop: 4 },
  button: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 40 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default AddStaffScreen;