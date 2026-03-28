import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import API from '../../services/Api';

const FeatureControlScreen = ({ route, navigation }) => {
  const { companyId, companyName } = route.params || {};
  
  // Mock features state - in real app, fetch from API based on companyId
  const [features, setFeatures] = useState({
    inventory: true,
    billing: true,
    gst: true,
    sms: false,
    email: true,
    loyalty: false
  });

  const toggleSwitch = (key) => {
    setFeatures(previousState => ({ ...previousState, [key]: !previousState[key] }));
  };

  const saveSettings = async () => {
    try {
      // await API.put(`/company/${companyId}/features`, features);
      Alert.alert('Success', 'Features updated successfully');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to update features');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Features for {companyName}</Text>
      <Text style={styles.subtitle}>Enable or disable modules for this company.</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Inventory Management</Text>
          <Switch value={features.inventory} onValueChange={() => toggleSwitch('inventory')} />
        </View>
        <View style={styles.divider} />
        
        <View style={styles.row}>
          <Text style={styles.label}>Billing & Invoicing</Text>
          <Switch value={features.billing} onValueChange={() => toggleSwitch('billing')} />
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>GST Reports</Text>
          <Switch value={features.gst} onValueChange={() => toggleSwitch('gst')} />
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>SMS Notifications</Text>
          <Switch value={features.sms} onValueChange={() => toggleSwitch('sms')} />
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Email Alerts</Text>
          <Switch value={features.email} onValueChange={() => toggleSwitch('email')} />
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Loyalty Program</Text>
          <Switch value={features.loyalty} onValueChange={() => toggleSwitch('loyalty')} />
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={saveSettings}>
        <Text style={styles.saveText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    padding: 10, 
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10 },
  label: { fontSize: 16, color: '#333' },
  divider: { height: 1, backgroundColor: '#eee' },
  saveBtn: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default FeatureControlScreen;