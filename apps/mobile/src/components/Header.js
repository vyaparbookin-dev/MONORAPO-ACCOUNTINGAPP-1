import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CloudSyncToggle from './CloudSyncToggle';

const Header = ({ title, navigation }) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        <TouchableOpacity onPress={() => navigation.toggleDrawer ? navigation.toggleDrawer() : navigation.goBack()}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || 'Red Accounting'}</Text>
      </View>
      
      {/* Right side me Offline/Online Sync Button */}
      <View style={styles.rightSection}>
        <CloudSyncToggle />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#111827', paddingHorizontal: 15, paddingTop: 40, paddingBottom: 15,
  },
  leftSection: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  rightSection: { flexDirection: 'row', alignItems: 'center' }
});

export default Header;