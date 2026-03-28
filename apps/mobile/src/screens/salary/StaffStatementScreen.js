import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getData } from '../../services/ApiService';
import { getStaffLocal, getStaffStatementLocal } from '../../../db'; // Offline DB

const StaffStatementScreen = () => {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingStaff, setFetchingStaff] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        // 1. Offline First
        const localStaff = await getStaffLocal();
        setStaffList(localStaff || []);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to load staff list');
      } finally {
        setFetchingStaff(false);
      }
    };
    fetchStaff();
  }, []);

  const fetchStatement = async () => {
    if (!selectedStaff) return;
    setLoading(true);
    try {
      // 1. Offline First
      const localTxns = await getStaffStatementLocal(selectedStaff);
      setTransactions(localTxns || []);
    } catch (err) {
      console.error(err);
      setTransactions([]);
      Alert.alert('Notice', 'Failed to fetch statement or no data found.');
    } finally {
      setLoading(false);
    }
  };

  const currentStaff = staffList.find(s => (s.uuid || s._id) === selectedStaff);

  const renderTransaction = ({ item }) => (
    <View style={styles.tCard}>
      <View style={styles.tHeader}>
        <Text style={styles.tDate}>{new Date(item.date).toLocaleDateString()}</Text>
        <Text style={styles.tType}>
          {item.type.replace('_', ' ').toUpperCase()} {item.status ? `(${item.status})` : ''}
        </Text>
      </View>
      {item.notes ? <Text style={styles.tNotes}>{item.notes}</Text> : null}
      
      <View style={styles.amountsRow}>
        <View style={styles.amountBox}>
          <Text style={styles.label}>Advance/Paid (-)</Text>
          <Text style={[styles.amount, { color: '#dc2626' }]}>{item.debit ? `₹${item.debit}` : '-'}</Text>
        </View>
        <View style={styles.amountBox}>
          <Text style={styles.label}>Salary/Due (+)</Text>
          <Text style={[styles.amount, { color: '#16a34a' }]}>{item.credit ? `₹${item.credit}` : '-'}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Staff Ledger / Statement</Text>

      <View style={styles.filterCard}>
        <Text style={styles.label}>Select Employee</Text>
        {fetchingStaff ? (
          <ActivityIndicator size="small" color="#2563eb" style={{ marginVertical: 10 }} />
        ) : (
          <View style={styles.pickerContainer}>
            <Picker selectedValue={selectedStaff} onValueChange={setSelectedStaff} style={styles.picker}>
              <Picker.Item label="-- Choose Employee --" value="" color="#888" />
              {staffList.map((s) => <Picker.Item key={s.uuid || s._id} label={s.name} value={s.uuid || s._id} />)}
            </Picker>
          </View>
        )}

        <TouchableOpacity style={[styles.btn, !selectedStaff && styles.btnDisabled]} onPress={fetchStatement} disabled={!selectedStaff || loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>View Statement</Text>}
        </TouchableOpacity>
      </View>

      {currentStaff && (
        <View style={[styles.balanceCard, currentStaff.balance >= 0 ? styles.bgGreen : styles.bgRed]}>
          <Text style={styles.balanceLabel}>{currentStaff.balance >= 0 ? 'Payable (Salary Due)' : 'Advance Given'}</Text>
          <Text style={styles.balanceValue}>₹{Math.abs(currentStaff.balance || 0)}</Text>
        </View>
      )}

      <FlatList
        data={transactions}
        keyExtractor={item => item._id}
        renderItem={renderTransaction}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          !loading && selectedStaff ? <Text style={styles.emptyText}>No records found.</Text> : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 15 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 15, textAlign: 'center' },
  filterCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, elevation: 2, marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 5 },
  pickerContainer: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#f9fafb', height: 50, justifyContent: 'center', marginBottom: 15 },
  picker: { height: 50 },
  btn: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#9ca3af' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  balanceCard: { padding: 15, borderRadius: 10, marginBottom: 15, alignItems: 'center', elevation: 1 },
  bgGreen: { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#bbf7d0' },
  bgRed: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fecaca' },
  balanceLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 5 },
  balanceValue: { fontSize: 26, fontWeight: 'bold', color: '#111827' },
  tCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 1 },
  tHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  tDate: { color: '#4b5563', fontWeight: 'bold' },
  tType: { color: '#2563eb', fontSize: 12, fontWeight: 'bold', backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tNotes: { color: '#6b7280', fontSize: 13, marginBottom: 10, fontStyle: 'italic' },
  amountsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  amountBox: { flex: 1, alignItems: 'center' },
  amount: { fontSize: 16, marginTop: 4, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 30, fontSize: 15 }
});

export default StaffStatementScreen;