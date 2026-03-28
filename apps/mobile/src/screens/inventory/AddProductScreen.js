import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, StyleSheet, Platform, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { postData, getData } from '../../services/ApiService';
import { addProductLocal } from '../../../db'; // Offline Database
import { syncQueue } from '@repo/shared/src/services/syncqueue.native';

const AddProductScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    description: "",
    site: "",
    category: "",
    subCategory: "",
    hsnCode: "",
    costPrice: 0, // Changed from "" to 0
    profitMargin: "", // NEW
    sellingPrice: 0, // Changed from "" to 0
    mrp: 0, // Changed from "" to 0
    gstRate: 0, // Changed from "" to 0
    unit: "pcs",
    currentStock: 0, // Changed from "stock" to "currentStock" and "" to 0
    minimumStock: 10, // Changed from "10" (string) to 10 (number)
    supplier: "",
    // New Business Specific Fields
    isRawMaterial: false,
    weight: "",
    purity: "",
    makingChargeType: "fixed",
    makingCharge: "",
    brand: "",
    dimensions: "",
    materialType: "",
    ageGroup: "",
    certification: "",
    warrantyPeriod: "",
  });
  const [loading, setLoading] = useState(false);

  const [units, setUnits] = useState(["pcs", "kg", "ltr", "ft", "mtr", "dozen", "box", "bag", "nag", "cartoon", "set", "pair"]);
  const [categories, setCategories] = useState(["Electronics", "Textiles", "Groceries", "Hardware", "Chemicals", "Others"]);
  const gstRates = [0, 5, 12, 18, 28];

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const catRes = await getData('/category').catch(() => null);
        if (catRes && catRes.data?.categories) {
          setCategories(prev => [...new Set([...prev, ...catRes.data.categories.map(c => c.name)])]);
        }
        const unitRes = await getData('/unit').catch(() => null);
        if (unitRes && unitRes.data?.units) {
          setUnits(prev => [...new Set([...prev, ...unitRes.data.units.map(u => u.name)])]);
        }
      } catch (err) { console.warn("Failed to fetch dropdowns", err); }
    };
    fetchDropdowns();
  }, []);

  const handleInputChange = (field, value) => {
    // Ensure numeric fields are parsed correctly, with a fallback to 0
    const numericFields = ['costPrice', 'sellingPrice', 'mrp', 'gstRate', 'currentStock', 'minimumStock'];
    if (numericFields.includes(field)) {
      setForm({ ...form, [field]: parseFloat(value) || 0 });
    } else {
      setForm({ ...form, [field]: value });
    }
  };

  const generateInternalCode = () => {
    const timestamp = Date.now();
    handleInputChange("barcode", `ITEM${timestamp.toString().slice(-6)}`);
  };

  const handleSubmit = async () => {
    if (!form.name || form.sellingPrice <= 0 || !form.category || form.currentStock < 0) { // Updated validation
      Alert.alert('Validation', 'Please fill all required fields: Product Name, Selling Price (must be > 0), Category, and Current Stock (must be >= 0).');
      return;
    }

    setLoading(true);
    try {
      // 1. Offline First: Local SQLite Database me product save karein
      const localResult = await addProductLocal({
        ...form,
        name: form.name,
        sku: form.sku,
        price: parseFloat(form.sellingPrice) || 0,
        quantity: parseInt(form.currentStock, 10) || 0,
        category: form.category
      });

      if (!localResult.success) throw new Error("Failed to save locally");

      // 2. Background Sync: Cloud par bhejne ke liye queue me daalein
      syncQueue.enqueue({
        method: 'post',
        url: '/inventory',
        data: form
      });

      Alert.alert('Success', 'Product added successfully!');
      navigation.goBack(); // Navigate back after success
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.message || err.response?.data?.message || 'Error adding product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>New Product</Text>
        <Text style={styles.headerSubtitle}>Add item to your inventory</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Basic Info</Text>
        <Text style={styles.label}>Product Name *</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={(text) => handleInputChange("name", text)}
          required
        />

        <Text style={styles.label}>SKU / Code</Text>
        <TextInput
          style={styles.input}
          value={form.sku}
          onChangeText={(text) => handleInputChange("sku", text)}
        />

        <Text style={styles.label}>Barcode (Scan or Generate)</Text>
        <View style={styles.barcodeContainer}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 10 }]}
            value={form.barcode}
            onChangeText={(text) => handleInputChange("barcode", text)}
            placeholder="Scan product's barcode"
          />
          <TouchableOpacity style={styles.generateBtn} onPress={generateInternalCode}>
            <Text style={styles.generateBtnText}>Generate</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Category *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={form.category}
            style={styles.picker}
            onValueChange={(itemValue) => handleInputChange("category", itemValue)}
          >
            <Picker.Item label="Select Category" value="" />
            {categories.map(c => <Picker.Item key={c} label={c} value={c} />)}
          </Picker>
        </View>
        
        <Text style={styles.label}>HSN Code</Text>
        <TextInput
          style={styles.input}
          value={form.hsnCode}
          onChangeText={(text) => handleInputChange("hsnCode", text)}
        />
         <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={form.description}
          onChangeText={(text) => handleInputChange("description", text)}
          multiline
          numberOfLines={3}
        />
        <Text style={styles.label}>Supplier</Text>
        <TextInput
          style={styles.input}
          value={form.supplier}
          onChangeText={(text) => handleInputChange("supplier", text)}
        />
        <Text style={styles.label}>Site</Text>
        <TextInput
          style={styles.input}
          value={form.site}
          onChangeText={(text) => handleInputChange("site", text)}
        />
      </View>

      {/* Pricing */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Pricing & Tax</Text>
        <Text style={styles.label}>Cost Price</Text>
        <TextInput
          style={styles.input}
          value={String(form.costPrice)} // Convert to string for TextInput
          onChangeText={(text) => handleInputChange("costPrice", text)}
          keyboardType="numeric"
        />
        <Text style={styles.label}>Selling Price *</Text>
        <TextInput
          style={styles.input}
          value={String(form.sellingPrice)} // Convert to string for TextInput
          onChangeText={(text) => handleInputChange("sellingPrice", text)}
          keyboardType="numeric"
          required
        />
        <Text style={styles.label}>MRP</Text>
        <TextInput
          style={styles.input}
          value={String(form.mrp)} // Convert to string for TextInput
          onChangeText={(text) => handleInputChange("mrp", text)}
          keyboardType="numeric"
        />
        <Text style={styles.label}>GST Rate (%)</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={form.gstRate}
            style={styles.picker}
            onValueChange={(itemValue) => handleInputChange("gstRate", itemValue)}
          >
            <Picker.Item label="0%" value={0} /> {/* Changed value to number */}
            {gstRates.map(r => <Picker.Item key={r} label={`${r}%`} value={r} />)}
          </Picker>
        </View>
      </View>

      {/* Inventory */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Inventory</Text>
        <Text style={styles.label}>Opening Stock *</Text>
        <TextInput
          style={styles.input}
          value={String(form.currentStock)} // Convert to string for TextInput
          onChangeText={(text) => handleInputChange("currentStock", text)} // Changed to currentStock
          keyboardType="numeric"
          required
        />
        <Text style={styles.label}>Unit</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={form.unit}
            style={styles.picker}
            onValueChange={(itemValue) => handleInputChange("unit", itemValue)}
          >
            {units.map(u => <Picker.Item key={u} label={u} value={u} />)}
          </Picker>
        </View>
        <Text style={styles.label}>Min Stock Alert</Text>
        <TextInput
          style={styles.input}
          value={String(form.minimumStock)} // Convert to string for TextInput
          onChangeText={(text) => handleInputChange("minimumStock", text)}
          keyboardType="numeric"
        />
      </View>

      {/* Industry Specific Details */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Business Details (Optional)</Text>
        
        <View style={styles.switchRow}>
          <Text style={styles.label}>Raw Material? (Recipe/BOM)</Text>
          <Switch value={form.isRawMaterial} onValueChange={(val) => handleInputChange("isRawMaterial", val)} trackColor={{ false: "#767577", true: "#2563eb" }} />
        </View>

        <Text style={styles.subHeader}>Jewellery</Text>
        <TextInput style={styles.input} placeholder="Weight (Grams/mg)" value={form.weight} onChangeText={(t) => handleInputChange("weight", t)} />
        <TextInput style={styles.input} placeholder="Purity (e.g. 22K, 925 Silver)" value={form.purity} onChangeText={(t) => handleInputChange("purity", t)} />

        <Text style={styles.subHeader}>Hardware & Builder</Text>
        <TextInput style={styles.input} placeholder="Brand Name (e.g. Asian Paints)" value={form.brand} onChangeText={(t) => handleInputChange("brand", t)} />
        <TextInput style={styles.input} placeholder="Dimensions (e.g. 8x4 ft)" value={form.dimensions} onChangeText={(t) => handleInputChange("dimensions", t)} />

        <Text style={styles.subHeader}>Science & Sports</Text>
        <TextInput style={styles.input} placeholder="Material (e.g. Leather)" value={form.materialType} onChangeText={(t) => handleInputChange("materialType", t)} />
        <TextInput style={styles.input} placeholder="Warranty Period" value={form.warrantyPeriod} onChangeText={(t) => handleInputChange("warrantyPeriod", t)} />
        <TextInput style={styles.input} placeholder="Age Group" value={form.ageGroup} onChangeText={(t) => handleInputChange("ageGroup", t)} />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Product</Text>}
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  headerContainer: { backgroundColor: '#fff', padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6b7280', fontWeight: '500', marginTop: 2 },
  section: {
    marginBottom: 16,
    padding: 18,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    ...Platform.select({
      ios: { shadowColor: '#312e81', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.2)' }
    })
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 15,
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subHeader: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#6b7280', 
    marginTop: 10, 
    marginBottom: 5, 
    textTransform: 'uppercase' 
  },
  switchRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 15,
    fontSize: 16,
    color: '#111827',
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  generateBtn: { backgroundColor: '#e0e7ff', height: 50, paddingHorizontal: 15, justifyContent: 'center', borderRadius: 12 },
  generateBtnText: { color: '#4338ca', fontWeight: 'bold' },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 15,
    backgroundColor: '#fff',
    height: 50,
    justifyContent: 'center',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#1f2937',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#f3f4f6' },
  cancelBtnText: { color: '#4b5563', fontSize: 16, fontWeight: 'bold' },
  saveBtn: { flex: 2, backgroundColor: '#4338ca', paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#4338ca', shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});

export default AddProductScreen;