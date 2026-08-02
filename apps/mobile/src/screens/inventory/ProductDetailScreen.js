import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { getData, put } from '../../services/ApiService';

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await getData(`/inventory/${productId}`);
        setProduct(res.product);
      } catch (error) {
        Alert.alert("Error", "Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleSave = () => {
    if (!product.name || !product.sellingPrice) return Alert.alert("Validation", "Product name and price are required.");
    setSaving(true);
    put(`/inventory/${productId}`, product)
      .then(() => {
        Alert.alert("Success", "Product updated successfully!");
        navigation.goBack();
      })
      .catch(err => Alert.alert("Error", err.message || "Failed to update product."))
      .finally(() => setSaving(false));
  };

  if (loading) return <ActivityIndicator size="large" color="#4338ca" style={{ flex: 1 }} />;
  if (!product) return <View style={styles.container}><Text style={{ textAlign: 'center', marginTop: 20 }}>Product not found.</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Product Details</Text>
        <Text style={styles.headerSubtitle}>View or update item information</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            value={product.name}
            onChangeText={(text) => setProduct({ ...product, name: text })}
          />
          
          <Text style={styles.label}>Product Code / SKU</Text>
          <TextInput
            style={styles.input}
            value={product.sku}
            onChangeText={(text) => setProduct({ ...product, sku: text })}
          />
          
          <Text style={styles.label}>Selling Price (₹) *</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(product.sellingPrice)}
            onChangeText={(text) => setProduct({ ...product, sellingPrice: text })}
          />
          
          <Text style={styles.label}>Current Stock</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(product.currentStock)}
            onChangeText={(text) => setProduct({ ...product, currentStock: text })}
          />

          <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Update Product</Text>}
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
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  btnDisabled: { backgroundColor: '#9ca3af' },
});

export default ProductDetailScreen;