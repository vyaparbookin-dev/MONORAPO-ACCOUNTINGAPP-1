import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Picker } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/ApiService'; // Assuming ApiService is the wrapper for shared api

export default function CreateQuotationScreen({ navigation, route }) {
  const { quotationId } = route.params || {}; // For editing existing quotation
  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    partyId: '',
    date: new Date().toISOString().split('T')[0],
    validUntil: '',
    items: [],
    notes: '',
    subTotal: 0,
    totalTax: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [partiesRes, productsRes] = await Promise.all([
          api.get('/parties'),
          api.get('/inventory'),
        ]);
        setParties(partiesRes.parties || []);
        setProducts(productsRes.products || []);

        if (quotationId) {
          const quotationRes = await api.get(`/quotations/${quotationId}`);
          const quotation = quotationRes.data.data;
          setFormData({
            ...quotation,
            partyId: quotation.partyId._id,
            date: new Date(quotation.date).toISOString().split('T')[0],
            validUntil: quotation.validUntil ? new Date(quotation.validUntil).toISOString().split('T')[0] : '',
          });
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
        Alert.alert("Error", "Failed to load data for quotation.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [quotationId]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items]);

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleItemChange = (index, name, value) => {
    const newItems = [...formData.items];
    newItems[index][name] = value;

    if (name === 'productId') {
      const selectedProduct = products.find(p => p._id === value);
      if (selectedProduct) {
        newItems[index].name = selectedProduct.name;
        newItems[index].rate = selectedProduct.sellingPrice;
        newItems[index].taxRate = selectedProduct.gstRate || 0;
      }
    }

    newItems[index].total = (newItems[index].quantity * newItems[index].rate * (1 + newItems[index].taxRate / 100)).toFixed(2);
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', name: '', quantity: 1, rate: 0, taxRate: 0, total: 0 }],
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    let subTotal = 0;
    let totalTax = 0;
    formData.items.forEach(item => {
      subTotal += item.quantity * item.rate;
      totalTax += (item.quantity * item.rate * item.taxRate / 100);
    });
    setFormData(prev => ({
      ...prev,
      subTotal: subTotal.toFixed(2),
      totalTax: totalTax.toFixed(2),
      totalAmount: (subTotal + totalTax).toFixed(2),
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (quotationId) {
        await api.put(`/quotations/${quotationId}`, formData);
        Alert.alert("Success", "Quotation updated successfully!");
      } else {
        await api.post('/quotations', formData);
        Alert.alert("Success", "Quotation created successfully!");
      }
      navigation.goBack();
    } catch (err) {
      console.error("Failed to save quotation", err);
      Alert.alert("Error", "Failed to save quotation.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{quotationId ? 'Edit Quotation' : 'Create Quotation'}</Text>
        <TouchableOpacity onPress={handleSubmit} style={styles.saveButton}>
          <Ionicons name="save-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.formSection}>
          <Text style={styles.label}>Customer</Text>
          <Picker
            selectedValue={formData.partyId}
            onValueChange={(itemValue) => handleInputChange('partyId', itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Customer" value="" />
            {parties.map(party => (
              <Picker.Item key={party._id} label={party.name} value={party._id} />
            ))}
          </Picker>

          <Text style={styles.label}>Quotation Date</Text>
          <TextInput style={styles.input} value={formData.date} onChangeText={(text) => handleInputChange('date', text)} />

          <Text style={styles.label}>Valid Until</Text>
          <TextInput style={styles.input} value={formData.validUntil} onChangeText={(text) => handleInputChange('validUntil', text)} />
        </View>

        <Text style={styles.sectionTitle}>Items</Text>
        {formData.items.map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <Text style={styles.label}>Product</Text>
            <Picker
              selectedValue={item.productId}
              onValueChange={(itemValue) => handleItemChange(index, 'productId', itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select Product" value="" />
              {products.map(p => (
                <Picker.Item key={p._id} label={p.name} value={p._id} />
              ))}
            </Picker>
            <View style={styles.itemRow}>
              <TextInput style={[styles.input, styles.itemInput]} placeholder="Qty" keyboardType="numeric" value={String(item.quantity)} onChangeText={(text) => handleItemChange(index, 'quantity', text)} />
              <TextInput style={[styles.input, styles.itemInput]} placeholder="Rate" keyboardType="numeric" value={String(item.rate)} onChangeText={(text) => handleItemChange(index, 'rate', text)} />
              <TextInput style={[styles.input, styles.itemInput]} placeholder="Tax %" keyboardType="numeric" value={String(item.taxRate)} onChangeText={(text) => handleItemChange(index, 'taxRate', text)} />
              <Text style={styles.itemTotal}>₹{item.total}</Text>
              <TouchableOpacity onPress={() => removeItem(index)} style={styles.removeItemButton}>
                <Ionicons name="close-circle-outline" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <TouchableOpacity onPress={addItem} style={styles.addItemButton}>
          <Ionicons name="add-circle-outline" size={24} color="#2563eb" />
          <Text style={styles.addItemButtonText}>Add Item</Text>
        </TouchableOpacity>

        <View style={styles.totalsSection}>
          <Text style={styles.totalText}>Sub Total: ₹{formData.subTotal}</Text>
          <Text style={styles.totalText}>Total Tax: ₹{formData.totalTax}</Text>
          <Text style={styles.grandTotalText}>Total Amount: ₹{formData.totalAmount}</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Notes</Text>
          <TextInput style={[styles.input, styles.textArea]} multiline value={formData.notes} onChangeText={(text) => handleInputChange('notes', text)} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#111827', paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  backButton: { padding: 5 },
  saveButton: { padding: 5 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { padding: 15 },
  formSection: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41 },
  label: { fontSize: 14, color: '#4b5563', marginBottom: 5, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 10, backgroundColor: '#fff' },
  picker: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, marginBottom: 10, backgroundColor: '#fff' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 10, marginTop: 15 },
  itemCard: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  itemInput: { flex: 1, marginRight: 10, paddingVertical: 8, fontSize: 14 },
  itemTotal: { fontSize: 14, fontWeight: 'bold', color: '#374151', minWidth: 60, textAlign: 'right' },
  removeItemButton: { padding: 5 },
  addItemButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#2563eb', marginBottom: 15 },
  addItemButtonText: { color: '#2563eb', marginLeft: 5, fontWeight: 'bold' },
  totalsSection: { alignItems: 'flex-end', marginTop: 20, marginBottom: 20 },
  totalText: { fontSize: 16, color: '#4b5563', marginBottom: 5 },
  grandTotalText: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  textArea: { height: 80, textAlignVertical: 'top' },
});