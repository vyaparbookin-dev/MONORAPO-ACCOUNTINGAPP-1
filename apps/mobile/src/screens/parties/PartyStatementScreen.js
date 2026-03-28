import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { getData } from '../../services/ApiService';

const PartyStatementScreen = ({ route }) => {
  const { partyId } = route.params;
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.partyName}>{statement.party?.name}</Text>
        <Text style={styles.balanceLabel}>Closing Balance</Text>
        <Text style={[styles.closingBalance, (statement.party?.currentBalance || 0) < 0 ? styles.negative : styles.positive]}>
          ₹{Math.abs(statement.party?.currentBalance || 0).toFixed(2)}
        </Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, { flex: 2 }]}>Date & Particulars</Text>
        <Text style={[styles.headerText, { textAlign: 'right' }]}>Debit (Udhar)</Text>
        <Text style={[styles.headerText, { textAlign: 'right' }]}>Credit (Jama)</Text>
      </View>

      <FlatList
        data={statement.transactions || []}
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