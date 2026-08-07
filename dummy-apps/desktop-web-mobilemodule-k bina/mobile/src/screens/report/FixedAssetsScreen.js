import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getData, postData } from '../../services/ApiService';
import { syncQueue } from '@repo/shared/src/services/syncqueue.native';

export default function FixedAssetsScreen() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [formData, setFormData] = useState({
    assetName: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: '',
    depreciationRate: '',
    depreciationMethod: 'WDV'
  });

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await getData('/fixed-assets');
      if (res && res.data && res.data.success) {
        setAssets(res.data.assets);
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleAddAsset = async () => {
    if (!formData.assetName || !formData.purchaseCost || !formData.depreciationRate) {
      return Alert.alert("Error", "Please fill required fields");
    }
    try {
      const res = await postData('/fixed-assets', formData);
      
      syncQueue.enqueue({ method: 'post', url: '/fixed-assets', data: formData });
      
      Alert.alert("Success", "Fixed Asset saved successfully");
      setModalVisible(false);
      setFormData({ assetName: '', purchaseDate: new Date().toISOString().split('T')[0], purchaseCost: '', depreciationRate: '', depreciationMethod: 'WDV' });
      fetchAssets();
    } catch (error) {
      Alert.alert("Error", "Failed to save asset");
    }
  };

  const handleCalculateDepreciation = () => {
    Alert.alert(
      "Confirm", 
      "Apply yearly depreciation to all active assets? This will permanently update their current values.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Apply", onPress: async () => {
            setCalculating(true);
            try {
              const res = await postData('/fixed-assets/calculate-depreciation');
              if (res && res.success) {
                Alert.alert("Success", "Depreciation applied to all assets!");
                fetchAssets();
              }
            } catch (error) {
              Alert.alert("Error", "Failed to calculate depreciation");
            } finally {
              setCalculating(false);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.titleText}>{item.assetName}</Text>
        <Text style={styles.statusBadge}>{item.status.toUpperCase()}</Text>
      </View>
      <Text style={styles.dateText}>Purchased: {new Date(item.purchaseDate).toLocaleDateString()}</Text>
      <View style={styles.amountRow}>
        <View>
          <Text style={styles.label}>Original Cost</Text>
          <Text style={styles.value}>₹{item.purchaseCost}</Text>
        </View>
        <View>
          <Text style={styles.label}>Dep. Rate</Text>
          <Text style={styles.value}>{item.depreciationRate}% {item.depreciationMethod}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.label}>Current Value</Text>
          <Text style={styles.taxValue}>₹{Math.round(item.currentValue)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.btnText}>+ Add Asset</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.depButton} onPress={handleCalculateDepreciation} disabled={calculating}>
          <Text style={styles.btnText}>{calculating ? 'Processing...' : 'Run Depreciation'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={assets}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No assets found.</Text>}
        />
      )}

      {/* Add Asset Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Fixed Asset</Text>
            <TextInput placeholder="Asset Name (e.g. Computer)" style={styles.input} value={formData.assetName} onChangeText={(t) => setFormData({...formData, assetName: t})} />
            <TextInput placeholder="Purchase Date (YYYY-MM-DD)" style={styles.input} value={formData.purchaseDate} onChangeText={(t) => setFormData({...formData, purchaseDate: t})} />
            <TextInput placeholder="Purchase Cost (₹)" keyboardType="numeric" style={styles.input} value={formData.purchaseCost} onChangeText={(t) => setFormData({...formData, purchaseCost: t})} />
            <TextInput placeholder="Depreciation Rate % (e.g. 10)" keyboardType="numeric" style={styles.input} value={formData.depreciationRate} onChangeText={(t) => setFormData({...formData, depreciationRate: t})} />
            <View style={styles.pickerContainer}>
              <Picker selectedValue={formData.depreciationMethod} onValueChange={(val) => setFormData({...formData, depreciationMethod: val})}>
                <Picker.Item label="WDV (Written Down Value)" value="WDV" />
                <Picker.Item label="SLM (Straight Line)" value="SLM" />
              </Picker>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}><Text style={{ color: '#4b5563', fontWeight: '600' }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleAddAsset} style={styles.saveBtn}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 15 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  addButton: { flex: 1, backgroundColor: '#2563eb', padding: 15, borderRadius: 8, alignItems: 'center' },
  depButton: { flex: 1, backgroundColor: '#eab308', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }, titleText: { fontWeight: 'bold', fontSize: 16, color: '#1f2937' },
  statusBadge: { backgroundColor: '#dcfce7', color: '#16a34a', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  dateText: { color: '#6b7280', fontSize: 12, marginBottom: 10 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#f3f4f6', paddingTop: 10 }, label: { fontSize: 11, color: '#6b7280' }, value: { fontSize: 14, fontWeight: '600', color: '#374151' }, taxValue: { fontSize: 16, fontWeight: 'bold', color: '#2563eb' },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 20 }, modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }, modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10 }, modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 }, input: { borderWidth: 1, borderColor: '#d1d5db', padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 14 }, pickerContainer: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, marginBottom: 15 }, modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 }, cancelBtn: { padding: 12 }, saveBtn: { backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 }
});