import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getData, postData } from '../../services/ApiService';
import { syncQueue } from '@repo/shared/src/services/syncqueue.native';

const CreateB2bDocumentScreen = ({ navigation }) => {
  const [parties, setParties] = useState([]);
  const [inventory, setInventory] = useState([]);
  
  const [docType, setDocType] = useState('quotation'); // quotation, sales_order, delivery_challan
  const [selectedParty, setSelectedParty] = useState('');
  const [documentItems, setDocumentItems] = useState([]);
  
  const [currentItem, setCurrentItem] = useState({
    productId: '',
    name: '',
    rate: '',
    quantity: '1'
  });
  
  const [documentNumber, setDocumentNumber] = useState(`DOC-${Date.now()}`);
  const [notes, setNotes] = useState('');
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
      
      const allParties = partyRes.data?.parties || (Array.isArray(partyRes.data) ? partyRes.data : []);
      // B2B mostly deals with customers or both
      setParties(allParties.filter(p => p.partyType === 'customer' || p.partyType === 'both'));
      setInventory(invRes.data?.products || invRes.data?.items || (Array.isArray(invRes.data) ? invRes.data : []));
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Failed to load customers or inventory.");
    } finally {
      setFetching(false);
    }
  };

  const handleAddItem = () => {
    if (!currentItem.productId || parseFloat(currentItem.quantity) <= 0) {
      Alert.alert('Error', 'Please select a product and enter valid quantity.');
      return;
    }

    const product = inventory.find(p => p._id === currentItem.productId);
    const qty = parseFloat(currentItem.quantity);
    const rate = parseFloat(currentItem.rate || product.sellingPrice || 0);
    const total = qty * rate;

    setDocumentItems([...documentItems, {
      productId: product._id,
      name: product.name,
      quantity: qty,
      rate: rate,
      total: total
    }]);

    setCurrentItem({ productId: '', name: '', rate: '', quantity: '1' });
  };

  const handleRemoveItem = (index) => {
    const newItems = [...documentItems];
    newItems.splice(index, 1);
    setDocumentItems(newItems);
  };

  const calculateGrandTotal = () => {
    return documentItems.reduce((acc, item) => acc + item.total, 0);
  };

  const handleSaveDocument = async () => {
    if (!selectedParty) return Alert.alert('Validation', 'Please select a Customer.');
    if (documentItems.length === 0) return Alert.alert('Validation', 'Please add at least one item.');

    setLoading(true);
    try {
      const payload = {
        type: docType,
        documentNumber,
        partyId: selectedParty,
        items: documentItems,
        totalAmount: calculateGrandTotal(),
        finalAmount: calculateGrandTotal(),
        notes,
        date: new Date().toISOString()
      };

      syncQueue.enqueue({
        method: 'post',
        url: '/b2b',
        data: payload
      });
      Alert.alert('Success', `${docType.replace('_', ' ').toUpperCase()} created successfully!`);
      navigation.goBack();
    } catch (error) {
      console.error("Save Document Error:", error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to record document.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create B2B Document</Text>

      <View style={styles.pickerContainer}>
        <Picker selectedValue={docType} onValueChange={val => setDocType(val)} style={styles.picker}>
          <Picker.Item label="Quotation / Estimate" value="quotation" />
          <Picker.Item label="Sales Order" value="sales_order" />
          <Picker.Item label="Delivery Challan" value="delivery_challan" />
        </Picker>
      </View>

      <TextInput
        style={[styles.input, { marginBottom: 10 }]}
        placeholder="Document No. (e.g., QTN-001)"
        value={documentNumber}
        onChangeText={setDocumentNumber}
      />

      <View style={styles.pickerContainer}>
        <Picker selectedValue={selectedParty} onValueChange={val => setSelectedParty(val)} style={styles.picker}>
          <Picker.Item label="-- Select Customer --" value="" color="#888" />
          {parties.map((p) => <Picker.Item key={p._id} label={p.name} value={p._id} />)}
        </Picker>
      </View>

      <View style={styles.addItemRow}>
        <View style={[styles.pickerContainer, { flex: 2, marginRight: 5, height: 45, marginBottom: 0 }]}>
          <Picker
            selectedValue={currentItem.productId}
            onValueChange={(val) => {
              const prod = inventory.find(p => p._id === val);
              setCurrentItem({ ...currentItem, productId: val, rate: prod ? String(prod.sellingPrice || 0) : '' });
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
        data={documentItems}
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

      <TextInput
        style={[styles.input, { marginTop: 10, height: 60 }]}
        placeholder="Notes / Terms & Conditions"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Grand Total:</Text>
          <Text style={styles.totalAmount}>₹{calculateGrandTotal()}</Text>
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDocument} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save {docType.replace('_', ' ').toUpperCase()}</Text>}
        </TouchableOpacity>
        {docType === 'delivery_challan' && (
           <Text style={styles.warningText}>* Note: Saving a Delivery Challan will deduct items from your inventory.</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 15 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#111827', textAlign: 'center' },
  pickerContainer: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', height: 50, justifyContent: 'center', marginBottom: 10 },
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
  totalAmount: { fontSize: 22, fontWeight: 'bold', color: '#2563eb' },
  saveBtn: { backgroundColor: '#111827', padding: 15, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  warningText: { fontSize: 11, color: '#dc2626', marginTop: 10, textAlign: 'center' }
});

export default CreateB2bDocumentScreen;