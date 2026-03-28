import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { getData, postData } from '../../services/ApiService';
import { getBranchesLocal, addBranchLocal } from '../../../db'; // Offline DB

const BranchScreen = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({ name: '', address: '', contactNumber: '' });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      // 1. Offline First: Fetch from SQLite
      const localBranches = await getBranchesLocal();
      setBranches(localBranches || []);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load branches');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) return Alert.alert('Error', 'Branch Name is required');
    setLoading(true);
    try {
      // 1. Offline First: Save to SQLite
      const localResult = await addBranchLocal(formData);
      if (!localResult.success) throw new Error("Failed to save locally");

      Alert.alert('Success', 'Branch created successfully!');
      setFormData({ name: '', address: '', contactNumber: '' });
      fetchBranches(); // Refresh list
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add branch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Manage Branches</Text>

      <View style={styles.formCard}>
        <TextInput 
          style={styles.input} 
          placeholder="Branch Name (e.g. Noida Store)" 
          value={formData.name} 
          onChangeText={txt => setFormData({...formData, name: txt})} 
        />
        <TextInput 
          style={styles.input} 
          placeholder="Contact Number" 
          value={formData.contactNumber} 
          keyboardType="phone-pad"
          onChangeText={txt => setFormData({...formData, contactNumber: txt})} 
        />
        <TextInput 
          style={styles.input} 
          placeholder="Address" 
          value={formData.address} 
          onChangeText={txt => setFormData({...formData, address: txt})} 
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Branch</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.subHeader}>Existing Branches</Text>
      {fetching ? <ActivityIndicator size="large" color="#2563eb" /> : (
        <FlatList
          data={branches}
          keyExtractor={item => item.uuid || item._id || Math.random().toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.branchName}>
                  {item.name} {item.isMainBranch && <Text style={{color: '#16a34a', fontSize: 12}}> (Main)</Text>}
                </Text>
                <Text style={styles.details}>{item.contactNumber || 'No Contact'}</Text>
              </View>
              <Text style={{color: item.isActive ? '#16a34a' : '#dc2626', fontWeight: 'bold'}}>
                {item.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          )}
          ListEmptyComponent={<Text style={{textAlign: 'center', color: '#888'}}>No branches found.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 15 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 15, textAlign: 'center' },
  formCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: '#f9fafb' },
  saveBtn: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  subHeader: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 10 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1 },
  branchName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  details: { fontSize: 13, color: '#6b7280', marginTop: 3 }
});

export default BranchScreen;