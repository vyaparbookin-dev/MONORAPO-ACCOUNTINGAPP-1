import React, { useState, useEffect } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import api from "../../services";

const ItemWiseReport = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/report/item-wise-sales");
      setReportData(res.data.report || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <View className="p-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-bold">Item Wise Report</Text>
        <TouchableOpacity onPress={fetchReport}>
          <Text className="text-blue-600">Refresh</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : error ? (
        <Text className="text-red-500 text-center">{error}</Text>
      ) : (
        <FlatList
          data={reportData}
          keyExtractor={(item) => item.productId.toString()}
          renderItem={({ item }) => (
            <View className="border-b border-gray-200 py-3">
              <Text className="font-bold text-base">{item.productName}</Text>
              <Text className="text-gray-600">Qty Sold: {item.totalQuantitySold} | Total Value: ₹{item.totalSalesValue.toFixed(2)}</Text>
            </View>
          )}
          ListEmptyComponent={<Text className="text-center text-gray-500 mt-10">No data available.</Text>}
        />
      )}
    </View>
  );
};

export default ItemWiseReport;