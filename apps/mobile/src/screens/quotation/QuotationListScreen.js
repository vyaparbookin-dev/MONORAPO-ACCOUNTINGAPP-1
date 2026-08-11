import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/ApiService'; // Assuming ApiService is the wrapper for shared api

export default function QuotationListScreen({ navigation }) {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/quotations'); // No /api/ prefix needed for mobile api service
      setQuotations(res.data.data || []); // Assuming res.data.data structure from backend
    } catch (err) {
      console.error("Failed to fetch quotations", err);
      Alert.alert("Error", "Failed to load quotations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchQuotations(); // Refresh data when screen comes into focus
    });
    return unsubscribe;
  }, [navigation]);

  const updateStatus = async (id, status) => {
    Alert.alert(
      "Confirm Status Change",
      `Are you sure you want to change status to ${status}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              await api.patch(`/quotations/${id}/status`, { status });
              fetchQuotations();
            } catch (err) {
              console.error("Failed to update status", err);
              Alert.alert("Error", "Failed to update status.");
            }
          },
        },
      ]
    );
  };

  const renderQuotationItem = ({ item }) => (
    <View style={styles.quotationCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.quotationNumber}>#{item.quotationNumber}</Text>
        <Text style={styles.quotationAmount}>₹{item.totalAmount.toFixed(2)}</Text>
      </View>
      <Text style={styles.customerName}>{item.partyId?.name || 'Walk-in Customer'}</Text>
      <Text style={styles.date}>Date: {new Date(item.date).toLocaleDateString()}</Text>
      <View style={[styles.statusBadge, item.status === 'accepted' ? styles.statusAccepted : item.status === 'rejected' ? styles.statusRejected : styles.statusPending]}>
        <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => navigation.navigate('CreateQuotation', { quotationId: item._id })} style={styles.actionButton}>
          <Ionicons name="create-outline" size={20} color="#2563eb" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => updateStatus(item._id, 'sent')} style={styles.actionButton}>
          <Ionicons name="send-outline" size={20} color="#10b981" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => updateStatus(item._id, 'rejected')} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quotations</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateQuotation')} style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.addButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
      ) : quotations.length === 0 ? (
        <Text style={styles.emptyMessage}>No quotations found. Tap '+' to create one!</Text>
      ) : (
        <FlatList
          data={quotations}
          renderItem={renderQuotationItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#111827', paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  addButtonText: { color: '#fff', marginLeft: 5, fontWeight: 'bold' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyMessage: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#6b7280' },
  listContent: { padding: 10 },
  quotationCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  quotationNumber: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
  quotationAmount: { fontSize: 16, fontWeight: 'bold', color: '#2563eb' },
  customerName: { fontSize: 14, color: '#4b5563', marginBottom: 3 },
  date: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 15, alignSelf: 'flex-start', marginBottom: 10 },
  statusAccepted: { backgroundColor: '#dcfce7' },
  statusRejected: { backgroundColor: '#fee2e2' },
  statusPending: { backgroundColor: '#fef3c7' },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#374151' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  actionButton: { marginLeft: 15 },
});