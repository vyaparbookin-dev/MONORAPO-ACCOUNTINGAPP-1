import React from "react";
import { View, Text, FlatList } from "react-native";

const SalesReturnReport = () => {
  const data = [
    { id: 1, invoice: "SR-2001", amount: 2300 },
    { id: 2, invoice: "SR-2002", amount: 5600 },
  ];

  return (
    <View className="p-4">
      <Text className="text-xl font-bold mb-3">Sales Return Report</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="border-b py-2">
            <Text>Invoice: {item.invoice}</Text>
            <Text>Amount: ₹{item.amount}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default SalesReturnReport;