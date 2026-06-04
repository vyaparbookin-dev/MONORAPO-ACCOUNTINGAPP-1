import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/ApiService';

const SYSTEM_FIELDS = [
  { key: "name", label: "Item Name (*Required)" },
  { key: "sku", label: "Item Code / SKU" },
  { key: "barcode", label: "Barcode" },
  { key: "category", label: "Category / Group" },
  { key: "subCategory", label: "Sub Category" },
  { key: "brand", label: "Company / Brand" },
  { key: "hsnCode", label: "HSN Code" },
  { key: "packing", label: "Packing (e.g. 1x10)" },
  { key: "unit", label: "Unit (e.g. PCS)" },
  { key: "secondaryUnit", label: "Unit-2 (Alt Unit)" },
  { key: "conversionRate", label: "Conversion Rate" },
  { key: "costPrice", label: "P.Cost / Landing Rate" },
  { key: "sellingPrice", label: "Rate 1 (Selling Price)" },
  { key: "wholesalePrice", label: "Rate 2 (Wholesale)" },
  { key: "dealerPrice", label: "Rate 3 (Dealer)" },
  { key: "mrp", label: "MRP" },
  { key: "discount", label: "Discount %" },
  { key: "gstRate", label: "GST %" },
  { key: "currentStock", label: "Opening Stock" },
  { key: "minimumStock", label: "Min Quantity" }
];

export default function BulkUploadScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [uploading, setUploading] = useState(false);

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true
      });
      
      if (res.canceled) return;
      
      const file = res.assets[0];
      parseExcel(file.uri);
    } catch (err) {
      Alert.alert("Error", "Could not pick a file.");
    }
  };

  const parseExcel = async (uri) => {
    try {
      setUploading(true);
      const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const wb = XLSX.read(b64, { type: 'base64' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData = XLSX.utils.sheet_to_json(ws, { header: "A", defval: "" });

      if (rawData.length > 1) {
        const excelHeaders = rawData[0];
        const actualData = rawData.slice(1).filter(row => Object.values(row).some(val => val !== ""));

        const fileColumns = Object.keys(excelHeaders);
        const enhancedHeaders = fileColumns.map(col => ({
          key: col,
          label: excelHeaders[col] || `Column ${col}`
        }));

        setHeaders(enhancedHeaders);
        setData(actualData);

        // Smart Auto-Mapping Logic
        const initialMapping = {};
        SYSTEM_FIELDS.forEach(field => {
          const matchedCol = fileColumns.find(col => {
            const hText = String(excelHeaders[col]).toLowerCase().trim();
            if (hText === field.key.toLowerCase()) return true;
            if (field.key === 'name' && (hText.includes('item') || hText === 'product' || hText.includes('name'))) return true;
            if (field.key === 'category' && (hText.includes('category') || hText.includes('group'))) return true;
            if (field.key === 'brand' && (hText.includes('brand') || hText.includes('company') || hText.includes('manufacturer'))) return true;
            if (field.key === 'unit' && (hText.includes('unit') && (!hText.includes('2') && !hText.includes('secondary')) || hText === 'uom')) return true;
            if (field.key === 'mrp' && (hText.includes('mrp') || hText.includes('maximum retail price'))) return true;
            if (field.key === 'gstRate' && (hText.includes('gst') || hText.includes('tax') || hText.includes('%'))) return true;
            if (field.key === 'costPrice' && (hText.includes('cost') || hText.includes('landing') || hText.includes('purchase'))) return true;
            if (field.key === 'sellingPrice' && (hText.includes('selling') || hText.includes('rate 1') || hText.includes('sale'))) return true;
            if (field.key === 'wholesalePrice' && (hText.includes('wholesale') || hText.includes('rate 2'))) return true;
            if (field.key === 'currentStock' && (hText.includes('stock') || hText.includes('opening'))) return true;
            if (field.key === 'sku' && (hText.includes('sku') || hText.includes('code'))) return true;
            if (field.key === 'barcode' && hText.includes('barcode')) return true;
            return false;
          });
          if (matchedCol) initialMapping[field.key] = matchedCol;
        });

        setMapping(initialMapping);
        setStep(2);
      } else {
        Alert.alert("Error", "No valid data found in file.");
      }
    } catch (error) {
      Alert.alert("Parsing Error", error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async () => {
    if (data.length === 0) return;
    setUploading(true);
    try {
      const res = await api.post("/api/inventory/import", { products: data, mapping });
      Alert.alert("Success", res.data?.message || `Processed ${data.length} products!`, [
        { text: "OK", onPress: () => navigation.goBack ? navigation.goBack() : setStep(1) }
      ]);
    } catch (err) {
      Alert.alert("Upload Failed", err.response?.data?.message || err.message);
    } finally {
      setUploading(false);
    }
  };

  const updateMapping = (sysKey, excelKey) => {
    setMapping(prev => ({ ...prev, [sysKey]: excelKey }));
  };

  if (step === 1) {
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Bulk Upload</Text>
          <Text style={styles.headerSubtitle}>Select an Excel (.xlsx) or CSV file</Text>
      </View>
        
        <View style={styles.uploadCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="cloud-upload" size={48} color="#2563eb" />
          </View>
          <Text style={styles.title}>Bulk Product Upload</Text>
          <Text style={styles.subtitle}>Map columns manually in the next step.</Text>
          
          <TouchableOpacity style={styles.primaryBtn} onPress={pickFile} disabled={uploading}>
            {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Select File</Text>}
            </TouchableOpacity>
          </View>
    </View>
  );
};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review Mapping</Text>
        <Text style={styles.headerSubtitle}>{data.length} rows found. We auto-mapped your columns.</Text>
      </View>
      
      <ScrollView style={styles.mappingList} showsVerticalScrollIndicator={false}>
        {SYSTEM_FIELDS.map((field) => (
          <View key={field.key} style={styles.mappingRow}>
            <Text style={styles.sysField}>{field.label}</Text>
            <View style={styles.pickerWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
                <TouchableOpacity 
                  style={[styles.chip, !mapping[field.key] && styles.chipActive]} 
                  onPress={() => updateMapping(field.key, null)}
                >
                  <Text style={[styles.chipText, !mapping[field.key] && styles.chipTextActive]}>Skip</Text>
                </TouchableOpacity>
                {headers.map(h => (
                  <TouchableOpacity 
                    key={h.key}
                    style={[styles.chip, mapping[field.key] === h.key && styles.chipActive]}
                    onPress={() => updateMapping(field.key, h.key)}
                  >
                    <Text style={[styles.chipText, mapping[field.key] === h.key && styles.chipTextActive]} numberOfLines={1}>
                      {h.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => setStep(1)}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleUpload} disabled={uploading}>
          {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Import Now</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  headerContainer: { backgroundColor: '#fff', padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6b7280', fontWeight: '500', marginTop: 2 },
  
  uploadCard: { margin: 20, backgroundColor: '#fff', borderRadius: 16, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginTop: 50 },
  iconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 30, lineHeight: 20 },
  primaryBtn: { backgroundColor: '#2563eb', width: '100%', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  header: { backgroundColor: '#fff', padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  
  mappingList: { padding: 15 },
  mappingRow: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  sysField: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 10 },
  pickerWrapper: { flexDirection: 'row' },
  horizontalChips: { flexDirection: 'row' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  chipText: { fontSize: 12, color: '#4b5563' },
  chipTextActive: { color: '#2563eb', fontWeight: 'bold' },
  
  footer: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingBottom: 25 },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 10, backgroundColor: '#f3f4f6', marginRight: 10 },
  cancelBtnText: { color: '#4b5563', fontWeight: 'bold', fontSize: 15 },
  confirmBtn: { flex: 2, paddingVertical: 14, alignItems: 'center', borderRadius: 10, backgroundColor: '#2563eb' },
  confirmBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
});