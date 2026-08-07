import React from "react";
import { View, Text, FlatList } from "react-native";

const ItemWiseReport = () => {
  const items = [
    { id: 1, name: "Cement", qty: 50, amount: 25000 },
    { id: 2, name: "TMT Bars", qty: 100, amount: 75000 },
  ];

  return (
    <View className="p-4">
      <Text className="text-xl font-bold mb-3">Item Wise Report</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="border-b py-2">
            <Text>{item.name} — Qty: {item.qty}, ₹{item.amount}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default ItemWiseReport;