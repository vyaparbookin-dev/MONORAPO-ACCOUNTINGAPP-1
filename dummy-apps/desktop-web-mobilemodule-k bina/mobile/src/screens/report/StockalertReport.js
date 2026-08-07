import React from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const StockAlertReport = () => {
  const items = [
    { id: 1, name: "Paint", stock: 3 },
    { id: 2, name: "PVC Pipe", stock: 7 },
  ];

  const handleSharePDF = async () => {
    try {
      const rows = items.map(item => `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: red; font-weight: bold;">${item.stock}</td>
        </tr>
      `).join('');
      
      const html = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="text-align: center; color: #dc2626;">Low Stock Alert Report</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr style="background-color: #fee2e2;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product Name</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Remaining Stock</th>
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
    <View className="p-4">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <Text className="text-xl font-bold">Stock Alert Report</Text>
        <TouchableOpacity onPress={handleSharePDF} style={{ backgroundColor: '#dc2626', padding: 8, paddingHorizontal: 15, borderRadius: 5 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Share PDF</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="border-b py-2">
            <Text>{item.name}</Text>
            <Text>Remaining: {item.stock}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default StockAlertReport;