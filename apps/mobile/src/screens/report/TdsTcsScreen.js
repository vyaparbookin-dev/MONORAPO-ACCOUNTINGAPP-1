import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getData, postData } from '../../services/ApiService';
import { syncQueue } from '@repo/shared/src/services/syncqueue.native';

export default function TdsTcsScreen() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const [formData, setFormData] = useState({
    type: 'TDS_PAYABLE',
    section: '',
    baseAmount: '',
    rate: ''
  });

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await getData('/tds-tcs');
      if (res && res.data && res.data.success) {
        setEntries(res.data.entries);
      }
    } catch (error) {
      console.error("Error fetching TDS:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleAddEntry = async () => {
    if (!formData.section || !formData.baseAmount || !formData.rate) {
      return Alert.alert("Error", "Please fill all fields");
    }
    try {
      const taxAmount = (parseFloat(formData.baseAmount) * parseFloat(formData.rate)) / 100;
      const payload = { ...formData, taxAmount };

      syncQueue.enqueue({ method: 'post', url: '/tds-tcs', data: payload });
      
      Alert.alert("Success", "Entry saved successfully");
      setModalVisible(false);
      setFormData({ type: 'TDS_PAYABLE', section: '', baseAmount: '', rate: '' });
      fetchEntries();
    } catch (error) {
      Alert.alert("Error", "Failed to save entry");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.typeText}>{item.type.replace('_', ' ')}</Text>
        <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.sectionText}>Section: {item.section}</Text>
      <View style={styles.amountRow}>
        <View>
          <Text style={styles.label}>Base Amount</Text>
          <Text style={styles.value}>₹{item.baseAmount}</Text>
        </View>
        <View>
          <Text style={styles.label}>Rate</Text>
          <Text style={styles.value}>{item.rate}%</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.label}>Tax Amount</Text>
          <Text style={styles.taxValue}>₹{item.taxAmount}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Add New Record</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No records found.</Text>}
        />
      )}

      {/* Add Entry Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add TDS/TCS Entry</Text>
            
            <View style={styles.pickerContainer}>
              <Picker selectedValue={formData.type} onValueChange={(itemValue) => setFormData({...formData, type: itemValue})}>
                <Picker.Item label="TDS Payable (You deducted)" value="TDS_PAYABLE" />
                <Picker.Item label="TDS Receivable (Party deducted)" value="TDS_RECEIVABLE" />
                <Picker.Item label="TCS Payable (You collected)" value="TCS_PAYABLE" />
                <Picker.Item label="TCS Receivable (Party collected)" value="TCS_RECEIVABLE" />
              </Picker>
            </View>

            <TextInput placeholder="Section (e.g. 194J)" style={styles.input} value={formData.section} onChangeText={(text) => setFormData({...formData, section: text})} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput placeholder="Base Amount" keyboardType="numeric" style={[styles.input, { flex: 1 }]} value={formData.baseAmount} onChangeText={(text) => setFormData({...formData, baseAmount: text})} />
              <TextInput placeholder="Rate %" keyboardType="numeric" style={[styles.input, { flex: 1 }]} value={formData.rate} onChangeText={(text) => setFormData({...formData, rate: text})} />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleAddEntry} style={styles.saveBtn}><Text style={styles.saveBtnText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 15 },
  addButton: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  typeText: { fontWeight: 'bold', color: '#1f2937', fontSize: 16 },
  dateText: { color: '#6b7280', fontSize: 12 },
  sectionText: { color: '#4b5563', marginBottom: 10, fontSize: 14 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#f3f4f6', paddingTop: 10 },
  label: { fontSize: 11, color: '#6b7280' },
  value: { fontSize: 14, fontWeight: '600', color: '#374151' },
  taxValue: { fontSize: 16, fontWeight: 'bold', color: '#dc2626' },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  pickerContainer: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#d1d5db', padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { padding: 12 }, cancelBtnText: { color: '#4b5563', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 }, saveBtnText: { color: '#fff', fontWeight: 'bold' }
});