import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { postData } from '../../services/ApiService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';

const Gstr3bReportScreen = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [isSharing, setIsSharing] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await postData("/report/generate", { type: "gstr3b", filter: {} });
      setReport(res.data?.report || res.report || null);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to fetch GSTR-3B report");
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
          <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="text-align: center; color: #111827;">GSTR-3B Summary</h2>
            <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 20px;">
              <div style="background: #eff6ff; padding: 15px; border-radius: 8px; flex: 1; min-width: 45%;">
                <p style="margin: 0; color: #6b7280;">Taxable Value</p>
                <h3 style="margin: 5px 0 0 0;">₹${(report.totalTaxable || 0).toLocaleString('en-IN')}</h3>
              </div>
              <div style="background: #dcfce7; padding: 15px; border-radius: 8px; flex: 1; min-width: 45%;">
                <p style="margin: 0; color: #6b7280;">Total GST</p>
                <h3 style="margin: 5px 0 0 0;">₹${(report.totalGST || 0).toLocaleString('en-IN')}</h3>
              </div>
              <div style="background: #fef9c3; padding: 15px; border-radius: 8px; flex: 1; min-width: 45%;">
                <p style="margin: 0; color: #6b7280;">CGST</p>
                <h3 style="margin: 5px 0 0 0;">₹${(report.totalCGST || 0).toLocaleString('en-IN')}</h3>
              </div>
              <div style="background: #fef9c3; padding: 15px; border-radius: 8px; flex: 1; min-width: 45%;">
                <p style="margin: 0; color: #6b7280;">SGST</p>
                <h3 style="margin: 5px 0 0 0;">₹${(report.totalSGST || 0).toLocaleString('en-IN')}</h3>
              </div>
            </div>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { dialogTitle: 'Share GSTR-3B Report' });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GSTR-3B Summary</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={handleSharePDF} style={[styles.btn, { backgroundColor: '#16a34a' }]} disabled={isSharing || !report}>
            {isSharing ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnText}>PDF</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={fetchReport} style={styles.btn} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnText}>Generate</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!report && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>Click Generate to view GSTR-3B summary</Text>
          </View>
        )}

        {report && (
          <View style={styles.grid}>
            <View style={[styles.card, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
              <Text style={styles.cardLabel}>Taxable Value</Text>
              <Text style={styles.cardValue}>₹{(report.totalTaxable || 0).toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.card, { backgroundColor: '#f3e8ff', borderColor: '#fef08a' }]}>
              <Text style={styles.cardLabel}>Total GST</Text>
              <Text style={styles.cardValue}>₹{(report.totalGST || 0).toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.card, { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' }]}>
              <Text style={styles.cardLabel}>CGST</Text>
              <Text style={styles.cardValue}>₹{(report.totalCGST || 0).toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.card, { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' }]}>
              <Text style={styles.cardLabel}>SGST</Text>
              <Text style={styles.cardValue}>₹{(report.totalSGST || 0).toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.card, { backgroundColor: '#fef3c7', borderColor: '#fde68a', width: '100%' }]}>
              <Text style={styles.cardLabel}>IGST</Text>
              <Text style={styles.cardValue}>₹{(report.totalIGST || 0).toLocaleString('en-IN')}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827'
  },
  btn: { backgroundColor: '#2563eb', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  content: { padding: 15 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#6b7280', marginTop: 10, fontSize: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%', padding: 15, borderRadius: 10, borderWidth: 1, marginBottom: 15,
    alignItems: 'center', justifyContent: 'center'
  },
  cardLabel: { fontSize: 13, color: '#4b5563', marginBottom: 5, fontWeight: '600' },
  cardValue: { fontSize: 20, fontWeight: 'bold', color: '#111827' }
});

export default Gstr3bReportScreen;