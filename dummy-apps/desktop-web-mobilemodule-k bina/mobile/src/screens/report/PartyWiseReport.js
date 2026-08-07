import React from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const PartyWiseReport = () => {
  const parties = [
    { id: 1, name: "ABC Traders", balance: 12000 },
    { id: 2, name: "XYZ Infra", balance: -8000 },
  ];

  const handleSharePDF = async () => {
    try {
      const rows = parties.map(item => `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: right; color: ${item.balance >= 0 ? '#16a34a' : '#dc2626'}; font-weight: bold;">₹${item.balance}</td>
        </tr>
      `).join('');
      
      const html = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="text-align: center; color: #111827;">Party Wise Report</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Party Name</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Net Balance</th>
              </tr>
              ${rows}
            </table>
          </body>
        </html>
      `;
      
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { dialogTitle: 'Share Party Wise Report' });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  return (
    <View className="p-4">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <Text className="text-xl font-bold">Party Wise Report</Text>
        <TouchableOpacity onPress={handleSharePDF} style={{ backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 5 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Share PDF</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={parties}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="border-b py-2">
            <Text>{item.name} — Balance: ₹{item.balance}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default PartyWiseReport;