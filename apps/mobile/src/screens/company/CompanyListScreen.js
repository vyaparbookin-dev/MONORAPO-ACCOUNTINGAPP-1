import React, { useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompanyContext } from '../../context/CompanyContext';

const CompanyListScreen = ({ navigation }) => {
  const { companies, selectedCompany, loading, selectCompany, refetchCompanies } = useContext(CompanyContext);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refetchCompanies();
    });
    return unsubscribe;
  }, [navigation]);

  const handleSelectCompany = async (company) => {
    await selectCompany(company);
    // Navigate back to the main app dashboard after selection
    navigation.navigate('MainApp', { screen: 'Dashboard' });
  };

  const renderItem = ({ item }) => {
    const isActive = (item.uuid || item._id) === (selectedCompany?.uuid || selectedCompany?._id);
    return (
      <TouchableOpacity
        style={[styles.visitingCard, isActive && styles.activeCard]}
        onPress={() => handleSelectCompany(item)}
      >
        <View style={styles.cardContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.companyName}>{item.name}</Text>
            <Text style={styles.companyDetail}>{item.businessType || 'Business'}</Text>
            <Text style={styles.companyDetail}>{item.phone || item.email}</Text>
          </View>
          <View style={styles.cardActions}>
            {isActive && <Ionicons name="checkmark-circle" size={24} color="#22c55e" />}
            <TouchableOpacity 
              style={styles.settingsIcon}
              onPress={() => navigation.navigate('FeatureControl', { companyId: item.uuid || item._id, companyName: item.name })}
            >
              <Ionicons name="settings-outline" size={22} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#4338ca" />
      ) : (
        <FlatList
          data={companies}
          renderItem={renderItem}
          keyExtractor={(item) => item.uuid || item._id}
          contentContainerStyle={{ padding: 15 }}
          ListHeaderComponent={
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddCompany')}>
              <Ionicons name="add-circle" size={22} color="#fff" />
              <Text style={styles.addButtonText}>Add New Company</Text>
            </TouchableOpacity>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  visitingCard: { 
    backgroundColor: '#1f2937', // Dark theme professional look
    borderRadius: 12, 
    marginBottom: 10, 
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
      android: { elevation: 4 },
      web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.2)' }
    })
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  cardBody: {
    padding: 16,
    backgroundColor: '#fff',
  },
  name: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  businessDesc: { color: '#60a5fa', marginTop: 4, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  badge: { backgroundColor: '#3b82f6', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginTop: 8 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  details: { color: '#4b5563', marginTop: 4, fontSize: 14, fontWeight: '500' },
  empty: { textAlign: 'center', marginTop: 50, color: '#888' }
});

export default CompanyListScreen;