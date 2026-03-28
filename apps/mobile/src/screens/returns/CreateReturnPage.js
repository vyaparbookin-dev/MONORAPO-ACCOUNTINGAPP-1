import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
// Ensuring exact case import for API Service
import { getData, postData } from '../../services/ApiService';
import { syncQueue } from '@repo/shared/src/services/syncqueue.native';

const CreateReturnScreen = ({ navigation }) => {
  const [parties, setParties] = useState([]);
  const [inventory, setInventory] = useState([]);
  
  const [returnType, setReturnType] = useState('sales_return'); // 'sales_return' or 'purchase_return'
  const [selectedParty, setSelectedParty] = useState('');
  const [returnItems, setReturnItems] = useState([]);
  const [reason, setReason] = useState('');
  
  const [currentItem, setCurrentItem] = useState({
    productId: '',
    name: '',
    rate: '',
    quantity: '1'
  });
  
  const [returnNumber, setReturnNumber] = useState(`RET-${Date.now()}`);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [partyRes, invRes] = await Promise.all([
        getData('/party'),
        getData('/inventory')
      ]);
      setParties(partyRes.data?.parties || (Array.isArray(partyRes.data) ? partyRes.data : []));
      setInventory(invRes.data?.products || invRes.data?.items || (Array.isArray(invRes.data) ? invRes.data : []));
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Failed to load parties or inventory.");
    } finally {
      setFetching(false);
    }
  };

  const filteredParties = parties.filter(p => {
    if (returnType === 'sales_return') return p.partyType === 'customer' || p.partyType === 'both';
    if (returnType === 'purchase_return') return p.partyType === 'supplier' || p.partyType === 'both';
    return true;
  });

  const handleAddItem = () => {
    if (!currentItem.productId || parseFloat(currentItem.quantity) <= 0) {
      Alert.alert('Error', 'Please select a product and enter valid quantity.');
      return;
    }

    const product = inventory.find(p => p._id === currentItem.productId);
    const qty = parseFloat(currentItem.quantity);
    const rate = parseFloat(currentItem.rate || (returnType === 'sales_return' ? product.sellingPrice : product.costPrice) || 0);
    const total = qty * rate;

    setReturnItems([...returnItems, {
      productId: product._id,
      name: product.name,
      quantity: qty,
      rate: rate,
      total: total
    }]);

    setCurrentItem({ productId: '', name: '', rate: '', quantity: '1' });
  };

  const handleRemoveItem = (index) => {
    const newItems = [...returnItems];
    newItems.splice(index, 1);
    setReturnItems(newItems);
  };

  const calculateGrandTotal = () => {
    return returnItems.reduce((acc, item) => acc + item.total, 0);
  };

  const handleSaveReturn = async () => {
    if (!selectedParty) return Alert.alert('Validation', 'Please select a Party.');
    if (returnItems.length === 0) return Alert.alert('Validation', 'Please add at least one item.');

    setLoading(true);
    try {
      const payload = {
        returnNumber,
        partyId: selectedParty,
        type: returnType,
        items: returnItems,
        totalAmount: calculateGrandTotal(),
        reason,
        date: new Date().toISOString()
      };

      syncQueue.enqueue({
        method: 'post',
        url: '/return',
        data: payload
      });
      Alert.alert('Success', `${returnType === 'sales_return' ? 'Sales' : 'Purchase'} Return processed successfully!`);
      navigation.goBack();
    } catch (error) {
      console.error("Save Return Error:", error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to process return.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create Return Entry</Text>

      <View style={styles.typeSelector}>
        <TouchableOpacity 
          style={[styles.typeBtn, returnType === 'sales_return' && styles.typeBtnActive]} 
          onPress={() => { setReturnType('sales_return'); setSelectedParty(''); }}>
          <Text style={[styles.typeText, returnType === 'sales_return' && styles.typeTextActive]}>Sales Return</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.typeBtn, returnType === 'purchase_return' && styles.typeBtnActive]} 
          onPress={() => { setReturnType('purchase_return'); setSelectedParty(''); }}>
          <Text style={[styles.typeText, returnType === 'purchase_return' && styles.typeTextActive]}>Purchase Return</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pickerContainer}>
        <Picker selectedValue={selectedParty} onValueChange={val => setSelectedParty(val)} style={styles.picker}>
          <Picker.Item label={returnType === 'sales_return' ? "-- Select Customer --" : "-- Select Supplier --"} value="" color="#888" />
          {filteredParties.map((p) => <Picker.Item key={p._id} label={p.name} value={p._id} />)}
        </Picker>
      </View>

      <TextInput
        style={[styles.input, { marginBottom: 15 }]}
        placeholder="Reason for return (Optional)"
        value={reason}
        onChangeText={setReason}
      />

      <View style={styles.addItemRow}>
        <View style={[styles.pickerContainer, { flex: 2, marginRight: 5, height: 45, marginBottom: 0 }]}>
          <Picker
            selectedValue={currentItem.productId}
            onValueChange={(val) => {
              const prod = inventory.find(p => p._id === val);
              const defaultRate = prod ? (returnType === 'sales_return' ? prod.sellingPrice : prod.costPrice) : 0;
              setCurrentItem({ ...currentItem, productId: val, rate: String(defaultRate || 0) });
            }}
            style={{ height: 45, width: '100%' }}
          >
            <Picker.Item label="Select Item" value="" color="#888" />
            {inventory.map((p) => <Picker.Item key={p._id} label={p.name} value={p._id} />)}
          </Picker>
        </View>
        <TextInput style={[styles.input, { flex: 0.8, marginRight: 5, height: 45, marginBottom: 0 }]} placeholder="Qty" keyboardType="numeric" value={currentItem.quantity} onChangeText={txt => setCurrentItem({ ...currentItem, quantity: txt })} />
        <TextInput style={[styles.input, { flex: 1, marginRight: 5, height: 45, marginBottom: 0 }]} placeholder="Rate" keyboardType="numeric" value={currentItem.rate} onChangeText={txt => setCurrentItem({ ...currentItem, rate: txt })} />
        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}><Text style={styles.addButtonText}>+</Text></TouchableOpacity>
      </View>

      <FlatList
        data={returnItems}
        keyExtractor={(item, index) => index.toString()}
        style={{ marginTop: 15 }}
        renderItem={({ item, index }) => (
          <View style={styles.itemCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetail}>{item.quantity} x ₹{item.rate}</Text>
            </View>
            <Text style={styles.itemTotal}>₹{item.total}</Text>
            <TouchableOpacity onPress={() => handleRemoveItem(index)} style={{ marginLeft: 10 }}>
              <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 16 }}>X</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No items added yet.</Text>}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Return Value:</Text>
          <Text style={[styles.totalAmount, returnType === 'sales_return' ? {color: '#dc2626'} : {color: '#16a34a'}]}>
            ₹{calculateGrandTotal()}
          </Text>
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveReturn} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Process Return</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 15 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#111827', textAlign: 'center' },
  typeSelector: { flexDirection: 'row', marginBottom: 15, backgroundColor: '#e5e7eb', borderRadius: 8, padding: 4 },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  typeBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.2, elevation: 2 },
  typeText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  typeTextActive: { color: '#2563eb' },
  pickerContainer: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', height: 50, justifyContent: 'center', marginBottom: 15 },
  picker: { height: 50, width: '100%' },
  input: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', paddingHorizontal: 10, height: 50 },
  addItemRow: { flexDirection: 'row', alignItems: 'center' },
  addButton: { backgroundColor: '#2563eb', width: 45, height: 45, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  itemDetail: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  itemTotal: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 20 },
  footer: { marginTop: 10, padding: 15, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#374151' },
  totalAmount: { fontSize: 22, fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#111827', padding: 15, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default CreateReturnScreen;
