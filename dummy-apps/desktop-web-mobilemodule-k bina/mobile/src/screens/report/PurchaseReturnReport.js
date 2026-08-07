import React from "react";
import { View, Text, FlatList } from "react-native";

const PurchaseReturnReport = () => {
  const data = [
    { id: 1, invoice: "PR-1001", amount: 4500 },
    { id: 2, invoice: "PR-1002", amount: 3200 },
  ];

  return (
    <View className="p-4">
      <Text className="text-xl font-bold mb-3">Purchase Return Report</Text>
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

export default PurchaseReturnReport;