import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getData, postData } from '../../services/ApiService';
import { getBranchesLocal, getWarehousesLocal, addWarehouseLocal } from '../../../db'; // Offline DB

const AddWarehouseScreen = () => {
  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({ branchId: '', name: '', location: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. Offline First: Fetch from SQLite
      const localBranches = await getBranchesLocal();
      const localWarehouses = await getWarehousesLocal();
      
      setBranches(localBranches || []);
      setWarehouses(localWarehouses || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.branchId || !formData.name) return Alert.alert('Error', 'Branch and Warehouse Name required');
    setLoading(true);
    try {
      // 1. Offline First: Save to SQLite
      const localResult = await addWarehouseLocal(formData);
      if (!localResult.success) throw new Error("Failed to save locally");

      // await postData('/warehouse', formData);
      Alert.alert('Success', 'Warehouse added successfully!');
      setFormData({ branchId: '', name: '', location: '' });
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add warehouse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Manage Godowns / Warehouses</Text>

      <View style={styles.formCard}>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={formData.branchId} onValueChange={val => setFormData({...formData, branchId: val})} style={styles.picker}>
            <Picker.Item label="-- Select Branch --" value="" color="#888" />
            {branches.map(b => <Picker.Item key={b.uuid || b._id} label={b.name} value={b.uuid || b._id} />)}
          </Picker>
        </View>
        
        <TextInput 
          style={styles.input} 
          placeholder="Warehouse Name (e.g. Basement)" 
          value={formData.name} 
          onChangeText={txt => setFormData({...formData, name: txt})} 
        />
        <TextInput 
          style={styles.input} 
          placeholder="Location Details" 
          value={formData.location} 
          onChangeText={txt => setFormData({...formData, location: txt})} 
        />
        
        <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Warehouse</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.subHeader}>Existing Warehouses</Text>
      {fetching ? <ActivityIndicator size="large" color="#ea580c" /> : (
        <FlatList
          data={warehouses}
          keyExtractor={item => item.uuid || item._id || Math.random().toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.whName}>{item.name}</Text>
                <Text style={styles.branchName}>Branch: {item.branchName || item.branchId?.name || 'N/A'}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={{textAlign: 'center', color: '#888'}}>No warehouses found.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 15 },
  header: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 15, textAlign: 'center' },
  formCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
  pickerContainer: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#f9fafb', height: 45, justifyContent: 'center', marginBottom: 10 },
  picker: { height: 45 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: '#f9fafb' },
  saveBtn: { backgroundColor: '#ea580c', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  subHeader: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 10 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1, borderLeftWidth: 4, borderLeftColor: '#ea580c' },
  whName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  branchName: { fontSize: 13, color: '#2563eb', marginTop: 4, fontWeight: '500' }
});

export default AddWarehouseScreen;