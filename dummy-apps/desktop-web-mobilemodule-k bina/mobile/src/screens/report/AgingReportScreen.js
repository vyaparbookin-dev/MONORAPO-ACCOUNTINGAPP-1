import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { getData } from '../../services/ApiService';
import { Ionicons } from '@expo/vector-icons';

export default function AgingReportScreen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAging = async () => {
      try {
        const res = await getData('/aging');
        if (res && res.data && res.data.success) {
          setData(res.data.data.sort((a, b) => b.totalPending - a.totalPending));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAging();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.partyName}>{item.partyName}</Text>
        <Text style={styles.totalText}>₹{item.totalPending}</Text>
      </View>
      <Text style={styles.mobile}>{item.mobileNumber}</Text>
      
      <View style={styles.breakdownRow}>
        <View style={styles.col}><Text style={styles.colLabel}>0-30 D</Text><Text style={[styles.colValue, {color: '#16a34a'}]}>₹{item['0_30']}</Text></View>
        <View style={styles.col}><Text style={styles.colLabel}>31-60 D</Text><Text style={[styles.colValue, {color: '#ca8a04'}]}>₹{item['31_60']}</Text></View>
        <View style={styles.col}><Text style={styles.colLabel}>61-90 D</Text><Text style={[styles.colValue, {color: '#ea580c'}]}>₹{item['61_90']}</Text></View>
        <View style={[styles.col, {backgroundColor: '#fef2f2', borderRadius: 4, paddingVertical: 2}]}>
          <Text style={[styles.colLabel, {color: '#dc2626'}]}>90+ D</Text>
          <Text style={[styles.colValue, {color: '#dc2626', fontWeight: 'bold'}]}>₹{item['90_plus']}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} /> : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.partyId}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 15 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No outstanding payments found!</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  partyName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', flex: 1 },
  totalText: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  mobile: { fontSize: 12, color: '#6b7280', marginBottom: 10 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#f3f4f6', paddingTop: 10 },
  col: { alignItems: 'center', flex: 1 },
  colLabel: { fontSize: 10, color: '#6b7280', marginBottom: 2 },
  colValue: { fontSize: 13, fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#6b7280', fontSize: 16 }
});