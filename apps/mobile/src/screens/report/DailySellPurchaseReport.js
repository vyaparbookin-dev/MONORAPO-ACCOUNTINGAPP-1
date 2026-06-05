import React, { useState } from "react";
import { View, Text, Button, FlatList, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const DailySellPurchaseReport = () => {
  const [filterType, setFilterType] = useState("this_month");
  const [data, setData] = useState([
    { id: 1, type: "Sale", amount: 15000 },
    { id: 2, type: "Purchase", amount: 12000 },
  ]);

  const filterReport = () => {
    console.log("Filter applied for:", filterType);
  };

  const handleSharePDF = async () => {
    try {
      const rows = data.map(item => `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">${item.type}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${item.amount}</td>
        </tr>
      `).join('');
      
      const html = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="text-align: center;">Daily Sell & Purchase Report</h2>
            <p style="text-align: center;">Period: ${filterType.replace('_', ' ').toUpperCase()}</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Type</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Amount</th>
              </tr>
              ${rows}
            </table>
          </body>
        </html>
      `;
      
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { dialogTitle: 'Share Daily Report' });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate report');
    }
  };

  const filters = [
    { id: 'today', label: 'Today' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_year', label: 'This Year' }
  ];

  return (
    <View className="p-4">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 10 }}>
        <Text className="text-xl font-bold mb-3">Sell & Purchase</Text>
        <TouchableOpacity onPress={handleSharePDF} style={{ backgroundColor: '#16a34a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 5 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Share PDF</Text>
        </TouchableOpacity>
      </View>
      
      <View style={{ flexDirection: 'row', marginBottom: 15 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map(f => (
            <TouchableOpacity key={f.id} onPress={() => setFilterType(f.id)} style={{ paddingHorizontal: 15, paddingVertical: 8, backgroundColor: filterType === f.id ? '#2563eb' : '#e5e7eb', borderRadius: 20, marginRight: 10 }}>
              <Text style={{ color: filterType === f.id ? '#fff' : '#4b5563', fontWeight: 'bold' }}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <FlatList
        className="mt-4"
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="border-b py-2">
            <Text>{item.type}: ₹{item.amount}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default DailySellPurchaseReport;