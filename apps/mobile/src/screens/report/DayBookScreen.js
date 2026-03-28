import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getData } from '../../services/ApiService';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const DayBookScreen = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [summary, setSummary] = useState({
    totalIn: 0, totalOut: 0, netBalance: 0,
    cashSales: 0, partyIn: 0,
    cashPurchases: 0, expenses: 0, salaries: 0, partyOut: 0,
  });
  
  const [rawdata, setRawData] = useState(null);

  useEffect(() => {
    fetchDayBook();
  }, [selectedDate]);

  const fetchDayBook = async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await getData(`/daybook?date=${dateStr}`);
      const data = response.data?.data;
      
      if (data) {
        setRawData(data);
        calculateSummary(data);
      }
    } catch (error) {
      console.error("Error fetching DayBook:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data) => {
    let tIn = 0, tOut = 0;

    // IN (Paisa Aaya)
    const cashSales = data.bills.filter(b => b.paymentMethod !== 'credit').reduce((sum, b) => sum + (b.finalAmount || b.total || 0), 0);
    const partyIn = data.partyTransactions.reduce((sum, t) => sum + (t.credit || 0), 0);
    tIn = cashSales + partyIn;

    // OUT (Paisa Gaya)
    const cashPurchases = data.purchases.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const expenses = data.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const salaries = data.salaries.reduce((sum, s) => sum + (s.amount || 0), 0);
    const partyOut = data.partyTransactions.reduce((sum, t) => sum + (t.debit || 0), 0);
    tOut = cashPurchases + expenses + salaries + partyOut;

    setSummary({
      totalIn: tIn, totalOut: tOut, netBalance: tIn - tOut,
      cashSales, partyIn,
      cashPurchases, expenses, salaries, partyOut
    });
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setSelectedDate(date);
  };

  const handleTallyExport = async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await getData(`/tally/export?date=${dateStr}`);
      
      const xmlData = response.data || response;
      if (!xmlData || typeof xmlData !== 'string') {
        throw new Error("Invalid XML data received");
      }

      const fileUri = FileSystem.documentDirectory + `Tally_Daybook_${dateStr}.xml`;
      await FileSystem.writeAsStringAsync(fileUri, xmlData, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { dialogTitle: `Share Tally XML - ${dateStr}` });
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Tally Export Error:", error);
      Alert.alert("Error", "Failed to export Tally XML. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const renderBreakdownRow = (label, amount, type = 'neutral') => (
    <View style={styles.breakdownRow}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={[styles.breakdownAmount, type === 'in' ? styles.textGreen : type === 'out' ? styles.textRed : {}]}>
        ₹{amount.toFixed(2)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header & Date Picker */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Day Book (Cash Book)</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleTallyExport}>
            <Ionicons name="download-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={20} color="#fff" />
            <Text style={styles.dateBtnText}>{selectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1 }} />
      ) : (
        <ScrollView style={styles.scrollContent}>
          {/* Master Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, { backgroundColor: '#dcfce7' }]}>
              <Text style={styles.summaryTitle}>Money IN (+)</Text>
              <Text style={[styles.summaryValue, styles.textGreen]}>₹{summary.totalIn.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#fee2e2' }]}>
              <Text style={styles.summaryTitle}>Money OUT (-)</Text>
              <Text style={[styles.summaryValue, styles.textRed]}>₹{summary.totalOut.toFixed(2)}</Text>
            </View>
          </View>

          <View style={[styles.netCard, summary.netBalance >= 0 ? styles.bgBlue : styles.bgRed]}>
            <Text style={styles.netTitle}>Net Balance for the Day</Text>
            <Text style={styles.netValue}>₹{summary.netBalance.toFixed(2)}</Text>
          </View>

          {/* Detailed Breakdown */}
          <Text style={styles.sectionTitle}>Detailed Breakdown</Text>
          
          <View style={styles.detailSection}>
            <Text style={styles.subHeader}>Cash Received (IN)</Text>
            {renderBreakdownRow("Cash/Online Sales", summary.cashSales, 'in')}
            {renderBreakdownRow("Payment Received (Parties)", summary.partyIn, 'in')}
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.subHeader}>Cash Paid (OUT)</Text>
            {renderBreakdownRow("Cash Purchases", summary.cashPurchases, 'out')}
            {renderBreakdownRow("Expenses Paid", summary.expenses, 'out')}
            {renderBreakdownRow("Staff Salary Paid", summary.salaries, 'out')}
            {renderBreakdownRow("Payment Given (Parties)", summary.partyOut, 'out')}
          </View>

          {/* Quick List of Entries */}
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          <View style={styles.entriesCard}>
            {rawdata?.expenses.map(e => (
               <View key={e._id} style={styles.entryRow}>
                  <Text style={{flex: 1, color: '#374151'}}>{e.title}</Text>
                  <Text style={{color: '#dc2626', fontWeight: 'bold'}}>- ₹{e.amount}</Text>
               </View>
            ))}
            {rawdata?.partyTransactions.map(t => (
               <View key={t._id} style={styles.entryRow}>
                  <Text style={{flex: 1, color: '#374151'}}>{t.details} ({t.partyId?.name || 'Party'})</Text>
                  <Text style={{color: t.credit > 0 ? '#16a34a' : '#dc2626', fontWeight: 'bold'}}>
                    {t.credit > 0 ? `+ ₹${t.credit}` : `- ₹${t.debit}`}
                  </Text>
               </View>
            ))}
            {(!rawdata?.expenses?.length && !rawdata?.partyTransactions?.length) && (
               <Text style={{textAlign: 'center', color: '#9ca3af', padding: 10}}>No individual manual entries to show.</Text>
            )}
          </View>
          
          <View style={{height: 40}} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { backgroundColor: '#111827', padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#374151', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  iconBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#9333ea', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  dateBtnText: { color: '#fff', marginLeft: 8, fontWeight: '600' },
  scrollContent: { padding: 15 },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  summaryCard: { flex: 1, padding: 15, borderRadius: 12, marginHorizontal: 5, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1 },
  summaryTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 5 },
  summaryValue: { fontSize: 22, fontWeight: 'bold' },
  netCard: { padding: 20, borderRadius: 12, marginHorizontal: 5, alignItems: 'center', marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2 },
  bgBlue: { backgroundColor: '#2563eb' },
  bgRed: { backgroundColor: '#dc2626' },
  netTitle: { color: '#d1d5db', fontSize: 14, fontWeight: '600', marginBottom: 5 },
  netValue: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  textGreen: { color: '#16a34a' },
  textRed: { color: '#dc2626' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginVertical: 10, marginHorizontal: 5 },
  detailSection: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginHorizontal: 5, marginBottom: 15, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05 },
  subHeader: { fontSize: 16, fontWeight: 'bold', color: '#4b5563', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 8, marginBottom: 10 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  breakdownLabel: { fontSize: 15, color: '#4b5563' },
  breakdownAmount: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  entriesCard: { backgroundColor: '#fff', borderRadius: 12, padding: 10, marginHorizontal: 5, elevation: 1 },
  entryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }
});

export default DayBookScreen;