import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { postData } from '../../services/ApiService';
import { syncQueue } from '@repo/shared/src/services/syncqueue.native';

const NonGSTBillingScreen = () => {
  const [customer, setCustomer] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const handleCreate = async () => {
    if (!customer || !amount) return Alert.alert('Error', 'Fill details');

    try {
      syncQueue.enqueue({
        method: 'post',
        url: '/billing/nongst',
        data: {
          customerName: customer,
          total: parseFloat(amount),
          notes,
          type: 'nongst'
        }
      });
      Alert.alert('Success', 'Non-GST Bill Created');
      setCustomer('');
      setAmount('');
      setNotes('');
    } catch (err) {
      Alert.alert('Error', 'Failed to create bill');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Non-GST Bill (Estimate)</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Customer Name</Text>
        <TextInput style={styles.input} value={customer} onChangeText={setCustomer} placeholder="Enter Name" />
        
        <Text style={styles.label}>Total Amount</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="₹ 0.00" />
        
        <Text style={styles.label}>Notes / Items</Text>
        <TextInput 
          style={[styles.input, { height: 100 }]} 
          value={notes} 
          onChangeText={setNotes} 
          multiline 
          placeholder="Enter items details..." 
        />

        <TouchableOpacity style={styles.button} onPress={handleCreate}>
          <Text style={styles.buttonText}>Generate Estimate</Text>
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
  button: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default NonGSTBillingScreen;