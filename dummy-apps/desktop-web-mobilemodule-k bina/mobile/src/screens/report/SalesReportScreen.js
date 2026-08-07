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
import { postData } from "../../services/ApiService";
import ReportCard from "../../components/ReportCard";

const SalesReportScreen = ({ navigation }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState("month"); // Default date range

  const dateRanges = [
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
    { label: "This Quarter", value: "quarter" },
    { label: "This Year", value: "year" },
  ];

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await postData("/report/generate", { type: "sales", dateRange }); // Assuming backend can handle 'sales' type and dateRange
      const data = res.reports || res.data || res;
      setReportData(data);
    } catch (err) {
      console.error("Error fetching sales report:", err);
      setError(err.message || "Failed to fetch sales report");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [dateRange]); // Refetch when dateRange changes

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sales Report</Text>
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
        <Picker
          selectedValue={dateRange}
          style={styles.picker}
          onValueChange={(itemValue) => setDateRange(itemValue)}
        >
          {dateRanges.map((range) => (
            <Picker.Item key={range.value} label={range.label} value={range.value} />
          ))}
        </Picker>
      </View>

      {loading && !reportData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading Sales Report...</Text>
        </View>
      ) : reportData ? (
        <View style={styles.content}>
          {/* Summary Metrics */}
          <View style={styles.metricsGrid}>
            <ReportCard title="Total Sales" value={`₹${(reportData.totalSales || 0).toLocaleString('en-IN')}`} />
            <ReportCard title="Total Revenue" value={`₹${(reportData.totalRevenue || 0).toLocaleString('en-IN')}`} />
            <ReportCard title="Net Profit" value={`₹${(reportData.netProfit || 0).toLocaleString('en-IN')}`} />
          </View>

          {/* Recent Transactions (simplified table/list) */}
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {reportData.transactions && reportData.transactions.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Invoice No</Text>
                <Text style={[styles.tableHeaderText, { flex: 3 }]}>Customer</Text>
                <Text style={[styles.tableHeaderText, { flex: 2, textAlign: 'right' }]}>Amount</Text>
              </View>
              {reportData.transactions.map((transaction) => (
                <View key={transaction.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{transaction.invoiceNo}</Text>
                  <Text style={[styles.tableCell, { flex: 3 }]}>{transaction.customerName || 'N/A'}</Text>
                  <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>₹{(transaction.amount || 0).toLocaleString('en-IN')}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noDataText}>No recent transactions found for this period.</Text>
          )}

        </View>
      ) : (
        <Text style={styles.noDataText}>No sales data available for the selected period.</Text>
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
  picker: {
    flex: 1,
    height: 40,
    // borderWidth: 1, // Add border to picker
    // borderColor: '#ccc', // Border color
    // borderRadius: 5, // Border radius
  },
  content: {
    // Styles for content wrapper
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  metricCard: {
    width: "48%", // Roughly half width
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
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
  metricLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    marginTop: 10,
  },
  table: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden', // Ensures borders are contained
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
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#eef2f6',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#555',
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableCell: {
    fontSize: 12,
    color: '#333',
    paddingHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200, // Give it some height
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
});

export default SalesReportScreen;