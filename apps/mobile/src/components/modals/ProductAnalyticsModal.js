import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import api from '../../services/ApiService';
import { Ionicons } from '@expo/vector-icons';

// Dummy auth context hook - replace with your actual implementation
const useAuth = () => ({ user: { role: 'owner' } }); // DUMMY: 'owner', 'manager', or 'staff'

const ProductAnalyticsModal = ({ productId, visible, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth(); // Get user from auth context
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!productId) return;
      setLoading(true);
      try {
        const res = await api.get(`/products/${productId}/analytics`);
        setData(res.analytics);
      } catch (err) {
        console.error("Failed to fetch product analytics", err);
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      fetchAnalytics();
    }
  }, [productId, visible]);

  const { product, profitability, daysInStock, purchaseHistory } = data || {};

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
          <Text style={styles.modalTitle}>{product?.name} - Analytics</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#2563eb" style={{ marginVertical: 40 }} />
          ) : data ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Key Metrics */}
              <View style={styles.statsGrid}>
                <View style={[styles.statBox, {backgroundColor: '#dbeafe'}]}>
                  <Text style={[styles.statLabel, {color: '#1e40af'}]}>Current Stock</Text>
                  <Text style={[styles.statValue, {color: '#1d4ed8'}]}>{product?.currentStock} {product?.unit}</Text>
                </View>
                {(user.role === 'owner' || user.role === 'manager') ? (
                  <View style={[styles.statBox, {backgroundColor: '#dcfce7'}]}>
                    <Text style={[styles.statLabel, {color: '#166534'}]}>Profit Margin</Text>
                    <Text style={[styles.statValue, {color: '#15803d'}]}>{profitability?.margin?.toFixed(1) || 0}%</Text>
                  </View>
                ) : <View style={styles.statBox} /> /* Empty box to maintain layout */}
              </View>
              <View style={styles.statsGrid}>
                {(user.role === 'owner' || user.role === 'manager') && (
                  <View style={[styles.statBox, {backgroundColor: '#f3e8ff'}]}>
                    <Text style={[styles.statLabel, {color: '#581c87'}]}>Total Profit</Text>
                    <Text style={[styles.statValue, {color: '#7e22ce'}]}>₹{profitability?.totalProfit?.toFixed(0) || 0}</Text>
                  </View>
                )}
                <View style={[styles.statBox, {backgroundColor: '#fef9c3'}]}>
                  <Text style={[styles.statLabel, {color: '#854d0e'}]}>Days in Stock</Text>
                  <Text style={[styles.statValue, {color: '#a16207'}]}>{daysInStock}</Text>
                </View>
              </View>

              {/* Purchase History */}
              <View style={{marginTop: 20}}>
                <Text style={styles.subHeader}>Recent Purchase History</Text>
                {purchaseHistory?.length > 0 ? (
                  purchaseHistory.map(p => (
                    <View key={p._id} style={styles.historyRow}>
                      <View>
                        <Text style={styles.historyText}>From: {p.partyId?.name || 'N/A'}</Text>
                        <Text style={styles.historyDate}>{new Date(p.date).toLocaleDateString()}</Text>
                      </View>
                      <Text style={styles.historyAmount}>₹{p.items.find(i => i.productId.toString() === productId)?.price?.toFixed(2) || '0.00'}/unit</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{color: '#6b7280', textAlign: 'center'}}>No purchase history.</Text>
                )}
              </View>

            </ScrollView>
          ) : (
            <View style={{padding: 40, alignItems: 'center'}}><Text style={{color: '#6b7280'}}>Could not load product data.</Text></View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: '75%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#1f2937' },
  modalCloseButton: { position: 'absolute', top: 15, right: 15, zIndex: 1 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statBox: { padding: 15, borderRadius: 12, alignItems: 'center', width: '48%' },
  statLabel: { fontSize: 13, fontWeight: '600' },
  statValue: { fontSize: 20, fontWeight: 'bold', marginTop: 5 },
  subHeader: { fontSize: 16, fontWeight: 'bold', color: '#4b5563', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 8, marginBottom: 12 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, marginBottom: 8 },
  historyText: { color: '#374151', fontWeight: '500' },
  historyDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  historyAmount: { fontWeight: 'bold', color: '#1f2937' }
});

export default ProductAnalyticsModal;