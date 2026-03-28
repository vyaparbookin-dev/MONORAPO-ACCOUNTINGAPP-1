import React from "react";
import { View, Text, FlatList } from "react-native";

const StockAlertReport = () => {
  const items = [
    { id: 1, name: "Paint", stock: 3 },
    { id: 2, name: "PVC Pipe", stock: 7 },
  ];

  return (
    <View className="p-4">
      <Text className="text-xl font-bold mb-3">Stock Alert Report</Text>
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