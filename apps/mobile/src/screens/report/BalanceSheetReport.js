import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getData } from '../../services/ApiService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';

const BalanceSheetReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    getData('/report/balancesheet')
      .then(res => setData(res.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSharePDF = async () => {
    setIsSharing(true);
    try {
      const rows = data.map(item => `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">${item.account || 'Account'}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${item.debit ? `₹${item.debit}` : '-'}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${item.credit ? `₹${item.credit}` : '-'}</td>
        </tr>
      `).join('');
      
      const html = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="text-align: center; color: #111827;">Balance Sheet Report</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Account / Head</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Debit (Dr)</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Credit (Cr)</th>
              </tr>
              ${rows}
            </table>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { dialogTitle: 'Share Balance Sheet' });
    } catch (err) {
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setIsSharing(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (error) return <Text style={{ textAlign: 'center', marginTop: 50 }}>Error: {error}</Text>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Balance Sheet</Text>
        <TouchableOpacity onPress={handleSharePDF} style={styles.pdfBtn} disabled={isSharing}>
          {isSharing ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.pdfBtnText}>Share PDF</Text>}
        </TouchableOpacity>
      </View>
      
      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, { flex: 2 }]}>Account Head</Text>
        <Text style={[styles.headerText, { flex: 1, textAlign: 'right' }]}>Debit</Text>
        <Text style={[styles.headerText, { flex: 1, textAlign: 'right' }]}>Credit</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={[styles.cell, { flex: 2, fontWeight: 'bold', color: '#374151' }]}>{item.account || 'Unknown'}</Text>
            <Text style={[styles.cell, { flex: 1, textAlign: 'right', color: '#dc2626' }]}>{item.debit ? `₹${item.debit}` : '-'}</Text>
            <Text style={[styles.cell, { flex: 1, textAlign: 'right', color: '#16a34a' }]}>{item.credit ? `₹${item.credit}` : '-'}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30, color: '#6b7280' }}>No balance sheet records found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', elevation: 1 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  pdfBtn: { backgroundColor: '#2563eb', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6 },
  pdfBtnText: { color: '#fff', fontWeight: 'bold' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#e5e7eb', padding: 12 },
  headerText: { fontWeight: 'bold', color: '#4b5563', fontSize: 13 },
  row: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  cell: { fontSize: 14 }
});

export default BalanceSheetReport;