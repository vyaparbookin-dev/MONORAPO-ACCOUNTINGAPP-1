import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import API from '../../services/Api';
import { addCompanyLocal } from '../../../db'; // Offline DB

const TRADE_TYPES = [
  { id: 'retail', label: 'Retail' }, 
  { id: 'wholesale', label: 'Wholesale' }, 
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: 'service', label: 'Services' },
  { id: 'jewellery', label: 'Jewellery' },
  { id: 'clothes', label: 'Clothes / Garments' },
  { id: 'hardware', label: 'Hardware & Builder' },
  { id: 'electronic', label: 'Electronics' },
  { id: 'restaurant', label: 'Restaurant / Cafe' },
  { id: 'hotel', label: 'Hotel / Resort' },
  { id: 'science', label: 'Science Equipment' },
  { id: 'sports', label: 'Sports & Fitness' }
];

const AddCompanyScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: '',
    gstType: 'regular',
    website: '',
    panNumber: '',
    businessType: 'retail',
    industryType: '',
    businessDescription: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    caName: '',
    caPhone: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => setForm({ ...form, [name]: value });

  const handleSubmit = async () => {
    if (!form.name || !form.email) return Alert.alert('Error', 'Name and Email are required');

    setLoading(true);
    try {
      // 1. Offline First: Save to SQLite
      const localResult = await addCompanyLocal(form);
      if (!localResult.success) throw new Error("Failed to save locally");

      // await API.post('/company', form);
      Alert.alert('Success', 'Company added successfully');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>New Company Details</Text>
      
      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <TextInput placeholder="Company Name *" value={form.name} onChangeText={t => handleChange('name', t)} style={styles.input} />
        <TextInput placeholder="Email *" value={form.email} onChangeText={t => handleChange('email', t)} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
        <TextInput placeholder="Phone" value={form.phone} onChangeText={t => handleChange('phone', t)} style={styles.input} keyboardType="phone-pad" />
        <TextInput placeholder="Address" value={form.address} onChangeText={t => handleChange('address', t)} style={styles.input} multiline />
        
        <Text style={styles.sectionTitle}>Business & Tax Details</Text>
        <Text style={styles.subLabel}>Select Trade Type</Text>
        <View style={styles.chipContainer}>
          {TRADE_TYPES.map((nature) => (
            <TouchableOpacity 
              key={nature.id} 
              style={[styles.chip, form.businessType === nature.id && styles.chipSelected]}
              onPress={() => handleChange('businessType', nature.id)}
            >
              <Text style={[styles.chipText, form.businessType === nature.id && styles.chipTextSelected]}>{nature.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput placeholder="Industry / Sector (e.g. Hardware, Paints, etc.)" value={form.industryType} onChangeText={t => handleChange('industryType', t)} style={styles.input} />
        <TextInput placeholder="What does your firm do? (e.g. Hardware, Electronics)" value={form.businessDescription} onChangeText={t => handleChange('businessDescription', t)} style={styles.input} />
        <TextInput placeholder="GST Number" value={form.gstNumber} onChangeText={t => handleChange('gstNumber', t)} style={styles.input} />
        <TextInput placeholder="PAN Number" value={form.panNumber} onChangeText={t => handleChange('panNumber', t)} style={styles.input} />
        <TextInput placeholder="Website (Optional)" value={form.website} onChangeText={t => handleChange('website', t)} style={styles.input} autoCapitalize="none" keyboardType="url" />

        <Text style={styles.sectionTitle}>Bank Details</Text>
        <TextInput placeholder="Bank Name" value={form.bankName} onChangeText={t => handleChange('bankName', t)} style={styles.input} />
        <TextInput placeholder="Account Holder Name" value={form.accountName} onChangeText={t => handleChange('accountName', t)} style={styles.input} />
        <TextInput placeholder="Account Number" value={form.accountNumber} onChangeText={t => handleChange('accountNumber', t)} style={styles.input} keyboardType="number-pad" />
        <TextInput placeholder="IFSC Code" value={form.ifscCode} onChangeText={t => handleChange('ifscCode', t)} style={styles.input} autoCapitalize="characters" />
        <TextInput placeholder="UPI ID (For QR Code)" value={form.upiId} onChangeText={t => handleChange('upiId', t)} style={styles.input} autoCapitalize="none" />

        <Text style={styles.sectionTitle}>CA / Accountant Details</Text>
        <TextInput placeholder="CA Name" value={form.caName} onChangeText={t => handleChange('caName', t)} style={styles.input} />
        <TextInput placeholder="CA Phone" value={form.caPhone} onChangeText={t => handleChange('caPhone', t)} style={styles.input} keyboardType="phone-pad" />

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Company</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#666', marginTop: 10, marginBottom: 8 },
  subLabel: { fontSize: 13, color: '#888', marginBottom: 8 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  chip: { backgroundColor: '#e5e7eb', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  chipSelected: { backgroundColor: '#2563eb' },
  chipText: { color: '#4b5563', fontSize: 13 },
  chipTextSelected: { color: '#ffffff', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 16, backgroundColor: '#fff' },
  button: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  spacer: { height: 20 }
});

export default AddCompanyScreen;