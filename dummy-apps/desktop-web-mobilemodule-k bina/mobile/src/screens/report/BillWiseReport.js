import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { postData } from '../../services/ApiService';

const BillwiseReport = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // API update: Use the common POST /report/generate endpoint 
    postData('/report/generate', { type: 'billwise', dateRange: 'month' })
      .then(res => setBills(res.reports || res.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (error) return <Text>Error: {error}</Text>;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Billwise Report</Text>
      <FlatList
        data={bills}
        keyExtractor={(item, index) => item._id || item.id?.toString() || index.toString()}
        renderItem={({ item }) => (
          <View style={{ padding: 10, borderBottomWidth: 1 }}>
            <Text>Bill No: {item.billNo || item.billNumber}</Text>
            <Text>Customer: {item.customer || item.customerName || item.partyId?.name || 'N/A'}</Text>
            <Text>Amount: ₹{item.amount || item.finalAmount || item.totalAmount || 0}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default BillwiseReport;