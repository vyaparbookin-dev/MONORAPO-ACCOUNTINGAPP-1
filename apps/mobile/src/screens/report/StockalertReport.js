import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from "react-native";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import api from "../../services/api";
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const StockAlertReport = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  
  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/reports/low-stock-items");
      setItems(res.data.items || []);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to fetch low stock items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleCreatePO = (item) => {
    navigation.navigate('Inventory', { screen: 'CreatePurchaseOrder', params: { item } });
  };

  const handleSharePDF = async () => {
    try {
      const rows = items.map(item => `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: red; font-weight: bold;">${item.currentStock} ${item.unit}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.minimumStock} ${item.unit}</td>
        </tr>
      `).join('');
      
      const html = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="text-align: center; color: #b91c1c;">Low Stock Alert Report</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr style="background-color: #fee2e2;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product Name</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Current Stock</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Min. Stock</th>
              </tr>
              ${rows}
            </table>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { dialogTitle: 'Share Stock Alerts' });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stock Alert Report</Text>
        <TouchableOpacity onPress={handleSharePDF} style={styles.pdfBtn}>
          <Ionicons name="share-social" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#dc2626" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{flex: 1}}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.stockInfo}>
                  <Text style={styles.stockLabel}>Current:</Text>
                  <Text style={styles.currentStock}>{item.currentStock} {item.unit}</Text>
                  <Text style={styles.stockLabel}>Min:</Text>
                  <Text style={styles.minStock}>{item.minimumStock} {item.unit}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.poButton} onPress={() => handleCreatePO(item)}>
                <Text style={styles.poButtonText}>Create PO</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>All items are well-stocked!</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fef2f2' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#b91c1c' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  pdfBtn: { padding: 8, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 15, marginTop: 15, padding: 15, borderRadius: 8, elevation: 2 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
  stockInfo: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  stockLabel: { fontSize: 12, color: '#6b7280' },
  currentStock: { fontSize: 18, fontWeight: 'bold', color: '#dc2626' },
  minStock: { fontSize: 14, color: '#9ca3af' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#166534' },
  poButton: { backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  poButtonText: { color: '#16a34a', fontWeight: 'bold', fontSize: 12 },
});

export default StockAlertReport;