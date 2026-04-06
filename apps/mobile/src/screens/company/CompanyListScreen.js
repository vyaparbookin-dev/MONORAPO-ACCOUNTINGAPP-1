import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../../services/Api';
import { getCompaniesLocal, addCompanyLocal } from '../../../db'; // Offline DB

const CompanyListScreen = ({ navigation }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCompanies();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      
      // 1. Offline First: Fetch from SQLite
      let localCompanies = await getCompaniesLocal();
      
      // 2. Sync-Down: Agar local me data nahi hai, toh Cloud se download karke save karo
      if (!localCompanies || localCompanies.length === 0) {
        const res = await API.get('/company'); // Fetch from backend
        const cloudCompanies = res.data?.companies || res.data || [];
        
        if (cloudCompanies.length > 0) {
          for (const comp of cloudCompanies) {
            await addCompanyLocal({
              uuid: comp._id, // Cloud ID ko hi Local UUID bana do taaki match ho sake
              name: comp.name,
              email: comp.email,
              phone: comp.phone,
              address: comp.address,
              gstNumber: comp.gstNumber,
              website: comp.website,
              businessType: comp.businessType,
              businessDescription: comp.businessDescription || comp.businessType,
              panNumber: comp.panNumber,
              bankName: comp.bankName,
              accountName: comp.accountName,
              accountNumber: comp.accountNumber,
              ifscCode: comp.ifscCode,
              upiId: comp.upiId,
              caName: comp.caName,
              caPhone: comp.caPhone,
              gstType: comp.gstType || 'regular'
            });
          }
          // Cloud se save karne ke baad wapas local DB se read karo
          localCompanies = await getCompaniesLocal();
        }
      }
      
      setCompanies(localCompanies || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.visitingCard} 
      onPress={() => navigation.navigate('FeatureControl', { companyId: item.uuid || item._id, companyName: item.name })}
    >
      {/* Visiting Card Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.name}</Text>
        {item.businessDescription ? (
          <Text style={styles.businessDesc}>{item.businessDescription.toUpperCase()}</Text>
        ) : null}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        {item.businessType ? (
          <View style={styles.badge}><Text style={styles.badgeText}>{item.businessType.toUpperCase()}</Text></View>
        ) : null}
        {item.gstType ? (
          <View style={[styles.badge, { backgroundColor: item.gstType === 'composition' ? '#f59e0b' : item.gstType === 'unregistered' ? '#6b7280' : '#10b981' }]}>
            <Text style={styles.badgeText}>{(item.gstType === 'composition' ? 'COMPOSITION' : item.gstType === 'unregistered' ? 'UNREGISTERED' : 'REGULAR GST')}</Text>
          </View>
        ) : null}
      </View>
      </View>
      
      {/* Visiting Card Body (Only Main Details) */}
      <View style={styles.cardBody}>
        <Text style={styles.details}><Ionicons name="call" size={14} color="#666" /> {item.phone || 'N/A'}</Text>
        <Text style={styles.details}><Ionicons name="mail" size={14} color="#666" /> {item.email || 'N/A'}</Text>
        <Text style={styles.details}><Ionicons name="location" size={14} color="#666" /> {item.address || 'N/A'}</Text>
        {item.website ? <Text style={styles.details}><Ionicons name="globe" size={14} color="#666" /> {item.website}</Text> : null}
        {item.upiId ? <Text style={styles.details}><Ionicons name="qr-code" size={14} color="#666" /> UPI: {item.upiId}</Text> : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Companies</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddCompany')}>
          <Ionicons name="add-circle" size={30} color="#007bff" />
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} /> : (
        <FlatList
          data={companies}
          keyExtractor={item => item.uuid || item._id || Math.random().toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No companies found.</Text>}
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