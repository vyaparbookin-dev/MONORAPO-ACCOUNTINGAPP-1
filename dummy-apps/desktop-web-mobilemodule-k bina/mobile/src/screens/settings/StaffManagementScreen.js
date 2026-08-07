import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getData, putData } from '../../services/ApiService';
import { getUsersLocal, updateUserRoleLocal } from '../../../db'; // Offline DB

const StaffManagementScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // 1. Offline First
      const localUsers = await getUsersLocal();
      setUsers(localUsers || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Access Denied', 'Only Admins can view and manage user roles.');
    } finally {
      setFetching(false);
    }
  };

  const handleRoleChange = async (userId, newRole, userName) => {
    Alert.alert('Change Role', `Change role for ${userName} to ${newRole.toUpperCase()}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes, Change', onPress: async () => {
          setLoading(true);
          try {
            // 1. Offline First
            await updateUserRoleLocal(userId, newRole);
            
            Alert.alert('Success', 'Role updated successfully!');
            fetchUsers();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to update role');
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  if (fetching) return <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1, justifyContent: 'center' }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Role & Access Management</Text>
      <Text style={styles.subText}>Assign roles to restrict what users can see and do.</Text>

      <FlatList
        data={users}
        keyExtractor={item => item.uuid || item._id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>
              <Text style={styles.currentRole}>Current: {item.role?.toUpperCase() || 'USER'}</Text>
            </View>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={item.role || 'user'}
                onValueChange={(val) => { if (val !== item.role) handleRoleChange(item.uuid || item._id, val, item.name); }}
                style={styles.picker}
                enabled={!loading}
              >
                <Picker.Item label="Admin" value="admin" />
                <Picker.Item label="Manager" value="manager" />
                <Picker.Item label="Cashier" value="cashier" />
                <Picker.Item label="User" value="user" />
              </Picker>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No users found or Access Denied.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 15 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  subText: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 20 },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 12, alignItems: 'center', elevation: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  userEmail: { fontSize: 13, color: '#6b7280', marginBottom: 5 },
  currentRole: { fontSize: 11, fontWeight: 'bold', color: '#2563eb', backgroundColor: '#eff6ff', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  pickerContainer: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, width: 140, height: 45, justifyContent: 'center', backgroundColor: '#f9fafb' },
  picker: { height: 45, width: '100%' },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 30 }
});

export default StaffManagementScreen;