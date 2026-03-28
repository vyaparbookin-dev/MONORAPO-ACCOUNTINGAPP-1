import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { postData } from '../../services/ApiService';
import { getSettingLocal, saveSettingLocal } from '../../../db'; // Offline DB

const CloudsyncSetting = () => {
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      // 1. Offline First: Load setting from SQLite
      const syncStatus = await getSettingLocal('autoSync');
      if (syncStatus !== null) setIsSyncEnabled(syncStatus === 'true');
    };
    loadSettings();
  }, []);

  const toggleSwitch = async () => {
    const newValue = !isSyncEnabled;
    setIsSyncEnabled(newValue);
    // 1. Offline First: Save setting to SQLite
    await saveSettingLocal('autoSync', String(newValue));
  };

  const handleManualSync = async () => {
    setLoading(true);
    try {
      // Trigger sync API
      await postData('/sync/data', { timestamp: new Date().toISOString() });
      Alert.alert("Success", "Data synced successfully with cloud.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Sync failed. Check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Cloud Sync Settings</Text>
      
      <View style={styles.settingRow}>
        <Text style={styles.label}>Auto Sync Data</Text>
        <Switch
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isSyncEnabled ? "#2563eb" : "#f4f3f4"}
          onValueChange={toggleSwitch}
          value={isSyncEnabled}
        />
      </View>

      <TouchableOpacity style={styles.syncButton} onPress={handleManualSync} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sync Now</Text>}
      </TouchableOpacity>

      <Text style={styles.info}>Last Synced: Never</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  label: { fontSize: 18, color: '#333' },
  syncButton: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  info: { marginTop: 20, color: '#666', textAlign: 'center' }
});

export default CloudsyncSetting;