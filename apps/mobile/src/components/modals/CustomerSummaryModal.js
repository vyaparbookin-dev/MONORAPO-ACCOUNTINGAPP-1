import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import api from '../../services/ApiService';
import { Ionicons } from '@expo/vector-icons';

// Dummy auth context hook - replace with your actual implementation
const useAuth = () => ({ user: { role: 'owner' } }); // DUMMY: 'owner', 'manager', or 'staff'

const CustomerSummaryModal = ({ partyId, visible, onClose }) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSummary = async () => {
      if (!partyId) return;
      setLoading(true);
      try {
        const res = await api.get(`/parties/${partyId}/summary`);
        setCustomer(res.summary);
      } catch (err) {
        console.error("Failed to fetch customer summary", err);
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      fetchSummary();
    }
  }, [partyId, visible]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Ionicons name="close-circle" size={30} color="#9ca3af" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Customer 360° View</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#2563eb" style={{ marginVertical: 40 }} />
          ) : customer ? (
            <ScrollView>
              <View style={{alignItems: 'center', marginBottom: 20}}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={40} color="#2563eb" />
                </View>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerMobile}>{customer.mobileNumber}</Text>
              </View>

              <View style={styles.statsGrid}>
                {(user.role === 'owner' || user.role === 'manager') && (
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Lifetime Value</Text>
                    <Text style={styles.statValue}>₹{customer.lifetimeValue?.toFixed(2)}</Text>
                  </View>
                )}
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Total Visits</Text>
                  <Text style={styles.statValue}>{customer.visitCount}</Text>
                </View>
                <View style={[styles.statBox, {backgroundColor: '#fee2e2'}]}>
                  <Text style={[styles.statLabel, {color: '#991b1b'}]}>Returns ({customer.returnCount})</Text>
                  <Text style={[styles.statValue, {color: '#dc2626'}]}>₹{customer.totalReturnValue?.toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.statBoxFull}>
                  <Text style={styles.statLabel}>First / Last Visit</Text>
                  <Text style={styles.statValueSmall}>
                    {new Date(customer.firstVisit).toLocaleDateString()} / {new Date(customer.lastVisit).toLocaleDateString()}
                  </Text>
              </View>

              <View style={{marginTop: 20, marginBottom: 10}}>
                <Text style={styles.subHeader}>Top Purchased Products</Text>
                {customer.topProducts?.length > 0 ? (
                  customer.topProducts.map(prod => (
                    <View key={prod.name} style={styles.productRow}>
                      <Text style={styles.productName}>{prod.name}</Text>
                      <Text style={styles.productQty}>{prod.quantity} units</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{color: '#6b7280', textAlign: 'center'}}>No product data available.</Text>
                )}
              </View>

              <View style={{marginTop: 10}}>
                <Text style={styles.subHeader}>Recent Transactions</Text>
                {customer.transactionHistory?.length > 0 ? (
                  customer.transactionHistory.map((tx, index) => (
                    <View key={index} style={styles.productRow}>
                      <View>
                        <Text style={styles.productName}>{tx.details}</Text>
                        <Text style={styles.txDate}>{new Date(tx.date).toLocaleDateString()}</Text>
                      </View>
                      <Text style={[styles.productQty, { color: tx.type === 'Sale' ? '#16a34a' : '#dc2626' }]}>{tx.type === 'Sale' ? `+₹${tx.amount.toFixed(2)}` : `-₹${Math.abs(tx.amount).toFixed(2)}`}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{color: '#6b7280', textAlign: 'center'}}>No recent transactions found.</Text>
                )}
              </View>

            </ScrollView>
          ) : (
            <View style={{padding: 40, alignItems: 'center'}}>
              <Text style={{color: '#6b7280'}}>Could not load customer data.</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: '80%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  modalCloseButton: { position: 'absolute', top: 15, right: 15 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  customerName: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  customerMobile: { fontSize: 16, color: '#6b7280' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 15 },
  statBox: { backgroundColor: '#f9fafb', padding: 15, borderRadius: 10, alignItems: 'center', width: '48%', marginBottom: 10 },
  statBoxFull: { backgroundColor: '#f9fafb', padding: 15, borderRadius: 10, alignItems: 'center', width: '100%', marginTop: 10 },
  statLabel: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#2563eb', marginTop: 5 },
  statValueSmall: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginTop: 5 },
  subHeader: { fontSize: 16, fontWeight: 'bold', color: '#4b5563', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 8, marginBottom: 10 },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, marginBottom: 8 },
  productName: { color: '#374151', flex: 1 },
  productQty: { fontWeight: 'bold' },
  txDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 }
});

export default CustomerSummaryModal;