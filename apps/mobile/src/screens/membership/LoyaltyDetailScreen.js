import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Platform } from 'react-native';
import API from '../../services/Api';

const LoyaltyDetailScreen = ({ route }) => {
  const { memberId } = route.params || {};
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (memberId) {
      loadMemberDetails();
    }
  }, [memberId]);

  const loadMemberDetails = async () => {
    try {
      const res = await API.get(`/membership/${memberId}`);
      setMember(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load loyalty details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 50 }} />;
  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!member) return <Text style={styles.error}>Member not found</Text>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{member.name}</Text>
        <Text style={styles.subtitle}>{member.phone}</Text>
        
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsLabel}>Loyalty Points</Text>
          <Text style={styles.pointsValue}>{member.points || 0}</Text>
        </View>
        
        <Text style={styles.level}>Level: {member.level || 'Bronze'}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  card: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 10, 
    alignItems: 'center',
    ...Platform.select({
      ios: {     },
      android: { ...Platform.select({
      ios: {     },
      android: { elevation: 3 },
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.2)' }
    }), },
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.2)' }
    })
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  pointsContainer: { backgroundColor: '#e0f2fe', padding: 20, borderRadius: 100, width: 150, height: 150, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  pointsLabel: { fontSize: 14, color: '#0284c7', fontWeight: 'bold' },
  pointsValue: { fontSize: 36, fontWeight: 'bold', color: '#0284c7' },
  level: { fontSize: 18, fontWeight: 'bold', color: '#d97706' },
  error: { textAlign: 'center', marginTop: 50, color: 'red', fontSize: 16 }
});

export default LoyaltyDetailScreen;