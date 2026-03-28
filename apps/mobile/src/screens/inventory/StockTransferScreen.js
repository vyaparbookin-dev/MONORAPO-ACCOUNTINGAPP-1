import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, FlatList, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getData, postData } from '../../services/ApiService';
import { syncQueue } from '@repo/shared/src/services/syncqueue.native';

const StockTransferScreen = ({ navigation }) => {
  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fromBranchId: '',
    fromWarehouseId: '',
    toBranchId: '',
    toWarehouseId: '',
    notes: '',
    items: []
  });

  const [currentItem, setCurrentItem] = useState({ productId: '', name: '', quantity: '1' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [branchRes, whRes, prodRes] = await Promise.all([
        getData('/branch'),
        getData('/warehouse'),
        getData('/inventory')
      ]);
      setBranches(branchRes.data?.branches || branchRes.data?.data || []);
      setWarehouses(whRes.data?.warehouses || whRes.data?.data || []);
      setProducts(prodRes.data?.products || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load initial data');
    } finally {
      setFetching(false);
    }
  };

  const handleAddItem = () => {
    if (!currentItem.productId || parseFloat(currentItem.quantity) <= 0) {
      return Alert.alert('Validation', 'Select a product and enter a valid quantity.');
    }
    const product = products.find(p => p._id === currentItem.productId);
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: currentItem.productId, name: product.name, quantity: parseFloat(currentItem.quantity) }]
    }));
    setCurrentItem({ productId: '', name: '', quantity: '1' });
  };

  const handleRemoveItem = (index) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmit = async () => {
    if (!formData.fromBranchId || !formData.toBranchId) return Alert.alert('Error', 'Source and Destination branches are required.');
    if (formData.items.length === 0) return Alert.alert('Error', 'Add at least one item to transfer.');

    setLoading(true);
    try {
      // Background Sync: Cloud par bhejne ke liye queue me daalein
      syncQueue.enqueue({
        method: 'post',
        url: '/stock-transfer',
        data: formData
      });

      Alert.alert('Success', 'Stock transferred successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to transfer stock.');
    } finally {
      setLoading(false);
    }
  };

  const fromWarehouses = warehouses.filter(w => w.branchId?._id === formData.fromBranchId || w.branchId === formData.fromBranchId);
  const toWarehouses = warehouses.filter(w => w.branchId?._id === formData.toBranchId || w.branchId === formData.toBranchId);

  if (fetching) return <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1, marginTop: 50 }} />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Stock Transfer</Text>

      <View style={[styles.card, { borderColor: '#fca5a5', borderWidth: 1, backgroundColor: '#fef2f2' }]}>
        <Text style={styles.sectionTitle}>Send From (Source)</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={formData.fromBranchId} onValueChange={val => setFormData({...formData, fromBranchId: val, fromWarehouseId: ''})} style={styles.picker}>
            <Picker.Item label="-- Select Branch --" value="" />
            {branches.map(b => <Picker.Item key={b._id} label={b.name} value={b._id} />)}
          </Picker>
        </View>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={formData.fromWarehouseId} onValueChange={val => setFormData({...formData, fromWarehouseId: val})} style={styles.picker}>
            <Picker.Item label="-- Select Warehouse --" value="" />
            {fromWarehouses.map(w => <Picker.Item key={w._id} label={w.name} value={w._id} />)}
          </Picker>
        </View>
      </View>

      <View style={[styles.card, { borderColor: '#86efac', borderWidth: 1, backgroundColor: '#f0fdf4' }]}>
        <Text style={styles.sectionTitle}>Receive At (Destination)</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={formData.toBranchId} onValueChange={val => setFormData({...formData, toBranchId: val, toWarehouseId: ''})} style={styles.picker}>
            <Picker.Item label="-- Select Branch --" value="" />
            {branches.map(b => <Picker.Item key={b._id} label={b.name} value={b._id} />)}
          </Picker>
        </View>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={formData.toWarehouseId} onValueChange={val => setFormData({...formData, toWarehouseId: val})} style={styles.picker}>
            <Picker.Item label="-- Select Warehouse --" value="" />
            {toWarehouses.map(w => <Picker.Item key={w._id} label={w.name} value={w._id} />)}
          </Picker>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Add Items</Text>
        <View style={styles.addRow}>
          <View style={[styles.pickerContainer, { flex: 2, marginRight: 5, marginBottom: 0 }]}>
            <Picker selectedValue={currentItem.productId} onValueChange={val => setCurrentItem({...currentItem, productId: val})} style={styles.picker}>
              <Picker.Item label="Select Item" value="" />
              {products.map(p => <Picker.Item key={p._id} label={p.name} value={p._id} />)}
            </Picker>
          </View>
          <TextInput style={styles.qtyInput} placeholder="Qty" keyboardType="numeric" value={currentItem.quantity} onChangeText={txt => setCurrentItem({...currentItem, quantity: txt})} />
          <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}><Text style={styles.addBtnText}>+</Text></TouchableOpacity>
        </View>

        {formData.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={{ flex: 1, fontWeight: 'bold' }}>{item.name}</Text>
            <Text style={{ fontWeight: 'bold', color: '#2563eb', marginRight: 15 }}>Qty: {item.quantity}</Text>
            <TouchableOpacity onPress={() => handleRemoveItem(index)}>
              <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 16 }}>X</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TextInput 
        style={styles.notesInput} 
        placeholder="Optional Notes..." 
        value={formData.notes} 
        onChangeText={txt => setFormData({...formData, notes: txt})} 
        multiline 
      />

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Confirm Transfer</Text>}
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 15 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 15 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 15, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#374151' },
  pickerContainer: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', height: 45, justifyContent: 'center', marginBottom: 10 },
  picker: { height: 45 },
  addRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  qtyInput: { flex: 0.8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, height: 45, paddingHorizontal: 10, marginRight: 5 },
  addBtn: { backgroundColor: '#2563eb', height: 45, width: 45, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  itemRow: { flexDirection: 'row', backgroundColor: '#f9fafb', padding: 10, borderRadius: 8, borderBottomWidth: 1, borderColor: '#e5e7eb', marginBottom: 5, alignItems: 'center' },
  notesInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, height: 60, textAlignVertical: 'top', marginBottom: 15 },
  submitBtn: { backgroundColor: '#111827', padding: 15, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default StockTransferScreen;