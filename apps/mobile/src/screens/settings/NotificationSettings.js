import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { postData } from '../../services/ApiService';
import { getSettingLocal, saveSettingLocal } from '../../../db'; // Offline DB

const NotifiCationSettings = () => {
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const email = await getSettingLocal('emailNotif');
      const sms = await getSettingLocal('smsNotif');
      if (email !== null) setEmailNotif(email === 'true');
      if (sms !== null) setSmsNotif(sms === 'true');
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. Offline First: Save to SQLite
      await saveSettingLocal('emailNotif', String(emailNotif));
      await saveSettingLocal('smsNotif', String(smsNotif));

      Alert.alert("Success", "Notification settings updated.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to update settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notification Preferences</Text>
      
      <View style={styles.row}>
        <Text style={styles.label}>Email Notifications</Text>
        <Switch value={emailNotif} onValueChange={setEmailNotif} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>SMS Notifications</Text>
        <Switch value={smsNotif} onValueChange={setSmsNotif} />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  label: { fontSize: 16 },
  button: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});

export default NotifiCationSettings;