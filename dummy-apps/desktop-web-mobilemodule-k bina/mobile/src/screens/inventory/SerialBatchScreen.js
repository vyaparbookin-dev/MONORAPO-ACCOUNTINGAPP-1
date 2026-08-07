import React, { useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert, StyleSheet, Platform } from "react-native";
import { Ionicons } from '@expo/vector-icons';

const SerialBatchScreen = () => {
  const [serial, setSerial] = useState("");
  const [serials, setSerials] = useState([]);

  const addSerial = () => {
    if (!serial) return Alert.alert("Validation Error", "Please enter a Serial Number");
    setSerials([...serials, serial]);
    setSerial("");
  };

  const removeSerial = (index) => {
    setSerials(serials.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Serial/Batch Management</Text>
        <Text style={styles.headerSubtitle}>Track individual items</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Enter Serial or Batch No."
            value={serial}
            onChangeText={setSerial}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addSerial}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          <Text style={styles.listHeader}>Added Serials ({serials.length})</Text>
          <FlatList
            data={serials}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.listItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="barcode-outline" size={20} color="#6b7280" style={{ marginRight: 10 }} />
                  <Text style={styles.itemText}>{item}</Text>
                </View>
                <TouchableOpacity onPress={() => removeSerial(index)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No serial numbers added yet.</Text>}
          />
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
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 15, height: 55, fontSize: 16, marginRight: 10 },
  addBtn: { backgroundColor: '#4338ca', width: 55, height: 55, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#4338ca', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  listContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  listHeader: { fontSize: 14, fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 10 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#f3f4f6' },
  itemText: { fontSize: 16, color: '#111827', fontWeight: '600' },
  deleteBtn: { padding: 5 },
  emptyText: { textAlign: 'center', color: '#9ca3af', fontStyle: 'italic', marginVertical: 20 }
});

export default SerialBatchScreen;