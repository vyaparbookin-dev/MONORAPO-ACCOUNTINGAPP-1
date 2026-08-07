import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { getData } from '../../services/ApiService';
import { getSecurityLogsLocal } from '../../../db'; // Offline DB

const SecurityLogsScreen = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      // 1. Offline First
      const localLogs = await getSecurityLogsLocal();
      setLogs(localLogs || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Security Logs</Text>
      <FlatList
        data={logs}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => {
          const actionParts = (item.action || "Unknown Action").split('|');
          const mainAction = actionParts[0].trim();
          const changes = actionParts.length > 1 ? actionParts.slice(1).join('|').trim() : null;

          return (
            <View style={styles.logItem}>
              <Text style={styles.logTitle}>{mainAction}</Text>
              {changes && <Text style={styles.logChanges}>{changes}</Text>}
              <Text style={styles.date}>{new Date(item.timestamp).toLocaleString()}</Text>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>No logs found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f3f4f6' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#111827' },
  logItem: { padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 10, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }, android: { elevation: 2 } }) },
  logTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  logChanges: { fontSize: 13, color: '#dc2626', marginTop: 6, backgroundColor: '#fee2e2', padding: 6, borderRadius: 6, overflow: 'hidden' },
  date: { fontSize: 12, color: '#6b7280', marginTop: 8 },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 20 }
});

export default SecurityLogsScreen;