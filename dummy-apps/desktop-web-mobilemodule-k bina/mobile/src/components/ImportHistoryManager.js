import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import api from '../services/ApiService';

const ImportHistoryManager = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/inventory/import-batches');
      setBatches(res.data?.batches || []);
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const deleteBatch = (batchId, itemCount) => {
    Alert.alert(
      "Delete Batch",
      `Are you sure you want to delete ${itemCount} products from batch ${batchId}?\n\nNote: Unused products will be permanently deleted. Products already used in billing will be safely archived (soft-deleted).`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const res = await api.post('/api/inventory/bulk-delete', { batchId });
              Alert.alert("Success", res.data?.message || "Batch deleted");
              fetchBatches(); // Refresh list after delete
            } catch (error) {
              Alert.alert("Error", "Failed to delete batch.");
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Excel Import History</Text>
      <Text style={styles.subtitle}>Manage your bulk uploaded products. You can delete entire Excel imports if you made a mistake.</Text>
      
      {loading ? (
        <ActivityIndicator size="small" color="#2563eb" style={{ margin: 10 }} />
      ) : batches.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No import batches found.</Text>
        </View>
      ) : (
        batches.map((batch) => (
          <View key={batch._id} style={styles.batchCard}>
            <View style={styles.batchInfo}>
              <Text style={styles.batchId}>Batch: {batch._id}</Text>
              <Text style={styles.batchDetails}>{batch.itemCount} Products</Text>
              <Text style={styles.batchDate}>{new Date(batch.uploadDate).toLocaleString()}</Text>
            </View>
            <TouchableOpacity 
              style={styles.deleteBtn}
              onPress={() => deleteBatch(batch._id, batch.itemCount)}
            >
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 10 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 5 },
  subtitle: { fontSize: 12, color: '#6b7280', marginBottom: 15 },
  emptyBox: { padding: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: '#d1d5db', borderRadius: 8, alignItems: 'center' },
  emptyText: { color: '#6b7280' },
  batchCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 10 },
  batchInfo: { flex: 1 },
  batchId: { fontWeight: 'bold', color: '#1f2937', fontSize: 14, marginBottom: 4 },
  batchDetails: { color: '#4b5563', fontSize: 12 },
  batchDate: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  deleteBtn: { backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#fecaca' },
  deleteBtnText: { color: '#dc2626', fontWeight: '600', fontSize: 12 }
});

export default ImportHistoryManager;