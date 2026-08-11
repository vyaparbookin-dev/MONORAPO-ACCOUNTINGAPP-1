import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/ApiService';

export default function LeadListScreen({ navigation }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leads');
      setLeads(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch leads", err);
      Alert.alert("Error", "Failed to load leads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchLeads);
    return unsubscribe;
  }, [navigation]);

  const renderLeadItem = ({ item }) => (
    <TouchableOpacity style={styles.leadCard} onPress={() => navigation.navigate('CreateLead', { leadId: item._id })}>
      <View style={styles.cardHeader}>
        <Text style={styles.leadName}>{item.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'qualified' ? '#dcfce7' : '#f3f4f6' }]}>
          <Text style={[styles.statusText, { color: item.status === 'qualified' ? '#16a34a' : '#374151' }]}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.contactInfo}>{item.mobileNumber || item.email}</Text>
      <Text style={styles.source}>Source: {item.source || 'N/A'}</Text>
      {item.followUpDate && <Text style={styles.followUp}>Follow-up: {new Date(item.followUpDate).toLocaleDateString()}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leads</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateLead')} style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.addButtonText}>New Lead</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8b5cf6" style={styles.loader} />
      ) : leads.length === 0 ? (
        <Text style={styles.emptyMessage}>No leads found. Tap '+' to create one!</Text>
      ) : (
        <FlatList
          data={leads}
          renderItem={renderLeadItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#111827', paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8b5cf6', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  addButtonText: { color: '#fff', marginLeft: 5, fontWeight: 'bold' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyMessage: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#6b7280' },
  listContent: { padding: 10 },
  leadCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  leadName: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
  contactInfo: { fontSize: 14, color: '#4b5563', marginBottom: 3 },
  source: { fontSize: 12, color: '#6b7280', fontStyle: 'italic' },
  followUp: { fontSize: 12, color: '#c026d3', fontWeight: 'bold', marginTop: 5 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 15, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
});