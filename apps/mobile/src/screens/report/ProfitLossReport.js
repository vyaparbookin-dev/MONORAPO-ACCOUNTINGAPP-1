import React from "react";
import { View, Text } from "react-native";

const ProfitLossReport = () => {
  const totalSales = 150000;
  const totalPurchase = 110000;
  const profit = totalSales - totalPurchase;

  return (
    <View className="p-4">
      <Text className="text-xl font-bold mb-3">Profit & Loss Report</Text>
      <Text>Total Sales: ₹{totalSales}</Text>
      <Text>Total Purchase: ₹{totalPurchase}</Text>
      <Text className="mt-2 text-green-600">
        Profit: ₹{profit >= 0 ? profit : 0}
      </Text>
    </View>
  );
};

export default ProfitLossReport;