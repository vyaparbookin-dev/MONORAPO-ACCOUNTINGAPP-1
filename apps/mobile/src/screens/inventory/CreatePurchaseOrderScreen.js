import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { postData } from '../../services/ApiService';

const CreatePurchaseOrderScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const initialItem = route.params?.item;

  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialItem) {
      setItems([{
        productId: initialItem._id,
        name: initialItem.name,
        quantity: String(initialItem.minimumStock || 10),
        price: String(initialItem.costPrice || 0),
      }]);
    }
  }, [initialItem]);

  const handleAddItem = () => {
    // In mobile, we'll keep it simple and not add more items for now
    Alert.alert("Info", "Adding more items can be done from the web/desktop app.");
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0).toFixed(2);
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      Alert.alert("Error", "Please add at least one item.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        items: items.map(i => ({
          productId: i.productId,
          name: i.name,
          quantity: parseFloat(i.quantity),
          price: parseFloat(i.price)
        })),
        notes,
      };
      await postData('/purchase-orders', payload);
      Alert.alert('Success', 'Purchase Order Created!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to create Purchase Order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Create Purchase Order</Text>
      
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <TextInput
              style={styles.input}
              value={item.quantity}
              onChangeText={text => {
                const newItems = [...items];
                newItems[index].quantity = text;
                setItems(newItems);
              }}
              placeholder="Qty"
              keyboardType="numeric"
            />
            <TouchableOpacity onPress={() => handleRemoveItem(index)}>
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))}

        <Text style={styles.totalText}>Total: ₹{calculateTotal()}</Text>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Save Purchase Order</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 15 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 15 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 10 },
  itemName: { flex: 1, fontSize: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, padding: 8, width: 60, textAlign: 'center', marginHorizontal: 10 },
  totalText: { fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginTop: 15, marginBottom: 20 },
  submitBtn: { backgroundColor: '#16a34a', padding: 15, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default CreatePurchaseOrderScreen;