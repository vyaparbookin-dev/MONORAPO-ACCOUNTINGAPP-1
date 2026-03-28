import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { postData } from '../../services/ApiService';
import { syncQueue } from '@repo/shared/src/services/syncqueue.native';

const ReviewParsedBillScreen = ({ route, navigation }) => {
  const { parsedItems: initialParsedItems, fullText, partyId, partyName, billImageUrl } = route.params;
  const [items, setItems] = useState(initialParsedItems || []);
  const [billHeader, setBillHeader] = useState(partyName || ""); // Initialize with partyName if available
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Optionally parse bill header info from fullText if needed
    // For now, let's just log it
    console.log("Full Text from OCR:", fullText);
  }, [fullText]);

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0).toFixed(2);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = field === 'name' ? value : parseFloat(value) || 0;
    // Recalculate price if rate or quantity changes
    if (field === 'quantity' || field === 'rate') {
      newItems[index].price = (newItems[index].quantity * newItems[index].rate).toFixed(2);
      newItems[index].taxable = (newItems[index].quantity * newItems[index].rate).toFixed(2); // Assuming taxable is also price * quantity
    }
    setItems(newItems);
  };

  const saveBill = async () => {
    if (items.length === 0) {
      Alert.alert("Error", "No items to save.");
      return;
    }

    setIsSaving(true);
    try {
      // Assuming a simplified bill structure for now
      const billData = {
        billNumber: billHeader || `AUTO-${Date.now()}`, // Or extract from fullText more robustly
        date: new Date().toISOString(),
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          rate: item.rate,
          price: item.price,
          taxable: item.taxable,
          // Add other fields as needed, e.g., unit, category
        })),
        totalAmount: calculateTotal(),
        partyId: partyId, // Add partyId to billData
        billImageUrl: billImageUrl, // Add billImageUrl to billData
        // Potentially add companyId if available via context/storage
      };
      
      syncQueue.enqueue({
        method: 'post',
        url: '/billing',
        data: billData
      });
      Alert.alert("Success", `Bill saved successfully!`);
      navigation.goBack(); // Go back to the previous screen (ProductImageUpload)
    } catch (error) {
      console.error("Save bill error:", error.response?.data || error.message);
      Alert.alert("Error", `Failed to save bill: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Review & Confirm Bill</Text>

      <TextInput
        style={styles.billHeaderInput}
        placeholder="Bill Number or Reference"
        value={billHeader}
        onChangeText={setBillHeader}
      />

      <FlatList
        data={items}
        keyExtractor={(item, index) => String(index)}
        renderItem={({ item, index }) => (
          <View style={styles.itemRow}>
            <TextInput
              style={[styles.itemInput, styles.itemName]}
              value={item.name}
              onChangeText={(text) => handleItemChange(index, 'name', text)}
              placeholder="Item Name"
            />
            <TextInput
              style={[styles.itemInput, styles.itemQty]}
              value={String(item.quantity)}
              onChangeText={(text) => handleItemChange(index, 'quantity', text)}
              keyboardType="numeric"
              placeholder="Qty"
            />
            <TextInput
              style={[styles.itemInput, styles.itemRate]}
              value={String(item.rate)}
              onChangeText={(text) => handleItemChange(index, 'rate', text)}
              keyboardType="numeric"
              placeholder="Rate"
            />
            <Text style={styles.itemPrice}>₹ {item.price}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No items parsed. Please check the image or add manually.</Text>}
      />

      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Total Amount:</Text>
        <Text style={styles.totalAmount}>₹ {calculateTotal()}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()} disabled={isSaving}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={saveBill} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Bill</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f8f8f8',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  billHeaderInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        
        
        
        
      },
      android: { ...Platform.select({
      ios: {     },
      android: { elevation: 1 },
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.2)' }
    }), },
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.2)' }
    }),
  },
  itemInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 5,
    marginRight: 5,
  },
  itemName: {
    flex: 3,
    fontSize: 15,
    color: '#333',
  },
  itemQty: {
    flex: 1,
    fontSize: 15,
    textAlign: 'center',
  },
  itemRate: {
    flex: 1.5,
    fontSize: 15,
    textAlign: 'right',
  },
  itemPrice: {
    flex: 1.5,
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#007bff',
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReviewParsedBillScreen;