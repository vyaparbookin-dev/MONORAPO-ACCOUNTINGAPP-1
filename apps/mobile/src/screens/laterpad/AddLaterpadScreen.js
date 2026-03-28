// c:\Users\Lenovo1\Desktop\red-accounting-book\frontend\mobile\src\screens\laterpad\AddLaterpadScreen.js

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import API from '../../services/Api';

const AddLaterpadScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    customerName: '',
    amount: '',
    mobile: '',
    dueDate: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => setForm({ ...form, [name]: value });

  const handleSubmit = async () => {
    if (!form.customerName || !form.amount) return Alert.alert('Error', 'Customer Name and Amount are required');

    setLoading(true);
    try {
      await API.post('/laterpad', { ...form, amount: parseFloat(form.amount) });
      Alert.alert('Success', 'Entry added to Laterpad');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add Laterpad Entry (Udhar)</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Customer Name</Text>
        <TextInput placeholder="Name" value={form.customerName} onChangeText={t => handleChange('customerName', t)} style={styles.input} />
        
        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput placeholder="0.00" value={form.amount} onChangeText={t => handleChange('amount', t)} style={styles.input} keyboardType="numeric" />
        
        <Text style={styles.label}>Mobile Number</Text>
        <TextInput placeholder="Phone" value={form.mobile} onChangeText={t => handleChange('mobile', t)} style={styles.input} keyboardType="phone-pad" />
        
        <Text style={styles.label}>Due Date (Optional)</Text>
        <TextInput placeholder="YYYY-MM-DD" value={form.dueDate} onChangeText={t => handleChange('dueDate', t)} style={styles.input} />
        
        <Text style={styles.label}>Notes</Text>
        <TextInput placeholder="Items details..." value={form.notes} onChangeText={t => handleChange('notes', t)} style={[styles.input, { height: 80 }]} multiline />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Entry</Text>}
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
  button: { backgroundColor: '#f59e0b', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default AddLaterpadScreen;
