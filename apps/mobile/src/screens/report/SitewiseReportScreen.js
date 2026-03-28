import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import { getData, postData } from "../../services/ApiService";

const SitewiseReportScreen = ({ navigation }) => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState("month"); // Default filter
  const [selectedSite, setSelectedSite] = useState(""); // Filter by specific site
  const [actualSites, setActualSites] = useState([]); // To store actual sites from API

  const dateRanges = [
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
    { label: "This Quarter", value: "quarter" },
    { label: "This Year", value: "year" },
  ];

  // Dummy list of sites for filter dropdown
  // In a real app, this would come from an API or be dynamically generated from existing bills
  // const dummySites = ["Main Branch", "Construction Site A", "Remote Project X", "Warehouse Y", "Unknown Site"]; // REMOVE THIS LINE

  const fetchSites = async () => {
    try {
      const res = await getData('/branch'); // Assuming branch API exists
      const data = res.data || [];
      // Assuming branch data has _id and name properties
      setActualSites(Array.isArray(data) ? data : []);
      if (data.length > 0 && !selectedSite) {
        setSelectedSite(data[0].name); // Optionally pre-select the first site
      }
    } catch (err) {
      console.error("Error fetching sites:", err);
      Alert.alert("Error", "Failed to load sites for filter.");
    }
  };

  useEffect(() => {
    fetchSites();
  }, []); // Fetch sites on component mount

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = { 
          type: "sitewise", 
          dateRange: dateRange 
      };
      if (selectedSite) {
        payload.siteName = selectedSite;
      }
      
      const res = await postData("/report/generate", payload);
      const d = res.reports || res.data || res;
      setReportData(Array.isArray(d) ? d : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch sitewise report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [dateRange, selectedSite]); // Refetch when filters change

  const renderItemSold = (itemsSold) => {
    return itemsSold.map((item, i) => (
      <Text key={i} style={styles.itemSoldText}>
        {item.name} ({item.totalQuantity} units, ₹{item.totalValue.toLocaleString('en-IN')})
      </Text>
    ));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sitewise Report</Text>
        <TouchableOpacity onPress={fetchReport} style={styles.refreshButton}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.refreshButtonText}>Refresh</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Date Range:</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={dateRange}
            style={styles.picker}
            onValueChange={(itemValue) => setDateRange(itemValue)}
          >
            {dateRanges.map(range => <Picker.Item key={range.value} label={range.label} value={range.value} />)}
          </Picker>
        </View>
      </View>
      
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Select Site:</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedSite}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedSite(itemValue)}
          >
            <Picker.Item label="All Sites" value="" />
            {actualSites.map(site => <Picker.Item key={site._id} label={site.name} value={site.name} />)}
          </Picker>
        </View>
      </View>

      {loading && reportData.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading Sitewise Report...</Text>
        </View>
      ) : reportData.length === 0 ? (
        <Text style={styles.noDataText}>No data available for the selected period/site.</Text>
      ) : (
        <View style={styles.reportList}>
          {reportData.map((row, index) => (
            <View key={index} style={styles.reportCard}>
              <Text style={styles.cardTitle}>{row.siteName}</Text>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Total Bills:</Text>
                <Text style={styles.cardValue}>{row.totalBills}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Total Amount:</Text>
                <Text style={styles.cardValue}>₹{(row.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Total Tax:</Text>
                <Text style={styles.cardValue}>₹{(row.totalTax || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
              </View>
              <View style={styles.itemsSoldContainer}>
                <Text style={styles.cardLabel}>Items Sold:</Text>
                {row.itemsSold && row.itemsSold.length > 0 ? renderItemSold(row.itemsSold) : <Text style={styles.itemSoldText}>No items</Text>}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
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
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
  },
  filterLabel: {
    fontSize: 14,
    marginRight: 10,
    color: '#333',
    fontWeight: 'bold',
  },
  pickerWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden', // To ensure picker border is visible
    height: 40,
  },
  picker: {
    width: '100%',
    height: 40,
    color: '#333',
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
  reportList: {
    // Styles for list of report cards
  },
  reportCard: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  cardLabel: {
    fontSize: 14,
    color: '#374151',
  },
  cardValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  itemsSoldContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  itemSoldText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 3,
  },
});

export default SitewiseReportScreen;