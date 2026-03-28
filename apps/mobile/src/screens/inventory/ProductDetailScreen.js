import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Platform } from "react-native";
import { Ionicons } from '@expo/vector-icons';

const ProductDetailScreen = () => {
  const [product, setProduct] = useState({
    name: "",
    code: "",
    price: "",
    stock: "",
  });

  const handleSave = () => {
    if (!product.name || !product.price) return Alert.alert("Fill all details");
    Alert.alert("Product Saved", `${product.name} added successfully`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Product Details</Text>
        <Text style={styles.headerSubtitle}>View or update item info</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Wireless Mouse"
            value={product.name}
            onChangeText={(text) => setProduct({ ...product, name: text })}
          />
          
          <Text style={styles.label}>Product Code / SKU</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. SKU-1234"
            value={product.code}
            onChangeText={(text) => setProduct({ ...product, code: text })}
          />
          
          <Text style={styles.label}>Price (₹) *</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            keyboardType="numeric"
            value={product.price}
            onChangeText={(text) => setProduct({ ...product, price: text })}
          />
          
          <Text style={styles.label}>Current Stock</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={product.stock}
            onChangeText={(text) => setProduct({ ...product, stock: text })}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Product</Text>
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
  content: { padding: 15 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 15, height: 55, fontSize: 16, color: '#111827', marginBottom: 20 },
  saveBtn: { backgroundColor: '#4338ca', paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#4338ca', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4, marginTop: 10 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }
});

export default ProductDetailScreen;