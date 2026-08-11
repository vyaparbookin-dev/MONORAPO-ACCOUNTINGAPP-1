import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getData } from '../../services/ApiService';
import { Ionicons } from '@expo/vector-icons';

export default function NonMovingStockScreen() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(90);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await getData(`/reports/non-moving-items?days=${days}`);
      if (res && res.data && res.data.success) {
        setReportData(res.data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch non-moving stock:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [days]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.itemName}>{item.name}</Text>
      <View style={styles.detailsRow}>
        <Text style={styles.detailText}>Stock: <Text style={styles.stockValue}>{item.currentStock} {item.unit}</Text></Text>
        <Text style={styles.detailText}>Value: <Text style={styles.stockValue}>₹{(item.currentStock * item.costPrice).toFixed(0)}</Text></Text>
      </View>
      <Text style={styles.lastSaleText}>
        Last Sale: {item.lastSaleDate ? new Date(item.lastSaleDate).toLocaleDateString() : 'Never Sold'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Non-Moving Stock</Text>
        <TouchableOpacity onPress={fetchReport} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={days}
          onValueChange={(itemValue) => setDays(itemValue)}
        >
          <Picker.Item label="Not sold in last 30 days" value={30} />
          <Picker.Item label="Not sold in last 60 days" value={60} />
          <Picker.Item label="Not sold in last 90 days" value={90} />
          <Picker.Item label="Not sold in last 180 days" value={180} />
        </Picker>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={reportData}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No non-moving items found for this period.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  refreshBtn: { padding: 5 },
  pickerContainer: { marginHorizontal: 15, marginBottom: 10, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#fff' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 1, borderWidth: 1, borderColor: '#e5e7eb' },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailText: { fontSize: 14, color: '#4b5563' },
  stockValue: { fontWeight: '600', color: '#111827' },
  lastSaleText: { fontSize: 12, color: '#6b7280', fontStyle: 'italic', borderTopWidth: 1, borderColor: '#f3f4f6', paddingTop: 8 },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#6b7280', fontSize: 16 }
});