import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Platform, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { getData } from '../../services/ApiService';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';

const PartyStatementScreen = ({ route }) => {
  const { partyId } = route.params;
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [dateFilter, setDateFilter] = useState('this_month'); // Default to this month

  const fetchStatement = async () => {
    try {
      // NOTE: Iske liye backend mein ek naya API endpoint '/api/party/:id/statement' banana hoga.
      const res = await getData(`/party/${partyId}/statement`);
      setStatement(res.data);
    } catch (error) {
      console.error("Error fetching party statement:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, [partyId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStatement();
  }, [partyId]);

  const getFilteredTransactions = () => {
    if (!statement?.transactions) return [];
    if (dateFilter === 'all') return statement.transactions;
    
    const now = new Date();
    return statement.transactions.filter(t => {
      const d = new Date(t.date);
      if (dateFilter === 'this_month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (dateFilter === 'last_month') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
      }
      if (dateFilter === 'this_quarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const tQuarter = Math.floor(d.getMonth() / 3);
        return currentQuarter === tQuarter && d.getFullYear() === now.getFullYear();
      }
      if (dateFilter === 'this_year') {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const generateStatementHtml = (stmt, filteredTxns) => {
    const rows = filteredTxns.map(t => `
      <tr>
        <td>${new Date(t.date).toLocaleDateString()}</td>
        <td>${t.details}</td>
        <td style="color: #dc2626; text-align: right;">${t.debit ? `₹${t.debit.toFixed(2)}` : '-'}</td>
        <td style="color: #16a34a; text-align: right;">${t.credit ? `₹${t.credit.toFixed(2)}` : '-'}</td>
      </tr>
    `).join('') || '<tr><td colspan="4" style="text-align:center; padding: 20px;">No transactions found</td></tr>';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Party Statement</title>
          <style>
            body { font-family: 'Helvetica', Arial, sans-serif; padding: 20px; color: #333; }
            h2 { text-align: center; color: #111827; margin-bottom: 5px; }
            .summary { text-align: center; margin-bottom: 20px; padding: 20px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
            .balance { font-size: 26px; font-weight: bold; margin-top: 10px; }
            .positive { color: #16a34a; }
            .negative { color: #dc2626; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #d1d5db; padding: 12px; text-align: left; font-size: 14px; }
            th { background-color: #f3f4f6; font-weight: bold; color: #374151; }
          </style>
        </head>
        <body>
          <h2>Statement of Account</h2>
          <div class="summary">
            <h3 style="margin:0; font-size: 20px;">${stmt.party?.name || 'Customer/Supplier'} (${dateFilter.replace('_', ' ').toUpperCase()})</h3>
            <p style="margin:5px 0 0 0; color: #6b7280;">Closing Balance</p>
            <div class="balance ${stmt.party?.currentBalance < 0 ? 'negative' : 'positive'}">
              ₹${Math.abs(stmt.party?.currentBalance || 0).toFixed(2)} 
              <span style="font-size: 16px;">${stmt.party?.currentBalance < 0 ? '(Udhar / Debit)' : '(Jama / Credit)'}</span>
            </div>
          </div>
          <table>
            <tr>
              <th>Date</th>
              <th>Particulars</th>
              <th style="text-align: right;">Debit (Udhar)</th>
              <th style="text-align: right;">Credit (Jama)</th>
            </tr>
            ${rows}
          </table>
        </body>
      </html>
    `;
  };

  const handleSharePDF = async () => {
    if (!statement) return;
    setIsSharing(true);
    try {
      const filteredTxns = getFilteredTransactions();
      const html = generateStatementHtml(statement, filteredTxns);
      const { uri } = await Print.printToFileAsync({ html });
      await shareAsync(uri, { dialogTitle: `Share Statement - ${statement.party?.name}` });
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert('Error', 'Could not generate or share PDF.');
    } finally {
      setIsSharing(false);
    }
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.leftCol}>
        <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
        <Text style={styles.details}>{item.details}</Text>
      </View>
      <View style={styles.rightCol}>
        <Text style={styles.debit}>{item.debit ? `₹${item.debit.toFixed(2)}` : ''}</Text>
        <Text style={styles.credit}>{item.credit ? `₹${item.credit.toFixed(2)}` : ''}</Text>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1 }} />;
  }

  if (!statement) {
    return <Text style={styles.emptyText}>Could not load statement. Backend API might be missing.</Text>;
  }

  const filteredTransactions = getFilteredTransactions();

  const filters = [
    { id: 'all', label: 'All Time' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_quarter', label: 'Quarterly' },
    { id: 'this_year', label: 'This Year' }
  ];

  const renderFilters = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
        {filters.map(f => (
          <TouchableOpacity key={f.id} onPress={() => setDateFilter(f.id)} style={[styles.filterChip, dateFilter === f.id && styles.activeChip]}>
            <Text style={[styles.filterChipText, dateFilter === f.id && styles.activeChipText]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.partyName}>{statement.party?.name}</Text>
        <Text style={styles.balanceLabel}>Closing Balance</Text>
        <Text style={[styles.closingBalance, (statement.party?.currentBalance || 0) < 0 ? styles.negative : styles.positive]}>
          ₹{Math.abs(statement.party?.currentBalance || 0).toFixed(2)}
        </Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleSharePDF} disabled={isSharing}>
          {isSharing ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Ionicons name="document-text-outline" size={18} color="#fff" />
              <Text style={styles.shareBtnText}>Share PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {renderFilters()}

      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, { flex: 2 }]}>Date & Particulars</Text>
        <Text style={[styles.headerText, { textAlign: 'right' }]}>Debit (Udhar)</Text>
        <Text style={[styles.headerText, { textAlign: 'right' }]}>Credit (Jama)</Text>
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item, index) => item._id || index.toString()}
        renderItem={renderTransaction}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No transactions found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 15,
    borderRadius: 10,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  partyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 10,
  },
  closingBalance: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 5,
  },
  positive: {
    color: '#16a34a', // Green for credit (Jama)
  },
  negative: {
    color: '#dc2626', // Red for debit (Udhar)
  },
  shareBtn: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  shareBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginLeft: 8 },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#e5e7eb',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#d1d5db',
  },
  filterContainer: { marginBottom: 10 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#e5e7eb', borderRadius: 20, marginRight: 10 },
  activeChip: { backgroundColor: '#2563eb' },
  filterChipText: { color: '#4b5563', fontWeight: 'bold', fontSize: 13 },
  activeChipText: { color: '#fff' },
  headerText: {
    flex: 1,
    fontWeight: 'bold',
    color: '#4b5563',
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  leftCol: {
    flex: 2,
  },
  rightCol: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: 12,
    color: '#6b7280',
  },
  details: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
    marginTop: 2,
  },
  debit: {
    flex: 1,
    textAlign: 'right',
    color: '#dc2626',
    fontSize: 15,
  },
  credit: {
    flex: 1,
    textAlign: 'right',
    color: '#16a34a',
    fontSize: 15,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#888',
    fontSize: 16,
  },
});

export default PartyStatementScreen;