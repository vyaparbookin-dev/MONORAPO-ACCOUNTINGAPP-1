import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { postData } from '../../services/ApiService';
import { syncQueue } from '@repo/shared/src/services/syncqueue.native';

const ThirdPartyDispatchBilling = () => {
  const [provider, setProvider] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [cost, setCost] = useState('');

  const handleSubmit = async () => {
    if (!provider || !trackingId || !cost) return Alert.alert('Error', 'Fill all fields');

    try {
      syncQueue.enqueue({
        method: 'post',
        url: '/billing/dispatch',
        data: {
          provider,
          trackingId,
          cost: parseFloat(cost),
          date: new Date()
        }
      });
      Alert.alert('Success', 'Dispatch Record Added');
      setProvider('');
      setTrackingId('');
      setCost('');
    } catch (err) {
      Alert.alert('Error', 'Failed to save record');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Logistics & Dispatch</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Courier/Provider Name</Text>
        <TextInput style={styles.input} value={provider} onChangeText={setProvider} placeholder="e.g. DTDC, BlueDart" />
        
        <Text style={styles.label}>Tracking ID / AWB</Text>
        <TextInput style={styles.input} value={trackingId} onChangeText={setTrackingId} placeholder="Enter Tracking Number" />
        
        <Text style={styles.label}>Shipping Cost</Text>
        <TextInput style={styles.input} value={cost} onChangeText={setCost} keyboardType="numeric" placeholder="₹ 0.00" />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Save Record</Text>
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
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16, backgroundColor: "#f9f9f9" },
  button: { backgroundColor: '#6f42c1', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default ThirdPartyDispatchBilling;