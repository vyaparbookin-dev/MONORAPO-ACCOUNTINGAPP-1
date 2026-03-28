import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getData } from '../../services/ApiService';

const SupplierLedgerScreen = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingSuppliers, setFetchingSuppliers] = useState(true);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await getData('/inventory');
        const inventoryData = res.data?.products || (Array.isArray(res.data) ? res.data : []);
        // Extract unique suppliers from inventory
        const uniqueSuppliers = [...new Set(inventoryData.map(i => i.supplier).filter(Boolean))];
        setSuppliers(uniqueSuppliers);
      } catch (e) {
        console.error('Error fetching suppliers:', e);
        Alert.alert('Error', 'Failed to load suppliers list');
      } finally {
        setFetchingSuppliers(false);
      }
    };
    fetchSuppliers();
  }, []);

  const fetchLedger = async () => {
    if (!selectedSupplier) return;
    setLoading(true);
    try {
      // Matching the web API endpoint logic
      const res = await getData(`/inventory/purchase?supplier=${selectedSupplier}`);
      setLedgerData(res.data || []);
    } catch (err) {
      console.error('Failed to fetch ledger', err);
      setLedgerData([]);
      Alert.alert('Notice', 'No transactions found or failed to fetch.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderLedgerItem = ({ item }) => (
    <View style={styles.ledgerCard}>
      <View style={styles.row}>
        <Text style={styles.dateText}>{formatDate(item.date)}</Text>
        <Text style={styles.typeText}>{item.type?.toUpperCase()}</Text>
      </View>
      <Text style={styles.refText}>Ref: {item.refNo || 'N/A'}</Text>
      
      <View style={styles.amountRow}>
        <View style={styles.amountBox}>
          <Text style={styles.label}>Debit (Paid)</Text>
          <Text style={[styles.amount, { color: '#16a34a' }]}>{item.debit ? `₹${item.debit}` : '-'}</Text>
        </View>
        <View style={styles.amountBox}>
          <Text style={styles.label}>Credit (Purchase)</Text>
          <Text style={[styles.amount, { color: '#dc2626' }]}>{item.credit ? `₹${item.credit}` : '-'}</Text>
        </View>
        <View style={styles.amountBox}>
          <Text style={styles.label}>Balance</Text>
          <Text style={[styles.amount, { color: '#111827', fontWeight: 'bold' }]}>₹{item.balance || 0}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Supplier Ledger</Text>

      <View style={styles.filterCard}>
        <Text style={styles.label}>Select Supplier</Text>
        {fetchingSuppliers ? (
          <ActivityIndicator size="small" color="#2563eb" style={{ marginVertical: 10 }} />
        ) : (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedSupplier}
              onValueChange={(val) => setSelectedSupplier(val)}
              style={styles.picker}
            >
              <Picker.Item label="-- Choose Supplier --" value="" color="#888" />
              {suppliers.map((s, i) => (
                <Picker.Item key={i} label={s} value={s} />
              ))}
            </Picker>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.btn, !selectedSupplier ? styles.btnDisabled : null]} 
          onPress={fetchLedger}
          disabled={!selectedSupplier || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>View Ledger</Text>}
        </TouchableOpacity>
      </View>

      <FlatList
        data={ledgerData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderLedgerItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          !loading && selectedSupplier ? (
            <Text style={styles.emptyText}>No transactions found for this supplier.</Text>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 15 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 15, textAlign: 'center' },
  filterCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 5 },
  pickerContainer: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#f9fafb', height: 50, justifyContent: 'center', marginBottom: 15 },
  picker: { height: 50 },
  btn: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#9ca3af' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  ledgerCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  dateText: { color: '#4b5563', fontSize: 14, fontWeight: '500' },
  typeText: { color: '#2563eb', fontSize: 12, fontWeight: 'bold', backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  refText: { color: '#6b7280', fontSize: 13, marginBottom: 10 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  amountBox: { flex: 1, alignItems: 'center' },
  amount: { fontSize: 15, marginTop: 4, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 30, fontSize: 15 }
});

export default SupplierLedgerScreen;