import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import api from '../../services/Api';

export default function BankReconciliationScreen() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', '*/*'], // CSV focus
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileAsset = result.assets[0];
      setFileName(fileAsset.name);
      setLoading(true);

      // Read file content
      const fileContent = await FileSystem.readAsStringAsync(fileAsset.uri, { encoding: FileSystem.EncodingType.UTF8 });
      
      // Basic CSV Parsing (Expecting format: Date, Description, Debit, Credit)
      const lines = fileContent.split('\n');
      const statementEntries = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cols = line.split(',');
        if (cols.length >= 4) {
          const date = cols[0];
          const description = cols[1];
          const debit = parseFloat(cols[2]) || 0;
          const credit = parseFloat(cols[3]) || 0;

          if (debit > 0) {
            statementEntries.push({ date, description, amount: debit, type: 'debit' });
          } else if (credit > 0) {
            statementEntries.push({ date, description, amount: credit, type: 'credit' });
          }
        }
      }

      if (statementEntries.length === 0) {
        setLoading(false);
        return Alert.alert('Invalid File', 'No valid entries found. Ensure it is a standard Bank CSV.');
      }

      // Send to Backend
      const response = await api.post('/api/bank-rec/reconcile', { statementEntries });
      if (response.data.success) {
        setResults({
          matched: response.data.matched,
          unmatched: response.data.unmatched
        });
      } else {
        Alert.alert('Error', 'Failed to process statement.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong while parsing the file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bank Reconciliation</Text>
        <Text style={styles.subtitle}>Upload CSV to auto-tally your entries</Text>
      </View>

      <TouchableOpacity style={styles.uploadButton} onPress={handleFileUpload} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.uploadButtonText}>Select CSV File</Text>
        )}
      </TouchableOpacity>
      {fileName ? <Text style={styles.fileName}>Selected: {fileName}</Text> : null}

      {results && (
        <View style={styles.resultsContainer}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: '#dc2626' }]}>
              Unmatched Entries ({results.unmatched.length})
            </Text>
            <Text style={styles.helperText}>These exist in bank but are missing in app.</Text>
            {results.unmatched.map((item, idx) => (
              <View key={idx} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.dateText}>{item.date}</Text>
                  <Text style={[styles.badge, item.type === 'credit' ? styles.badgeGreen : styles.badgeRed]}>
                    {item.type.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.descText}>{item.description}</Text>
                <Text style={styles.amountText}>₹{item.amount}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: '#16a34a' }]}>
              Matched Entries ({results.matched.length})
            </Text>
            <Text style={styles.helperText}>These match perfectly with app records.</Text>
            {results.matched.map((item, idx) => (
              <View key={idx} style={[styles.card, { borderLeftColor: '#16a34a', borderLeftWidth: 4 }]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.dateText}>{item.statementEntry.date}</Text>
                  <Text style={styles.amountTextGreen}>₹{item.statementEntry.amount}</Text>
                </View>
                <Text style={styles.descText}>{item.statementEntry.description}</Text>
                <Text style={styles.matchDetailText}>
                  Matched: {item.matchDetails.model}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  uploadButton: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center' },
  uploadButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  fileName: { marginTop: 8, fontSize: 14, color: '#374151', textAlign: 'center' },
  resultsContainer: { marginTop: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  helperText: { fontSize: 12, color: '#6b7280', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dateText: { fontSize: 14, color: '#4b5563', fontWeight: '500' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, fontSize: 10, fontWeight: 'bold', overflow: 'hidden' },
  badgeGreen: { backgroundColor: '#dcfce7', color: '#16a34a' },
  badgeRed: { backgroundColor: '#fee2e2', color: '#dc2626' },
  descText: { fontSize: 14, color: '#111827', marginBottom: 8 },
  amountText: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  amountTextGreen: { fontSize: 16, fontWeight: 'bold', color: '#16a34a' },
  matchDetailText: { fontSize: 12, color: '#2563eb', marginTop: 4 },
});