import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, FlatList } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getData, postData } from '../../services/ApiService';
import { syncQueue } from '@repo/shared/src/services/syncqueue.native';

const StockAdjustmentScreen = () => {
  const [products, setProducts] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    productId: '',
    type: 'reduction',
    quantity: '',
    reason: 'damaged',
    notes: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [prodRes, adjRes] = await Promise.all([
        getData('/inventory'),
        getData('/inventory/adjustments')
      ]);
      setProducts(prodRes.data?.products || (Array.isArray(prodRes.data) ? prodRes.data : []));
      setAdjustments(adjRes.data?.adjustments || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.productId || !formData.quantity) return Alert.alert('Error', 'Product & Quantity required');

    setLoading(true);
    try {
      // Background Sync: Cloud par bhejne ke liye queue me daalein
      syncQueue.enqueue({
        method: 'post',
        url: '/inventory/adjust',
        data: formData
      });

      Alert.alert('Success', 'Stock Adjusted successfully');
      setFormData({ productId: '', type: 'reduction', quantity: '', reason: 'damaged', notes: '' });
      fetchInitialData(); // refresh list
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  const selectedProductInfo = products.find(p => p._id === formData.productId);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Stock Adjustment</Text>

      <View style={styles.formCard}>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={formData.productId} onValueChange={val => setFormData({ ...formData, productId: val })} style={styles.picker}>
            <Picker.Item label="-- Select Product --" value="" />
            {products.map(p => <Picker.Item key={p._id} label={`${p.name} (Stock: ${p.currentStock})`} value={p._id} />)}
          </Picker>
        </View>

        <View style={styles.row}>
          <TouchableOpacity 
            style={[styles.typeBtn, formData.type === 'reduction' ? styles.btnRed : styles.btnInactive]} 
            onPress={() => setFormData({ ...formData, type: 'reduction' })}>
            <Text style={styles.typeText}>Reduce (-)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeBtn, formData.type === 'addition' ? styles.btnGreen : styles.btnInactive]} 
            onPress={() => setFormData({ ...formData, type: 'addition' })}>
            <Text style={styles.typeText}>Add (+)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TextInput style={[styles.input, { flex: 1, marginRight: 5 }]} placeholder="Qty" keyboardType="numeric" value={formData.quantity} onChangeText={txt => setFormData({ ...formData, quantity: txt })} />
          <View style={[styles.pickerContainer, { flex: 1, height: 50, marginBottom: 15 }]}>
            <Picker selectedValue={formData.reason} onValueChange={val => setFormData({ ...formData, reason: val })} style={styles.picker}>
              <Picker.Item label="Damaged" value="damaged" />
              <Picker.Item label="Lost" value="lost" />
              <Picker.Item label="Correction" value="correction" />
              <Picker.Item label="Internal Use" value="internal_use" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Apply Adjustment</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.subHeader}>Recent Adjustments</Text>
      {fetching ? <ActivityIndicator size="large" color="#2563eb" /> : (
        <FlatList
          data={adjustments}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View style={styles.adjCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.adjName}>{item.productId?.name || 'Unknown'}</Text>
                <Text style={styles.adjDate}>{new Date(item.date).toLocaleDateString()} | {item.reason}</Text>
              </View>
              <View>
                <Text style={[styles.adjQty, item.type === 'addition' ? { color: '#16a34a' } : { color: '#dc2626' }]}>
                  {item.type === 'addition' ? '+' : '-'}{item.quantity}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No adjustments found.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 15 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#111827', textAlign: 'center' },
  subHeader: { fontSize: 18, fontWeight: 'bold', marginVertical: 10, color: '#374151' },
  formCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, elevation: 2, marginBottom: 10 },
  pickerContainer: { backgroundColor: '#f9fafb', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', height: 50, justifyContent: 'center', marginBottom: 15 },
  picker: { height: 50, width: '100%' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  typeBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5, marginBottom: 15, borderWidth: 1 },
  btnInactive: { backgroundColor: '#f3f4f6', borderColor: '#d1d5db' },
  btnRed: { backgroundColor: '#fee2e2', borderColor: '#ef4444' },
  btnGreen: { backgroundColor: '#dcfce7', borderColor: '#22c55e' },
  typeText: { fontWeight: 'bold', color: '#374151' },
  input: { backgroundColor: '#f9fafb', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', paddingHorizontal: 10, height: 50, marginBottom: 15 },
  saveBtn: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  adjCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, alignItems: 'center', elevation: 1 },
  adjName: { fontSize: 15, fontWeight: 'bold', color: '#1f2937' },
  adjDate: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  adjQty: { fontSize: 18, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 10 }
});

export default StockAdjustmentScreen;