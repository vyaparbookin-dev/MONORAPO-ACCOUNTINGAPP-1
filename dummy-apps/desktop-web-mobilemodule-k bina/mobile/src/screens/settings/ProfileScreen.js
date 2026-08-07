import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Header from '../../components/Header';

const ProfileScreen = () => {
  // API se lane ke bajaye direct context se user profile data le rahe hain
  const { user, logout } = useContext(AuthContext);
  const profile = user;

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <Header title="My Profile" />
      <View style={styles.container}>
      {profile ? (
        <Card title="User Details">
          <Text style={styles.label}>Name: {profile.name}</Text>
          <Text style={styles.label}>Email: {profile.email}</Text>
          <Text style={styles.label}>Role: {profile.role || 'User'}</Text>
          <Button title="Logout" onPress={logout} style={{ marginTop: 20, backgroundColor: '#dc2626' }} />
        </Card>
      ) : (
        <Text>Failed to load profile.</Text>
      )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontSize: 16, marginBottom: 10 },
});

export default ProfileScreen;