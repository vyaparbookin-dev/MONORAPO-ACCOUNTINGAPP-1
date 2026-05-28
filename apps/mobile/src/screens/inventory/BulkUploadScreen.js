import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';
import api from '../../services/api';

const BulkUploadScreen = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"], // More specific types
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setFile(res.assets[0]);
      }
    } catch (err) {
      Alert.alert("Error", "Could not pick a file.");
    }
  };

  const uploadFile = async () => {
    if (!file) return Alert.alert("Please select a file first");
    setUploading(true);
    try {
      const fileContent = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
      const wb = XLSX.read(fileContent, { type: "base64" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      await api.post("/inventory/import", { products: data });
      Alert.alert("Success", `${data.length} products uploaded successfully`);
      setFile(null);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to upload products. Please check the file format.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Bulk Upload</Text>
        <Text style={styles.headerSubtitle}>Upload products via CSV/Excel</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.uploadBox}>
            <Ionicons name="cloud-upload-outline" size={48} color="#9ca3af" />
            <Text style={styles.uploadText}>Select a document to upload</Text>
            <Text style={styles.supportText}>Supports .csv, .xlsx, .xls</Text>
            
            <TouchableOpacity style={styles.selectBtn} onPress={pickFile}>
              <Text style={styles.selectBtnText}>Browse Files</Text>
            </TouchableOpacity>
          </View>

          {file && (
            <View style={styles.fileInfoCard}>
              <Ionicons name="document-text" size={24} color="#4338ca" />
              <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
              <TouchableOpacity onPress={() => setFile(null)}>
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.uploadBtn, (!file || uploading) ? styles.btnDisabled : null]} 
            onPress={uploadFile}
            disabled={!file || uploading}
          >
            <Text style={styles.uploadBtnText}>{uploading ? "Uploading..." : "Upload Items"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  headerContainer: { backgroundColor: '#fff', padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6b7280', fontWeight: '500', marginTop: 2 },
  content: { padding: 15 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
  uploadBox: { borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed', borderRadius: 12, padding: 30, alignItems: 'center', marginBottom: 20, backgroundColor: '#f9fafb' },
  uploadText: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 10 },
  supportText: { fontSize: 12, color: '#6b7280', marginTop: 4, marginBottom: 15 },
  selectBtn: { backgroundColor: '#e0e7ff', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  selectBtnText: { color: '#4338ca', fontWeight: 'bold' },
  fileInfoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, marginBottom: 20 },
  fileName: { flex: 1, marginLeft: 10, fontSize: 14, color: '#111827', fontWeight: '500' },
  uploadBtn: { backgroundColor: '#16a34a', paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  btnDisabled: { backgroundColor: '#9ca3af', shadowOpacity: 0, elevation: 0 },
  uploadBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }
});

export default BulkUploadScreen;