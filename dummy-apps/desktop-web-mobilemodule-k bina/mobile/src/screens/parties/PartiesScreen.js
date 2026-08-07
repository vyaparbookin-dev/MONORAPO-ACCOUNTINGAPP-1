import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getData } from '../../services/ApiService';
import { getPartiesLocal } from '../../../db';

export default function PartiesScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('All');
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchParties = async () => {
    try {
      // 1. Offline First: Turant Local SQLite se dikhayein
      const localParties = await getPartiesLocal().catch(() => []);
      if (localParties && localParties.length > 0) {
        setParties(localParties);
        setLoading(false);
      }

      // 2. Background Sync: Cloud API se real-time data laayein
      const res = await getData('/party').catch(() => null);
      if (res) {
        setParties(res.data?.parties || (Array.isArray(res.data) ? res.data : []));
      }
    } catch (err) {
      console.error("Error fetching parties:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchParties(); }, []));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchParties();
    setRefreshing(false);
  }, []);

  const renderParty = ({ item }) => {
    const bal = item.balance || item.currentBalance || 0;
    const isToCollect = (item.partyType === 'customer' || item.partyType === 'both') && bal > 0;
    const isToPay = (item.partyType === 'supplier' || item.partyType === 'both') && bal > 0;
    const amountStr = bal.toLocaleString('en-IN');
    const displayType = item.partyType ? item.partyType.charAt(0).toUpperCase() + item.partyType.slice(1) : 'Unknown';
    const statusColor = isToCollect ? '#2ECC71' : (isToPay ? '#E74C3C' : '#7F8C8D');

    return (
    <View style={styles.partyCard}>
      <View style={styles.partyInfo}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(item.name || '?').charAt(0).toUpperCase()}</Text></View>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.partyName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.partyType}>{displayType} {item.mobileNumber ? `• ${item.mobileNumber}` : ''}</Text>
        </View>
      </View>
      <View style={styles.amountSection}>
        <Text style={[styles.amountText, { color: statusColor }]}>
          ₹ {amountStr}
        </Text>
        <Text style={styles.amountSubtext}>{isToCollect ? 'To Collect' : (isToPay ? 'To Pay' : 'Settled')}</Text>
        
        <TouchableOpacity style={styles.whatsappBtn}>
          <FontAwesome name="whatsapp" size={14} color="#2ECC71" />
          <Text style={styles.whatsappText}>Remind</Text>
        </TouchableOpacity>
      </View>
    </View>
    );
  };

  const filteredParties = parties.filter(item => {
    const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const bal = item.balance || item.currentBalance || 0;
    const isToCollect = (item.partyType === 'customer' || item.partyType === 'both') && bal > 0;
    const isToPay = (item.partyType === 'supplier' || item.partyType === 'both') && bal > 0;

    if (!matchesSearch) return false;
    if (activeTab === 'To Collect' && !isToCollect) return false;
    if (activeTab === 'To Pay' && !isToPay) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Parties</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#7F8C8D" />
          <TextInput placeholder="Search party..." style={styles.searchInput} placeholderTextColor="#7F8C8D" value={searchQuery} onChangeText={setSearchQuery} />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['All', 'To Collect', 'To Pay'].map(tab => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#6C4CF1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredParties}
          keyExtractor={item => item._id || Math.random().toString()}
          renderItem={renderParty}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6C4CF1']} />}
          ListEmptyComponent={<Text style={{textAlign: 'center', color: '#7F8C8D', marginTop: 40}}>No parties found.</Text>}
        />
      )}

      {/* Bottom Action */}
      <TouchableOpacity style={styles.createBtn} onPress={() => alert("Add Party Feature Coming Soon")}>
        <Ionicons name="person-add" size={20} color="#FFF" />
        <Text style={styles.createBtnText}>Create New Party</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  header: { backgroundColor: '#6C4CF1', padding: 16, paddingTop: 40, paddingBottom: 24, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  searchBar: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, alignItems: 'center', height: 44 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
  tabs: { flexDirection: 'row', padding: 16, paddingBottom: 0 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 8, backgroundColor: '#EAECEE' },
  activeTab: { backgroundColor: '#6C4CF1' },
  tabText: { color: '#7F8C8D', fontWeight: '600', fontSize: 13 },
  activeTabText: { color: '#FFF' },
  partyCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  partyInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F4ECF7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#9B59B6', fontWeight: 'bold', fontSize: 16 },
  partyName: { fontSize: 15, fontWeight: 'bold', color: '#2C3E50', marginBottom: 2 },
  partyType: { fontSize: 12, color: '#7F8C8D' },
  amountSection: { alignItems: 'flex-end' },
  amountText: { fontSize: 16, fontWeight: 'bold' },
  amountSubtext: { fontSize: 10, color: '#7F8C8D', marginBottom: 6 },
  whatsappBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAFAF1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#2ECC71' },
  whatsappText: { color: '#2ECC71', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  createBtn: { position: 'absolute', bottom: 85, right: 16, backgroundColor: '#6C4CF1', flexDirection: 'row', paddingHorizontal: 20, height: 50, borderRadius: 25, alignItems: 'center', elevation: 5 },
  createBtnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 }
});