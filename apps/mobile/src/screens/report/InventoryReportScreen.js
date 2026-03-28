import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  FlatList,
  Platform,
} from "react-native";
import { getData } from "../../services/ApiService";

const InventoryReportScreen = ({ navigation }) => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchTerm]);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getData("/inventory"); // Assuming the backend API is /inventory
      // FIX: Backend returns { success: true, products: [...] } instead of a direct array
      setInventory(response.data?.products || (Array.isArray(response.data) ? response.data : []));
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
      setError(err.message || "Failed to fetch inventory");
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const filterInventory = () => {
    let filtered = [...inventory];
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.hsnCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredInventory(filtered);
  };

  const lowStockCount = inventory.filter((item) => item.currentStock < (item.minimumStock || 10)).length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.sellingPrice), 0);
  const totalProducts = inventory.length;

  const renderProductItem = ({ item }) => {
    const isLowStock = item.currentStock < (item.minimumStock || 10);
    return (
      <View style={[styles.productCard, isLowStock && styles.lowStockCard]}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{item.name}</Text>
          {isLowStock && <Text style={styles.lowStockBadge}>⚠️ Low Stock</Text>}
        </View>
        <Text style={styles.productDetails}>SKU: {item.sku || 'N/A'} | HSN: {item.hsnCode || 'N/A'}</Text>
        <Text style={styles.productDetails}>Category: {item.category || 'N/A'}</Text>
        <Text style={styles.productDetails}>Unit: {item.unit || 'N/A'}</Text>
        <Text style={styles.productDetails}>Stock: {item.currentStock} (Min: {item.minimumStock || 10})</Text>
        <Text style={styles.productDetails}>CP: ₹{item.costPrice || 0} | SP: ₹{item.sellingPrice || 0}</Text>
        <Text style={styles.productDetails}>GST: {item.gstRate || 0}%</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory Report</Text>
        <TouchableOpacity onPress={fetchInventory} style={styles.refreshButton}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.refreshButtonText}>Refresh</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Quick Stats */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Products</Text>
          <Text style={styles.metricValue}>{totalProducts}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Value</Text>
          <Text style={styles.metricValue}>₹{totalValue.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Low Stock Items</Text>
          <Text style={[styles.metricValue, lowStockCount > 0 && { color: "#ea580c" }]}>{lowStockCount}</Text>
        </View>
      </View>

      {/* Search */}
      <TextInput
        placeholder="Search products..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        style={styles.searchInput}
      />

      {loading && filteredInventory.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading Inventory...</Text>
        </View>
      ) : filteredInventory.length === 0 ? (
        <Text style={styles.noDataText}>No products found.</Text>
      ) : (
        <FlatList
          data={filteredInventory}
          renderItem={renderProductItem}
          keyExtractor={(item) => item._id}
          style={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    padding: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  refreshButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: 10,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  metricCard: {
    width: "32%", // Roughly third width
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    ...Platform.select({
      ios: {     },
      android: { ...Platform.select({
      ios: {     },
      android: { elevation: 2 },
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.2)' }
    }), },
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.2)' }
    }),
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: "#666",
    marginBottom: 5,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: 'center',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    fontSize: 14,
    backgroundColor: "#fff",
    marginBottom: 15,
  },
  productCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    ...Platform.select({
      ios: {     },
      android: { ...Platform.select({
      ios: {     },
      android: { elevation: 2 },
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.2)' }
    }), },
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.2)' }
    })
  },
  lowStockCard: {
    backgroundColor: "#fff3e0", // Light orange background for low stock
    borderColor: "#ff9800",
    borderWidth: 1,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  lowStockBadge: {
    backgroundColor: "#ff9800",
    color: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    fontSize: 10,
    fontWeight: 'bold',
  },
  productDetails: {
    fontSize: 13,
    color: "#555",
    marginBottom: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
  noDataText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    color: "#777",
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  list: {
    flex: 1,
  },
});

export default InventoryReportScreen;