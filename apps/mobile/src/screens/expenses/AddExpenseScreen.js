// c:\Users\Lenovo1\Desktop\red-accounting-book\frontend\mobile\src\screens\expenses\AddExpenseScreen.js

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import API from '../../services/Api';
import { addExpenseLocal } from '../../../db'; // Offline DB

const AddExpanseScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => setForm({ ...form, [name]: value });

  const handleSubmit = async () => {
    if (!form.title || !form.amount) return Alert.alert('Error', 'Title and Amount are required');

    setLoading(true);
    try {
      // 1. Offline First: Save to SQLite
      const localResult = await addExpenseLocal({
        title: form.title,
        amount: parseFloat(form.amount),
        category: form.category,
        date: form.date,
        description: form.notes
      });
      if (!localResult.success) throw new Error("Failed to save locally");

      // await API.post('/expance', { ...form, amount: parseFloat(form.amount) });
      Alert.alert('Success', 'Expense added successfully');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Expense</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Expense Title</Text>
        <TextInput placeholder="e.g. Electricity Bill" value={form.title} onChangeText={t => handleChange('title', t)} style={styles.input} />
        
        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput placeholder="0.00" value={form.amount} onChangeText={t => handleChange('amount', t)} style={styles.input} keyboardType="numeric" />
        
        <Text style={styles.label}>Category</Text>
        <TextInput placeholder="e.g. Utilities, Rent, Salary" value={form.category} onChangeText={t => handleChange('category', t)} style={styles.input} />
        
        <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
        <TextInput placeholder="YYYY-MM-DD" value={form.date} onChangeText={t => handleChange('date', t)} style={styles.input} />
        
        <Text style={styles.label}>Notes</Text>
        <TextInput placeholder="Additional details..." value={form.notes} onChangeText={t => handleChange('notes', t)} style={[styles.input, { height: 80 }]} multiline />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Expense</Text>}
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
  button: { backgroundColor: '#ef4444', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default AddExpanseScreen;
