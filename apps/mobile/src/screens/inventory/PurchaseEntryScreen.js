import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from '@expo/vector-icons';
import { getData } from "../../services/ApiService";
import { useNavigation } from "@react-navigation/native";
import { syncQueue } from '@repo/shared/src/services/syncqueue.native';
import { getProductsLocal, getCustomersLocal, addPurchaseLocal, updateProductLocal, updateCustomerLocal, addTransactionLocal } from '../../../db'; // Offline DB

const PurchaseEntryScreen = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    partyId: "",
    purchaseNumber: `PUR-${Date.now()}`,
    date: new Date().toISOString().split("T")[0],
    items: [],
    finalAmount: 0,
    amountPaid: 0,
  });
  const [newItem, setNewItem] = useState({ productId: "", name: "", quantity: "1", costPrice: "0" });
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // 1. Offline First: Fetch Suppliers
      let localParties = await getCustomersLocal().catch(() => []);
      if (!localParties || localParties.length === 0) {
        const partyRes = await getData("/party").catch(() => ({}));
        localParties = partyRes.data?.parties || (Array.isArray(partyRes.data) ? partyRes.data : []);
      }
      setSuppliers(localParties.filter(p => p.partyType === 'supplier' || p.partyType === 'both' || p.partyType === 'Customer')); // Allow flexibility

      // 2. Offline First: Fetch Inventory
      let localProducts = await getProductsLocal().catch(() => []);
      if (!localProducts || localProducts.length === 0) {
        const invRes = await getData("/inventory").catch(() => ({}));
        localProducts = invRes.data?.products || (Array.isArray(invRes.data) ? invRes.data : []);
      }
      setProducts(localProducts);

    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const handleAddItem = () => {
    if (!newItem.productId || parseFloat(newItem.quantity) <= 0) {
      Alert.alert("Error", "Please select a product and enter a valid quantity.");
      return;
    }
    const product = products.find(p => p._id === newItem.productId);
    if (!product) {
        Alert.alert("Error", "Selected product not found.");
        return;
    }

    const itemTotal = parseFloat(newItem.quantity) * parseFloat(newItem.costPrice);
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: newItem.productId, name: product.name, quantity: newItem.quantity, costPrice: newItem.costPrice, total: itemTotal.toFixed(2) }],
      finalAmount: (parseFloat(prev.finalAmount) + itemTotal).toFixed(2)
    }));
    setNewItem({ productId: "", name: "", quantity: "1", costPrice: "0" });
  };

  const handleRemoveItem = (index) => {
    const item = formData.items[index];
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
      finalAmount: (parseFloat(prev.finalAmount) - parseFloat(item.total)).toFixed(2)
    }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate.toISOString().split("T")[0] });
    }
  };

  const handleSubmit = async () => {
    if (!formData.partyId || !formData.purchaseNumber || formData.items.length === 0) {
      Alert.alert("Error", "Please select a supplier, enter bill number, and add at least one item.");
      return;
    }

    setIsLoading(true);
    try {
      const supplierObj = suppliers.find(s => s._id === formData.partyId);
      
      const newId = `PUR-${Date.now()}`;
      const payload = {
        _id: newId,
        uuid: newId,
        partyId: formData.partyId || supplierObj?.uuid,
        supplierName: supplierObj?.name || "Offline Supplier",
        purchaseNumber: formData.purchaseNumber,
        date: formData.date,
        items: formData.items.map(item => ({
          productId: item.productId || item.uuid,
          name: item.name,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.costPrice),
          total: parseFloat(item.total)
        })),
        finalAmount: parseFloat(formData.finalAmount),
        amountPaid: parseFloat(formData.amountPaid) || 0,
        paymentMethod: parseFloat(formData.amountPaid) >= parseFloat(formData.finalAmount) ? "cash" : "credit",
      };

      // --- 1. LOCAL OFFLINE SAVE & STOCK UPDATE ---
      try {
        if (typeof addPurchaseLocal === 'function') await addPurchaseLocal(payload);

        // Local Stock Increase
        for (const item of payload.items) {
          const product = products.find(p => p._id === item.productId || p.uuid === item.productId);
          if (product && typeof updateProductLocal === 'function') {
            await updateProductLocal(product._id || product.uuid, { ...product, currentStock: (parseFloat(product.currentStock) || 0) + item.quantity });
          }
        }

        // Local Supplier Ledger Update (Accounts Payable)
        const pendingAmount = payload.finalAmount - payload.amountPaid;
        if (supplierObj && pendingAmount > 0 && typeof updateCustomerLocal === 'function') {
          const newBalance = (parseFloat(supplierObj.balance || supplierObj.currentBalance || 0)) + pendingAmount;
          await updateCustomerLocal(supplierObj._id || supplierObj.uuid, { ...supplierObj, balance: newBalance, currentBalance: newBalance });
          
          if (typeof addTransactionLocal === 'function') {
            await addTransactionLocal({
              uuid: `TX-PUR-${Date.now()}`, partyId: supplierObj._id || supplierObj.uuid, type: 'purchase',
              debit: 0, credit: pendingAmount, date: payload.date, details: `Purchase Bill #${payload.purchaseNumber}`, status: 'completed'
            });
          }
        }
      } catch (localErr) {
        console.log("Local save skipped or failed", localErr);
      }

      // --- 2. CLOUD SYNC QUEUE ---
      syncQueue.enqueue({
        method: 'post',
        url: '/purchase',
        data: payload
      });

      Alert.alert("Success", "Purchase entry saved & offline stock updated successfully!");
      navigation.goBack();
    } catch (err) {
      console.error("Error saving purchase entry:", err.response?.data || err.message);
      Alert.alert("Error", "Failed to save purchase entry.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { padding: 0 }]}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>New Purchase</Text>
        <Text style={styles.headerSubtitle}>Add stock to inventory</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 15, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
      {/* General Info */}
      <View style={styles.section}>
        <Text style={styles.label}>Select Supplier *</Text>
        <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.partyId}
          onValueChange={(val) => setFormData({ ...formData, partyId: val })}
          style={styles.picker}
        >
          <Picker.Item label="-- Select Supplier --" value="" color="#888" />
          {suppliers.map((s) => (
            <Picker.Item key={s._id} label={s.name} value={s._id} color="#333" />
          ))}
        </Picker>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>Bill Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Purchase Bill No. (e.g., PUR-101)"
          value={formData.purchaseNumber}
          onChangeText={(text) => setFormData({ ...formData, purchaseNumber: text })}
        />
        
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
          <Text style={{ fontSize: 16, color: '#111827' }}>{formData.date}</Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={new Date(formData.date)}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Add Items */}
      <View style={styles.section}>
        <Text style={styles.label}>Add Product</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={newItem.productId}
            onValueChange={(itemValue) => {
              const product = products.find(p => p._id === itemValue);
              setNewItem({ 
                ...newItem, 
                productId: itemValue, 
                name: product?.name || "", 
                costPrice: product?.costPrice ? String(product.costPrice) : "0" 
              });
            }}
            style={styles.picker}
            dropdownIconColor="#333"
          >
            <Picker.Item label="Select Product" value="" color="#888" />
            {products.map((p) => (
              <Picker.Item key={p._id} label={p.name} value={p._id} color="#333" />
            ))}
          </Picker>
        </View>
        <View style={styles.addItemRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 5, marginBottom: 0 }]}
            placeholder="Qty"
            keyboardType="numeric"
            value={newItem.quantity}
            onChangeText={(text) => setNewItem({ ...newItem, quantity: text })}
          />
          <TextInput
            style={[styles.input, { flex: 1.5, marginRight: 5, marginBottom: 0 }]}
            placeholder="Cost Price"
            keyboardType="numeric"
            value={newItem.costPrice}
            onChangeText={(text) => setNewItem({ ...newItem, costPrice: text })}
          />
          <TouchableOpacity onPress={handleAddItem} style={styles.addButton}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Item List */}
      <View style={{ marginTop: 10 }}>
        {formData.items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cube-outline" size={40} color="#cbd5e1" />
            <Text style={styles.emptyText}>No items added yet.</Text>
          </View>
        ) : (
          formData.items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemIconBg}><Ionicons name="cube" size={20} color="#4338ca" /></View>
              <View style={{ flex: 1, paddingHorizontal: 12 }}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemDetail}>{item.quantity} units × ₹{item.costPrice}</Text>
              </View>
              <Text style={styles.itemTotal}>₹{item.total}</Text>
              <TouchableOpacity onPress={() => handleRemoveItem(index)} style={styles.deleteBtn}>
                <Ionicons name="trash" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
      </ScrollView>
      
      {/* Footer Area */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Payable</Text>
          <Text style={styles.totalAmount}>₹{Number(formData.finalAmount).toLocaleString()}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
          <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#4b5563' }}>Cash Paid Now:</Text>
          <TextInput 
            style={[styles.input, { flex: 1, marginBottom: 0, height: 45, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534', fontWeight: 'bold' }]} 
            placeholder="₹ 0" 
            placeholderTextColor="#86efac"
            keyboardType="numeric" 
            value={String(formData.amountPaid)} 
            onChangeText={(val) => setFormData({ ...formData, amountPaid: val })} 
          />
        </View>
      
        <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Save Purchase Bill</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  headerContainer: { backgroundColor: '#fff', padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6b7280', fontWeight: '500', marginTop: 2 },
  section: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  pickerContainer: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', height: 50, justifyContent: 'center', marginBottom: 15 },
  picker: { height: 50, width: '100%' },
  input: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 12, height: 50, fontSize: 16, color: '#111827', marginBottom: 15 },
  datePickerButton: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 12, height: 50, justifyContent: 'center' },
  addItemRow: { flexDirection: 'row', alignItems: 'center' },
  addButton: { backgroundColor: '#4338ca', width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#4338ca', shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },
  addButtonText: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginTop: -2 },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  itemIconBg: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  itemDetail: { fontSize: 13, color: '#6b7280', marginTop: 3, fontWeight: '500' },
  itemTotal: { fontSize: 17, fontWeight: '900', color: '#4338ca' },
  deleteBtn: { padding: 8, marginLeft: 5 },
  emptyCard: { backgroundColor: '#fff', padding: 30, borderRadius: 16, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#e2e8f0' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 10, fontSize: 14, fontWeight: '600' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' },
  totalAmount: { fontSize: 28, fontWeight: '900', color: '#111827' },
  saveBtn: { backgroundColor: '#4338ca', paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#4338ca', shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});

export default PurchaseEntryScreen;