import React from "react";
import { View, Text, FlatList } from "react-native";

const PartyWiseReport = () => {
  const parties = [
    { id: 1, name: "ABC Traders", balance: 12000 },
    { id: 2, name: "XYZ Infra", balance: -8000 },
  ];

  return (
    <View className="p-4">
      <Text className="text-xl font-bold mb-3">Party Wise Report</Text>
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