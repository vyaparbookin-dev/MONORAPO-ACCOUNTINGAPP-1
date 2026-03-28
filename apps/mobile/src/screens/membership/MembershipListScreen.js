import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import API from '../../services/Api';

const MembershipListScreen = ({ navigation }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMembers();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/membership');
      setMembers(res.data?.members || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('LoyaltyDetail', { memberId: item._id })}
    >
      <View style={styles.row}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.points}>{item.points || 0} pts</Text>
      </View>
      <Text style={styles.phone}>{item.phone}</Text>
      <Text style={styles.level}>Level: {item.level || 'Bronze'}</Text>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={members}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No members found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  card: { 
    backgroundColor: '#fff', 
    padding: 15, 
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  points: { fontSize: 16, fontWeight: 'bold', color: '#007bff' },
  phone: { color: '#666', fontSize: 14 },
  level: { color: '#d97706', fontWeight: 'bold', marginTop: 5 },
  empty: { textAlign: 'center', marginTop: 50, color: '#888' }
});

export default MembershipListScreen;