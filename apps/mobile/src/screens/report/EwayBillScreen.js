import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getData, postData } from '../../services/ApiService';

export default function EwayBillScreen() {
  const [docs, setDocs] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [selectedBill, setSelectedBill] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ewayRes, billsRes] = await Promise.all([
        getData('/ewaybill'),
        getData('/billing?limit=50')
      ]);
      if (ewayRes?.data?.success) setDocs(ewayRes.data.data);
      if (billsRes?.data?.success || billsRes?.bills) setBills(billsRes.data?.bills || billsRes.bills || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleGenerate = async () => {
    if (!selectedBill) return Alert.alert("Error", "Please select an invoice");
    setGenerating(true);
    try {
      const res = await postData('/ewaybill/generate', { billId: selectedBill, vehicleNumber: vehicleNo, isEInvoice: true });
      if (res && res.success) {
        Alert.alert("Success", "E-Way Bill & IRN generated successfully");
        setModalVisible(false);
        setSelectedBill('');
        setVehicleNo('');
        fetchData();
      } else {
        Alert.alert("Error", "Failed to generate");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.invoiceText}>Inv: {item.invoiceNumber}</Text>
        <Text style={styles.statusBadge}>{item.status.toUpperCase()}</Text>
      </View>
      <Text style={styles.ewayText}>E-Way No: {item.ewayBillNumber}</Text>
      <Text style={styles.irnText} numberOfLines={1}>IRN: {item.irn || 'N/A'}</Text>
      <Text style={styles.dateText}>Valid Upto: {new Date(item.validUpto).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.genButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.genBtnText}>+ Generate Govt. E-Way Bill</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} /> : (
        <FlatList
          data={docs}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.empty}>No E-Way Bills generated yet.</Text>}
        />
      )}

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Generate via NIC Portal</Text>
            
            <View style={styles.pickerContainer}>
              <Picker selectedValue={selectedBill} onValueChange={(val) => setSelectedBill(val)}>
                <Picker.Item label="-- Select Invoice --" value="" />
                {bills.map(b => (
                  <Picker.Item key={b._id} label={`${b.billNumber || b.billNo} (₹${b.finalAmount || b.total})`} value={b._id} />
                ))}
              </Picker>
            </View>

            <TextInput 
              placeholder="Vehicle Number (e.g. MP09AB1234)" 
              style={styles.input} 
              value={vehicleNo} 
              onChangeText={setVehicleNo} 
              autoCapitalize="characters"
            />

            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}><Text style={styles.cancelTxt}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleGenerate} style={styles.saveBtn} disabled={generating}>
                <Text style={styles.saveTxt}>{generating ? 'Connecting...' : 'Generate'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 15 },
  genButton: { backgroundColor: '#16a34a', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  genBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  invoiceText: { fontWeight: 'bold', fontSize: 16, color: '#1f2937' },
  statusBadge: { backgroundColor: '#dcfce7', color: '#16a34a', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  ewayText: { fontSize: 16, color: '#2563eb', fontWeight: 'bold', fontFamily: 'monospace', marginBottom: 4 },
  irnText: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  dateText: { fontSize: 12, color: '#dc2626', fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }, modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10 }, modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 }, pickerContainer: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, marginBottom: 15 }, input: { borderWidth: 1, borderColor: '#d1d5db', padding: 12, borderRadius: 8, marginBottom: 15 }, actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }, cancelBtn: { padding: 12 }, cancelTxt: { color: '#4b5563', fontWeight: 'bold' }, saveBtn: { backgroundColor: '#16a34a', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 }, saveTxt: { color: '#fff', fontWeight: 'bold' }
});