import React, { useState } from "react";
import { View, Text, Button, FlatList, TextInput } from "react-native";

const DailySellPurchaseReport = () => {
  const [date, setDate] = useState("");
  const [data, setData] = useState([
    { id: 1, type: "Sale", amount: 15000 },
    { id: 2, type: "Purchase", amount: 12000 },
  ]);

  const filterReport = () => {
    console.log("Filter applied for date:", date);
  };

  return (
    <View className="p-4">
      <Text className="text-xl font-bold mb-3">Daily Sell & Purchase Report</Text>
      <TextInput
        placeholder="Enter Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
        className="border p-2 mb-3"
      />
      <Button title="Filter" onPress={filterReport} color="blue" />
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