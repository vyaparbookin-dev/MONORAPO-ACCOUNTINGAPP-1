import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { getData, postData } from '../../services/ApiService';
import { Ionicons } from '@expo/vector-icons';
import { syncQueue } from '@repo/shared/src/services/syncqueue.native';

export default function ApprovalsScreen() {
  const [pendingData, setPendingData] = useState({ bills: [], expenses: [], stockTransfers: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('bills'); // 'bills' | 'expenses' | 'transfers'

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await getData('/approvals');
      if (res && res.data && res.data.success) {
        setPendingData(res.data.data.data || res.data.data);
      }
    } catch (error) {
      console.error("Failed to load approvals", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApprovals(); }, []);

  const handleAction = (type, id, status) => {
    Alert.alert("Confirm", `Are you sure you want to ${status} this request?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Yes", onPress: async () => {
          try {
            syncQueue.enqueue({ method: 'post', url: '/approvals/update', data: { type, id, status } });
            Alert.alert("Success", `Request ${status} (Queued)`);
            fetchApprovals();
          } catch (error) {
            Alert.alert("Error", "Failed to process request");
          }
        }
      }
    ]);
  };

  const renderList = () => {
    let list = [];
    if (tab === 'bills') list = pendingData.bills || [];
    else if (tab === 'expenses') list = pendingData.expenses || [];
    else list = pendingData.stockTransfers || [];

    if (list.length === 0) {
      return <Text style={styles.emptyText}>All caught up! No pending {tab}.</Text>;
    }

    return (
      <FlatList
        data={list}
        keyExtractor={(i) => i._id}
        renderItem={({ item }) => (
          <View style={[styles.card, { borderLeftColor: tab === 'bills' ? '#3b82f6' : tab === 'expenses' ? '#eab308' : '#a855f7' }]}>
            {tab === 'bills' && <Text style={styles.title}>Invoice: {item.billNumber}</Text>}
            {tab === 'expenses' && <Text style={styles.title}>Expense: {item.title}</Text>}
            {tab === 'transfers' && <Text style={styles.title}>Transfer: #{item.transferNumber}</Text>}
            
            <Text style={styles.subText}>
              {tab === 'bills' ? `Customer: ${item.customerName}\nAmount: ₹${item.total}` : ''}
              {tab === 'expenses' ? `Category: ${item.category}\nClaimed: ₹${item.amount}` : ''}
              {tab === 'transfers' ? `Items: ${item.items?.length}` : ''}
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAction(tab.replace('s',''), item._id, 'rejected')}>
                <Text style={styles.rejectTxt}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.approveBtn} onPress={() => handleAction(tab.replace('s',''), item._id, 'approved')}>
                <Text style={styles.approveTxt}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'bills' && styles.activeTab]} onPress={() => setTab('bills')}>
          <Text style={[styles.tabTxt, tab === 'bills' && styles.activeTabTxt]}>Bills</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'expenses' && styles.activeTab]} onPress={() => setTab('expenses')}>
          <Text style={[styles.tabTxt, tab === 'expenses' && styles.activeTabTxt]}>Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'transfers' && styles.activeTab]} onPress={() => setTab('transfers')}>
          <Text style={[styles.tabTxt, tab === 'transfers' && styles.activeTabTxt]}>Transfers</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} /> : renderList()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 15 },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, padding: 4, marginBottom: 15 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  activeTab: { backgroundColor: '#2563eb' },
  tabTxt: { fontWeight: 'bold', color: '#6b7280' }, activeTabTxt: { color: '#fff' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, elevation: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  subText: { fontSize: 14, color: '#4b5563', marginBottom: 10, lineHeight: 20 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, borderTopWidth: 1, borderColor: '#f3f4f6', paddingTop: 10 },
  rejectBtn: { paddingHorizontal: 15, paddingVertical: 6, borderWidth: 1, borderColor: '#fca5a5', borderRadius: 4 }, rejectTxt: { color: '#dc2626', fontWeight: 'bold' },
  approveBtn: { paddingHorizontal: 15, paddingVertical: 6, backgroundColor: '#16a34a', borderRadius: 4 }, approveTxt: { color: '#fff', fontWeight: 'bold' }
});