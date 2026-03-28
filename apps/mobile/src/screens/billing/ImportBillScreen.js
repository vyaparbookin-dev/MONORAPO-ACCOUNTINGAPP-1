import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { postData } from '../../services/ApiService';

const ImportBillScreen = () => {
  const [loading, setLoading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
      });

      if (result.type === 'success') {
        uploadFile(result);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const uploadFile = async (file) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    try {
      // Note: postData handles JSON usually. For multipart, fetch is often better or adapt postData.
      // Assuming postData can handle it or we use direct fetch here for file upload.
      await postData('/billing/import', formData); 
      Alert.alert('Success', 'Bill imported successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to import bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Import Bill from Excel/CSV</Text>
      <Text style={styles.subtitle}>Select a file to bulk import invoices.</Text>
      
      <TouchableOpacity style={styles.button} onPress={pickDocument} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Select File</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 30, textAlign: 'center' },
  button: { backgroundColor: '#007bff', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default ImportBillScreen;