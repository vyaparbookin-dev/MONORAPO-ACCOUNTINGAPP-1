import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function MoreSettingsScreen() {
  const navigation = useNavigation();
  
  const menuSections = [
    {
      title: "Business & Inventory",
      items: [
        { icon: 'business-outline', title: 'Companies & Branches', subtitle: 'Manage multiple businesses', screen: 'CompanyList' },
        { icon: 'storefront-outline', title: 'Warehouses', subtitle: 'Manage stock locations', screen: 'WarehouseList' },
        { icon: 'receipt-outline', title: 'Invoice Settings', subtitle: 'GST, Logo, Print', screen: 'AppSettings' },
      ]
    },
    {
      title: "Staff & Payroll",
      items: [
        { icon: 'people-outline', title: 'Manage Users & Roles', subtitle: 'Admin, Cashier permissions', screen: 'StaffManagement' },
        { icon: 'cash-outline', title: 'Staff & Salary', subtitle: 'Attendance, Payroll', screen: 'SalaryList' },
      ]
    },
    {
      title: "Customers & Marketing",
      items: [
        { icon: 'pricetag-outline', title: 'Coupons & Offers', subtitle: 'Discount codes', screen: 'CouponList' },
        { icon: 'star-outline', title: 'Memberships', subtitle: 'Loyalty programs', screen: 'MembershipList' },
        { icon: 'book-outline', title: 'Laterpad', subtitle: 'Rough notes & entries', screen: 'LaterpadList' },
      ]
    },
    {
      title: "Data & Security",
      items: [
        { icon: 'cloud-upload-outline', title: 'Backup & Restore', subtitle: 'Google Drive backup', screen: 'BackupRestore' },
        { icon: 'sync-outline', title: 'Cloud Sync', subtitle: 'Offline to Online sync', screen: 'CloudsyncSetting' },
        { icon: 'shield-checkmark-outline', title: 'Security Logs', subtitle: 'Track user activity', screen: 'SecurityLogs' },
        { icon: 'notifications-outline', title: 'Reminders', subtitle: 'Payment alerts', screen: 'Reminder' },
      ]
    },
    {
      title: "Account",
      items: [
        { icon: 'person-outline', title: 'Profile', subtitle: 'My Account details', screen: 'Profile' },
      ]
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More Options</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Business Profile */}
        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.avatar}><Text style={styles.avatarText}>GT</Text></TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.businessName}>Ganesh Traders</Text>
            <Text style={styles.phone}>+91 9876543210</Text>
          </View>
          <TouchableOpacity><Ionicons name="pencil" size={20} color="#6C4CF1" /></TouchableOpacity>
        </View>

        {/* Subscription Card */}
        <TouchableOpacity style={styles.premiumCard}>
          <MaterialCommunityIcons name="crown" size={28} color="#F1C40F" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
            <Text style={styles.premiumSub}>Unlock Desktop Sync & E-Way Bills</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FFF" />
        </TouchableOpacity>

        {/* Settings List */}
        {menuSections.map((section, sectionIdx) => (
          <View key={sectionIdx} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.listContainer}>
              {section.items.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.listItem, index === section.items.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => item.screen ? navigation.navigate(item.screen) : Alert.alert('Coming Soon', 'This feature will be available shortly.')}>
                  <View style={styles.listIconBg}><Ionicons name={item.icon} size={20} color="#6C4CF1" /></View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.listTitle}>{item.title}</Text>
                    <Text style={styles.listSub}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#BDC3C7" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  header: { backgroundColor: '#6C4CF1', padding: 16, paddingTop: 40, paddingBottom: 20 },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  content: { padding: 16, paddingBottom: 100 },
  profileCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 16, elevation: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F4ECF7', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { color: '#6C4CF1', fontSize: 18, fontWeight: 'bold' },
  businessName: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  phone: { fontSize: 13, color: '#7F8C8D', marginTop: 2 },
  premiumCard: { backgroundColor: '#2C3E50', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 24, elevation: 4 },
  premiumTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  premiumSub: { color: '#BDC3C7', fontSize: 12, marginTop: 2 },
  
  sectionContainer: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#7F8C8D', marginBottom: 10, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 },
  listContainer: { backgroundColor: '#FFF', borderRadius: 16, padding: 8, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F2F4F4' },
  listIconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4ECF7', justifyContent: 'center', alignItems: 'center' },
  listTitle: { fontSize: 15, fontWeight: '600', color: '#34495E' },
  listSub: { fontSize: 11, color: '#7F8C8D', marginTop: 2 }
});