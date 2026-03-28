import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

const dummyParties = [
  { id: '1', name: 'Ramesh Hardware', type: 'Customer', amount: 15400, isToCollect: true, phone: '9876543210' },
  { id: '2', name: 'Super Traders (Supplier)', type: 'Supplier', amount: 8200, isToCollect: false, phone: '9876543211' },
  { id: '3', name: 'Amit Builders', type: 'Customer', amount: 4500, isToCollect: true, phone: '9876543212' },
];

export default function PartiesScreen() {
  const [activeTab, setActiveTab] = useState('All');

  const renderParty = ({ item }) => (
    <View style={styles.partyCard}>
      <View style={styles.partyInfo}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.charAt(0)}</Text></View>
        <View>
          <Text style={styles.partyName}>{item.name}</Text>
          <Text style={styles.partyType}>{item.type}</Text>
        </View>
      </View>
      <View style={styles.amountSection}>
        <Text style={[styles.amountText, { color: item.isToCollect ? '#2ECC71' : '#E74C3C' }]}>
          ₹ {item.amount}
        </Text>
        <Text style={styles.amountSubtext}>{item.isToCollect ? 'To Collect' : 'To Pay'}</Text>
        
        <TouchableOpacity style={styles.whatsappBtn}>
          <FontAwesome name="whatsapp" size={14} color="#2ECC71" />
          <Text style={styles.whatsappText}>Remind</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Parties</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#7F8C8D" />
          <TextInput placeholder="Search party..." style={styles.searchInput} placeholderTextColor="#7F8C8D" />
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
      <FlatList
        data={dummyParties}
        keyExtractor={item => item.id}
        renderItem={renderParty}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      />

      {/* Bottom Action */}
      <TouchableOpacity style={styles.createBtn}>
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