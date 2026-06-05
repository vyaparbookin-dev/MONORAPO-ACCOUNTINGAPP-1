import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { getData } from "../../services/ApiService";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';

const ProfitLossReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await getData("/reports/profitloss");
      setReport(response.data?.data || response.data);
    } catch (error) {
      console.error("Error fetching P&L report:", error);
      Alert.alert("Error", "Failed to load report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleSharePDF = async () => {
    if (!report) return;
    setIsSharing(true);
    try {
      const html = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="text-align: center; color: #111827;">Profit & Loss Statement</h2>
            <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin-top: 20px; border: 1px solid #e5e7eb;">
              <div style="margin-bottom: 15px; font-size: 16px;">
                <span style="color: #6b7280;">Total Revenue (Sales):</span>
                <span style="float: right; color: #16a34a; font-weight: bold;">₹${report.totalSales?.toLocaleString('en-IN') || 0}</span>
              </div>
              <div style="margin-bottom: 15px; font-size: 16px;">
                <span style="color: #6b7280;">Total Purchases:</span>
                <span style="float: right; color: #dc2626; font-weight: bold;">- ₹${report.totalPurchase?.toLocaleString('en-IN') || 0}</span>
              </div>
              <div style="margin-bottom: 15px; font-size: 16px; border-bottom: 1px solid #d1d5db; padding-bottom: 15px;">
                <span style="color: #6b7280;">Other Expenses:</span>
                <span style="float: right; color: #dc2626; font-weight: bold;">- ₹${report.totalExpenses?.toLocaleString('en-IN') || 0}</span>
              </div>
              <div style="font-size: 20px; font-weight: bold; margin-top: 15px;">
                <span>Net Profit / Loss:</span>
                <span style="float: right; color: ${report.netProfit >= 0 ? '#1d4ed8' : '#ea580c'};">
                  ₹${report.netProfit?.toLocaleString('en-IN') || 0}
                </span>
              </div>
            </div>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { dialogTitle: 'Share P&L Report' });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profit & Loss Statement</Text>
        <TouchableOpacity onPress={handleSharePDF} style={styles.pdfBtn} disabled={isSharing || loading}>
          {isSharing ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.pdfBtnText}>Share PDF</Text>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1 }} />
      ) : report ? (
        <ScrollView style={styles.content}>
          <View style={[styles.card, { borderLeftColor: '#16a34a', borderLeftWidth: 4 }]}>
            <Text style={styles.label}>Total Revenue (Sales)</Text>
            <Text style={[styles.value, { color: '#16a34a' }]}>₹{(report.totalSales || 0).toLocaleString('en-IN')}</Text>
          </View>

          <View style={[styles.card, { borderLeftColor: '#dc2626', borderLeftWidth: 4 }]}>
            <Text style={styles.label}>Total Purchases</Text>
            <Text style={[styles.value, { color: '#dc2626' }]}>₹{(report.totalPurchase || 0).toLocaleString('en-IN')}</Text>
          </View>

          <View style={[styles.card, { borderLeftColor: '#dc2626', borderLeftWidth: 4 }]}>
            <Text style={styles.label}>Other Expenses</Text>
            <Text style={[styles.value, { color: '#dc2626' }]}>₹{(report.totalExpenses || 0).toLocaleString('en-IN')}</Text>
          </View>

          <View style={[styles.netCard, report.netProfit >= 0 ? { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' } : { backgroundColor: '#fff7ed', borderColor: '#fed7aa' }]}>
            <Text style={styles.netLabel}>Net Profit / Loss</Text>
            <Text style={[styles.netValue, report.netProfit >= 0 ? { color: '#1d4ed8' } : { color: '#ea580c' }]}>
              ₹{(report.netProfit || 0).toLocaleString('en-IN')}
            </Text>
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
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, elevation: 1 },
  label: { fontSize: 14, color: '#6b7280', marginBottom: 5, fontWeight: '600' },
  value: { fontSize: 24, fontWeight: 'bold' },
  netCard: { 
    backgroundColor: '#fff', padding: 20, borderRadius: 12, marginTop: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center'
  },
  netLabel: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 10 },
  netValue: { fontSize: 32, fontWeight: '900' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default ProfitLossReport;