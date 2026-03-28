import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { postData } from '../../services/ApiService';
import { syncQueue } from '@repo/shared/src/services/syncqueue.native';

const ReviewParsedStatementScreen = ({ route, navigation }) => {
  // Data received from OCR parser
  const { parsedTransactions = [], partyId, partyName } = route.params || {};
  
  // State to hold and edit transactions
  const [transactions, setTransactions] = useState(parsedTransactions);
  const [isSaving, setIsSaving] = useState(false);

  const handleItemChange = (index, field, value) => {
    const newTrans = [...transactions];
    newTrans[index][field] = value;
    setTransactions(newTrans);
  };

  const handleSave = async () => {
    if (transactions.length === 0) {
      return Alert.alert("Error", "No transactions to save.");
    }
    
    setIsSaving(true);
    try {
      // Payload to send bulk entries to backend
      const payload = {
        partyId,
        transactions: transactions.map(t => ({
          date: t.date || new Date().toISOString(),
          details: t.details || 'Parsed Entry',
          debit: parseFloat(t.debit) || 0,
          credit: parseFloat(t.credit) || 0
        }))
      };

      syncQueue.enqueue({
        method: 'post',
        url: '/payment/bulk-entry',
        data: payload
      });
      Alert.alert("Success", "Statement entries saved successfully!");
      
      // Go back to the party statement screen
      navigation.navigate('PartyStatement', { partyId, partyName });
    } catch (error) {
      console.error("Save statement error:", error);
      Alert.alert("Error", "Failed to save parsed statement.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.row}>
      <TextInput style={[styles.input, { flex: 1.2 }]} placeholder="Date" value={item.date} onChangeText={(t) => handleItemChange(index, 'date', t)} />
      <TextInput style={[styles.input, { flex: 2 }]} placeholder="Details" value={item.details} onChangeText={(t) => handleItemChange(index, 'details', t)} />
      <TextInput style={[styles.input, { flex: 1 }]} placeholder="Debit" keyboardType="numeric" value={String(item.debit || '')} onChangeText={(t) => handleItemChange(index, 'debit', t)} />
      <TextInput style={[styles.input, { flex: 1 }]} placeholder="Credit" keyboardType="numeric" value={String(item.credit || '')} onChangeText={(t) => handleItemChange(index, 'credit', t)} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Review Entries: {partyName}</Text>
      
      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, { flex: 1.2 }]}>Date</Text>
        <Text style={[styles.headerText, { flex: 2 }]}>Particulars</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>Udhar</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>Jama</Text>
      </View>
      
      <FlatList 
        data={transactions} 
        keyExtractor={(_, i) => String(i)} 
        renderItem={renderItem} 
        ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20}}>No entries parsed. Check image clarity.</Text>}
      />
      
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
        {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save All Entries</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f9fafb' },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#1f2937', textAlign: 'center' },
  tableHeader: { flexDirection: 'row', marginBottom: 10, paddingHorizontal: 2 },
  headerText: { fontWeight: 'bold', fontSize: 13, color: '#4b5563' },
  row: { flexDirection: 'row', marginBottom: 8, gap: 5 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 5, padding: 8, fontSize: 13, color: '#111827' },
  saveBtn: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 15, marginBottom: 20 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default ReviewParsedStatementScreen;