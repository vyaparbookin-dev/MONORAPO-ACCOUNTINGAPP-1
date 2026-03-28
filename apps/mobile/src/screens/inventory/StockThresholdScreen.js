import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Platform } from "react-native";
import { Ionicons } from '@expo/vector-icons';

const StockThresholdScreen = () => {
  const [minStock, setMinStock] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const saveThreshold = () => {
    if (!minStock) return Alert.alert("Validation Error", "Please enter minimum stock level");
    setAlertMessage(`Alert successfully set for stock below ${minStock}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Stock Alert Settings</Text>
        <Text style={styles.headerSubtitle}>Manage minimum stock thresholds</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Minimum Stock Quantity</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter quantity (e.g. 10)"
            value={minStock}
            onChangeText={setMinStock}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={saveThreshold}>
            <Text style={styles.saveBtnText}>Set Alert</Text>
          </TouchableOpacity>
          
          {alertMessage ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
              <Text style={styles.successText}>{alertMessage}</Text>
            </View>
          ) : null}
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
  label: { fontSize: 13, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 15, height: 55, fontSize: 16, color: '#111827', marginBottom: 20 },
  saveBtn: { backgroundColor: '#4338ca', paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#4338ca', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  successBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', padding: 12, borderRadius: 8, marginTop: 20, borderWidth: 1, borderColor: '#bbf7d0' },
  successText: { color: '#166534', marginLeft: 8, fontWeight: '600' }
});

export default StockThresholdScreen;