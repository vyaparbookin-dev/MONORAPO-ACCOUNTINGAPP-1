import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Platform } from 'react-native';
import { getData } from '../../services/ApiService';

const ConsolidatedStatementDetail = ({ route, navigation }) => {
  const { statementId } = route.params;
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatementDetail();
  }, [statementId]);

  const fetchStatementDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getData(`/consolidated-statement/${statementId}`);
      setStatement(response.data?.statement || response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch consolidated statement details.');
      console.error('Error fetching consolidated statement:', err);
      Alert.alert('Error', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading Statement...</Text>
      </View>
    );
  }

  if (error || !statement) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Statement not found.'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchStatementDetail}>
            <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Consolidated Credit Statement</Text>

      <View style={styles.detailCard}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Statement No:</Text>
          <Text style={styles.value}>{statement.statementNumber}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Customer Name:</Text>
          <Text style={styles.value}>{statement.customerName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{new Date(statement.date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Total Amount:</Text>
          <Text style={styles.totalValue}>₹{statement.totalAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.value}>{statement.status}</Text>
        </View>
        {statement.notes && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Notes:</Text>
            <Text style={styles.value}>{statement.notes}</Text>
          </View>
        )}
      </View>

      <Text style={styles.subHeader}>Consolidated Bills:</Text>
      {statement.bills && statement.bills.length > 0 ? (
        statement.bills.map((bill) => (
          <TouchableOpacity 
            key={bill._id} 
            style={styles.billItem}
            onPress={() => navigation.navigate('BillDetailscreen', { billId: bill._id })}
          >
            <Text style={styles.billItemText}>Bill No: {bill.billNumber}</Text>
            <Text style={styles.billItemText}>Date: {new Date(bill.date).toLocaleDateString()}</Text>
            <Text style={styles.billItemText}>Amount: ₹{bill.finalAmount || bill.total.toFixed(2)}</Text>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.emptyListText}>No bills found for this statement.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#555',
  },
  detailCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        
        
        
        
      },
      android: { ...Platform.select({
      ios: {     },
      android: { elevation: 2 },
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.2)' }
    }), },
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.2)' }
    }),
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  value: {
    fontSize: 16,
    color: '#555',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
  },
  billItem: {
    backgroundColor: '#e6f2ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#007bff',
  },
  billItemText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 3,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    color: '#777',
  },
});

export default ConsolidatedStatementDetail;