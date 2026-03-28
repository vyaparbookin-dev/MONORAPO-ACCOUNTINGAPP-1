import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getData, postData } from '../../services/ApiService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { syncQueue } from '@repo/shared/src/services/syncqueue.native';

const PaymentEntryScreen = ({ navigation }) => {
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentType, setPaymentType] = useState('received'); // 'received' (You Got) or 'paid' (You Gave)
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const res = await getData('/party');
        // Ensure we get an array, handling both direct array and nested object responses
        const partyData = res.data?.parties || (Array.isArray(res.data) ? res.data : []);
        setParties(partyData);
      } catch (error) {
        Alert.alert('Error', 'Failed to load parties.');
      } finally {
        setFetching(false);
      }
    };
    fetchParties();
  }, []);

  const handleSave = async () => {
    if (!selectedParty || !amount || parseFloat(amount) <= 0) {
      Alert.alert('Validation Error', 'Please select a party and enter a valid amount.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        partyId: selectedParty,
        amount: parseFloat(amount),
        type: paymentType, // 'received' (You Got) or 'paid' (You Gave)
        date: date.toISOString(),
        notes: notes,
        paymentMethod: 'cash' // Default method
      };
      
      syncQueue.enqueue({
        method: 'post',
        url: '/payment/entry',
        data: payload
      });

      Alert.alert('Success', 'Payment entry recorded successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save payment entry. Backend endpoint might be missing.');
      console.error("Payment Entry Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    // Hide the picker immediately on Android after selection
    setShowDatePicker(Platform.OS === 'ios'); 
    setDate(currentDate);
  };

  if (fetching) {
    return <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Add Payment Entry (Udhar/Jama)</Text>

      <Text style={styles.label}>Select Party *</Text>
      <View style={styles.pickerContainer}>
        <Picker 
          selectedValue={selectedParty} 
          onValueChange={(val) => setSelectedParty(val)}
          style={styles.picker}
        >
          <Picker.Item label="-- Choose a Party --" value="" color="#888" />
          {parties.map(p => <Picker.Item key={p._id} label={`${p.name} (${p.partyType})`} value={p._id} />)}
        </Picker>
      </View>

      <Text style={styles.label}>Amount *</Text>
      <TextInput style={styles.input} placeholder="₹ 0.00" keyboardType="numeric" value={amount} onChangeText={setAmount} />
      
      <View style={styles.typeContainer}>
        <TouchableOpacity style={[styles.typeButton, paymentType === 'received' && styles.activeReceived]} onPress={() => setPaymentType('received')}>
          <Text style={[styles.typeText, paymentType === 'received' && styles.activeText]}>You Got (Jama)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.typeButton, paymentType === 'paid' && styles.activePaid]} onPress={() => setPaymentType('paid')}>
          <Text style={[styles.typeText, paymentType === 'paid' && styles.activeText]}>You Gave (Udhar)</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Date</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
          <Text>{date.toLocaleDateString()}</Text>
      </TouchableOpacity>
      {showDatePicker && (<DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />)}

      <Text style={styles.label}>Description (Optional)</Text>
      <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="e.g., Cash payment for old balance" multiline value={notes} onChangeText={setNotes} />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Entry</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f9fafb' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#111827', textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', padding: 12, fontSize: 16, color: '#111827' },
  dateInput: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', padding: 12, justifyContent: 'center', height: 48 },
  pickerContainer: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', justifyContent: 'center' },
  picker: { height: 50, width: '100%' },
  typeContainer: { flexDirection: 'row', gap: 10, marginVertical: 20 },
  typeButton: { flex: 1, padding: 15, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, alignItems: 'center' },
  activeReceived: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  activePaid: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  typeText: { color: '#333', fontWeight: 'bold' },
  activeText: { color: '#fff' },
  saveButton: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default PaymentEntryScreen;
