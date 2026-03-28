import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { postData } from '../../services/ApiService';
import { syncQueue } from '@repo/shared/src/services/syncqueue.native';

const AddSalaryScreen = ({ route, navigation }) => {
  const { staffId, name } = route.params || {};
  const [form, setForm] = useState({
    amount: '',
    paymentType: 'advance', // advance, salary_settlement, incentive, deduction
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => setForm({ ...form, [name]: value });

  const handleSubmit = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) return Alert.alert('Error', 'Valid amount is required');

    setLoading(true);
    try {
      syncQueue.enqueue({
        method: 'post',
        url: '/staff/payment',
        data: { 
          staffId,
          ...form, 
          amount: parseFloat(form.amount) 
        }
      });
      Alert.alert('Success', 'Payment record added successfully');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Payment Entry for {name}</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Payment Type *</Text>
        <View style={styles.pickerContainer}>
            <Picker selectedValue={form.paymentType} onValueChange={v => handleChange('paymentType', v)} style={styles.picker}>
                <Picker.Item label="Give Advance (Peshgi)" value="advance" />
                <Picker.Item label="Salary Settlement (Mahine ka hisaab)" value="salary_settlement" />
                <Picker.Item label="Add Incentive / Bonus" value="incentive" />
                <Picker.Item label="Deduction (Katauti)" value="deduction" />
            </Picker>
        </View>
        
        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput placeholder="0.00" value={form.amount} onChangeText={t => handleChange('amount', t)} style={styles.input} keyboardType="numeric" />
        
        <Text style={styles.label}>Notes</Text>
        <TextInput placeholder="Details (e.g. Festival advance, overtime)" value={form.notes} onChangeText={t => handleChange('notes', t)} style={[styles.input, { height: 80, textAlignVertical: 'top' }]} multiline />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Payment</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9fafb' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  form: { marginTop: 10 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 5 },
  pickerContainer: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, marginBottom: 15, backgroundColor: '#fff', justifyContent: 'center' },
  picker: { height: 50, width: '100%' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16, backgroundColor: '#fff' },
  button: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default AddSalaryScreen;