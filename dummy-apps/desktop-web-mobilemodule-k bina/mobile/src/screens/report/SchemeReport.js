import React from "react";
import { View, Text, FlatList } from "react-native";

const SchemeReport = () => {
  const schemes = [
    { id: 1, name: "Festive Offer", usage: "120 times" },
    { id: 2, name: "Loyalty Discount", usage: "80 times" },
  ];

  return (
    <View className="p-4">
      <Text className="text-xl font-bold mb-3">Scheme Report</Text>
      <FlatList
        data={schemes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="border-b py-2">
            <Text>{item.name}</Text>
            <Text>Used: {item.usage}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default SchemeReport;