import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import API from '../../services/Api';
import { addCouponLocal } from '../../../db'; // Offline DB

const AddCouponScreen = ({ navigation }) => {
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [expiry, setExpiry] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!code || !discount) return Alert.alert('Error', 'Code and Discount are required');
    
    setLoading(true);
    try {
      // Default expiry to 30 days if not provided
      const expiryDate = expiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      // 1. Offline First: Save to SQLite
      const localResult = await addCouponLocal({
        code: code,
        discountPercentage: parseFloat(discount)
      });
      if (!localResult.success) throw new Error("Failed to save locally");

      Alert.alert('Success', 'Coupon added successfully');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to add coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Coupon</Text>
      
      <Text style={styles.label}>Coupon Code</Text>
      <TextInput style={styles.input} placeholder="e.g. SAVE20" value={code} onChangeText={setCode} autoCapitalize="characters" />
      
      <Text style={styles.label}>Discount Percentage (%)</Text>
      <TextInput style={styles.input} placeholder="e.g. 20" value={discount} onChangeText={setDiscount} keyboardType="numeric" />
      
      <Text style={styles.label}>Expiry Date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} placeholder="Optional" value={expiry} onChangeText={setExpiry} />
      
      <TouchableOpacity style={styles.btn} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Coupon</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16, backgroundColor: '#f9f9f9' },
  btn: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default AddCouponScreen;