import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getData } from '../../services/ApiService';

const GstReportScreen = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('GSTR1');
  const [gstData, setGstData] = useState(null);
  const [loading, setLoading] = useState(false);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = [2023, 2024, 2025];

  useEffect(() => {
    fetchGstReport();
  }, [month, year]);

  const fetchGstReport = async () => {
    setLoading(true);
    try {
      const response = await getData(`/gst/report?month=${month}&year=${year}`);
      setGstData(response.data?.data);
    } catch (error) {
      console.error("Error fetching GST:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderRecordCard = (item, type) => (
    <View style={styles.card} key={item.invoiceNo}>
      <View style={styles.cardHeader}>
        <Text style={styles.invoiceNo}>{item.invoiceNo}</Text>
        <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.partyName}>{item.customer || item.supplier}</Text>
      {item.gstin !== 'N/A' && <Text style={styles.gstin}>GSTIN: {item.gstin}</Text>}
      
      <View style={styles.amountsRow}>
        <View>
          <Text style={styles.label}>Taxable</Text>
          <Text style={styles.value}>₹{item.taxableValue.toFixed(2)}</Text>
        </View>
        <View>
          <Text style={styles.label}>GST</Text>
          <Text style={[styles.value, {color: '#9333ea'}]}>₹{item.gstAmount.toFixed(2)}</Text>
        </View>
        <View style={{alignItems: 'flex-end'}}>
          <Text style={styles.label}>Total</Text>
          <Text style={[styles.value, {fontWeight: 'bold'}]}>₹{item.totalValue.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={month} onValueChange={setMonth} style={styles.picker}>
            {months.map(m => <Picker.Item key={m} label={new Date(0, m - 1).toLocaleString('en', { month: 'long' })} value={m} />)}
          </Picker>
        </View>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={year} onValueChange={setYear} style={styles.picker}>
            {years.map(y => <Picker.Item key={y} label={String(y)} value={y} />)}
          </Picker>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {['GSTR1', 'GSTR2', 'GSTR3B'].map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'GSTR1' ? 'Sales (1)' : tab === 'GSTR2' ? 'Purchase (2)' : 'Summary (3B)'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView style={styles.content}>
          {gstData && activeTab === 'GSTR1' && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>B2B Sales (Registered)</Text>
              </View>
              {gstData.gstr1.b2b.length === 0 ? <Text style={styles.emptyText}>No B2B sales found.</Text> : gstData.gstr1.b2b.map(item => renderRecordCard(item, 'Sales'))}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>B2C Sales (Unregistered)</Text>
              </View>
              {gstData.gstr1.b2c.length === 0 ? <Text style={styles.emptyText}>No B2C sales found.</Text> : gstData.gstr1.b2c.map(item => renderRecordCard(item, 'Sales'))}
            </View>
          )}

          {gstData && activeTab === 'GSTR2' && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Inward Supplies (Purchases)</Text>
              </View>
              {gstData.gstr2.b2b.length === 0 ? <Text style={styles.emptyText}>No purchases recorded.</Text> : gstData.gstr2.b2b.map(item => renderRecordCard(item, 'Purchases'))}
            </View>
          )}

          {gstData && activeTab === 'GSTR3B' && (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Output Tax (Sales)</Text>
                <Text style={[styles.summaryValue, {color: '#dc2626'}]}>₹{(gstData.gstr3b.outwardGst || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Input Tax Credit (ITC)</Text>
                <Text style={[styles.summaryValue, {color: '#16a34a'}]}>₹{(gstData.gstr3b.inwardGst || 0).toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryCard, {backgroundColor: gstData.gstr3b.netGstPayable > 0 ? '#fee2e2' : '#dcfce7'}]}>
                <Text style={[styles.summaryLabel, {color: gstData.gstr3b.netGstPayable > 0 ? '#b91c1c' : '#15803d'}]}>Net GST Payable to Govt.</Text>
                <Text style={[styles.summaryValue, {fontSize: 28, color: gstData.gstr3b.netGstPayable > 0 ? '#dc2626' : '#16a34a'}]}>
                  ₹{Math.max(gstData.gstr3b.netGstPayable, 0).toFixed(2)}
                </Text>
              </View>
            </View>
          )}
          <View style={{height: 40}}/>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  filterContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', gap: 10 },
  pickerWrapper: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, height: 45, justifyContent: 'center' },
  picker: { height: 45 },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderColor: '#2563eb' },
  tabText: { fontWeight: '600', color: '#6b7280' },
  activeTabText: { color: '#2563eb' },
  content: { padding: 10 },
  sectionHeader: { marginVertical: 10, paddingBottom: 5, borderBottomWidth: 1, borderColor: '#d1d5db' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  invoiceNo: { fontWeight: 'bold', fontSize: 15, color: '#111827' },
  dateText: { color: '#6b7280', fontSize: 12 },
  partyName: { fontSize: 14, color: '#4b5563', marginBottom: 2 },
  gstin: { fontSize: 12, fontFamily: 'monospace', color: '#9ca3af', marginBottom: 10 },
  amountsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#f3f4f6', paddingTop: 10 },
  label: { fontSize: 11, color: '#6b7280' },
  value: { fontSize: 14, color: '#1f2937', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#9ca3af', padding: 20 },
  
  // Summary styles
  summaryContainer: { gap: 15, marginTop: 10 },
  summaryCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center', elevation: 2 },
  summaryLabel: { fontSize: 14, color: '#4b5563', marginBottom: 5, fontWeight: '600' },
  summaryValue: { fontSize: 24, fontWeight: 'bold' }
});

export default GstReportScreen;