import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { getData } from '../../services/ApiService';

const MultiSiteBillingScreen = ({ navigation }) => {
  const [sites, setSites] = useState([]);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const res = await getData('/branch'); 
      setSites(res.data?.branches || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select Site/Branch for Billing</Text>
      
      <FlatList
        data={sites}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('Billing', { siteId: item._id, siteName: item.name })}
          >
            <Text style={styles.siteName}>{item.name}</Text>
            <Text style={styles.siteLocation}>{item.location}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No sites found</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  card: { 
    backgroundColor: '#fff', 
    padding: 20, 
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
  siteName: { fontSize: 18, fontWeight: 'bold', color: '#007bff' },
  siteLocation: { fontSize: 14, color: '#666', marginTop: 5 },
  empty: { textAlign: 'center', marginTop: 50, color: '#888' }
});

export default MultiSiteBillingScreen;