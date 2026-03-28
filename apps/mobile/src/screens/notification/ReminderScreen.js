import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import API from '../../services/Api';

const ReminderScreen = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await API.get('/notifications/reminders');
      setReminders(res.data?.reminders || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reminders</Text>
      <FlatList
        data={reminders}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.reminderTitle}>{item.title}</Text>
            <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
            {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No reminders found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 15 },
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
  reminderTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  date: { fontSize: 12, color: '#888', marginTop: 2 },
  desc: { fontSize: 14, color: '#666', marginTop: 5 },
  empty: { textAlign: 'center', marginTop: 50, color: '#888' }
});

export default ReminderScreen;