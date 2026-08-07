import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { getData } from '../../services/ApiService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const CashFlowReportScreen = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await getData('/reports/cashflow'); // Assuming this endpoint exists
      setReport(res.data?.data || res.data);
    } catch (error) {
      console.error("Error fetching cash flow:", error);
      Alert.alert("Error", "Failed to load cash flow data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSharePDF = async () => {
    if (!report) return;
    setIsSharing(true);
    try {
      const html = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="text-align: center;">Cash Flow Statement</h2>
            <div style="display: flex; justify-content: space-around; margin-top: 20px;">
              <div style="text-align: center;">
                <p>Cash Inflow</p>
                <h3 style="color: #16a34a;">₹${(report.cashInflow || 0).toLocaleString()}</h3>
              </div>
              <div style="text-align: center;">
                <p>Cash Outflow</p>
                <h3 style="color: #dc2626;">₹${(report.cashOutflow || 0).toLocaleString()}</h3>
              </div>
            </div>
            <h3 style="text-align: center; margin-top: 30px; background: #eff6ff; padding: 15px; border-radius: 8px;">
              Net Cash Flow: ₹${(report.netCashFlow || 0).toLocaleString()}
            </h3>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { dialogTitle: 'Share Cash Flow Report' });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cash Flow Report</Text>
        <TouchableOpacity onPress={handleSharePDF} style={styles.pdfBtn} disabled={isSharing || loading}>
          {isSharing ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.pdfBtnText}>Share PDF</Text>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1 }} />
      ) : report ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.card, { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' }]}>
            <Text style={styles.label}>Total Cash Inflow</Text>
            <Text style={[styles.value, { color: '#15803d' }]}>₹{(report.cashInflow || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: '#fee2e2', borderColor: '#fecaca' }]}>
            <Text style={styles.label}>Total Cash Outflow</Text>
            <Text style={[styles.value, { color: '#b91c1c' }]}>₹{(report.cashOutflow || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', marginTop: 10 }]}>
            <Text style={styles.label}>Net Cash Flow</Text>
            <Text style={[styles.value, { fontSize: 32, color: '#1e40af' }]}>₹{(report.netCashFlow || 0).toLocaleString('en-IN')}</Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.center}><Text>No data available</Text></View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', elevation: 2 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  pdfBtn: { backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  pdfBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  content: { padding: 15 },
  card: { padding: 20, borderRadius: 12, marginBottom: 15, borderWidth: 1, alignItems: 'center' },
  label: { fontSize: 16, color: '#374151', marginBottom: 8, fontWeight: '600' },
  value: { fontSize: 28, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default CashFlowReportScreen;