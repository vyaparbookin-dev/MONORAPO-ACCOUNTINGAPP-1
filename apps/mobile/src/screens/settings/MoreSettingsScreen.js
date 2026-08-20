import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getData } from '../../services/ApiService';

export default function MoreSettingsScreen() {
  const navigation = useNavigation();
  const [businessName, setBusinessName] = useState('Ganesh Hardware');
  const [userEmail, setUserEmail] = useState('ankush.bani@gmail.com');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getData('/company/active').catch(() => null);
      if (res?.data?.company) {
        setBusinessName(res.data.company.name || 'Ganesh Hardware');
        setUserEmail(res.data.company.email || 'ankush.bani@gmail.com');
      }
    } catch (e) {
      console.log('Error loading profile:', e);
    }
  };

  const menuSections = [
    {
      title: "Business & Godowns",
      items: [
        { icon: 'business-outline', title: 'Company & Profile', subtitle: 'Ganesh Hardware details & GSTIN', screen: 'Profile', stack: 'Settings' },
        { icon: 'storefront-outline', title: 'Godowns & Warehouses', subtitle: 'Manage stock locations & godowns', screen: 'WarehouseList', stack: 'Settings' },
        { icon: 'receipt-outline', title: 'Invoice & Print Settings', subtitle: 'Thermal print, UPI QR & Logo', screen: 'AppSettings', stack: 'Settings' },
        { icon: 'wallet-outline', title: 'Expenses & Kharcha', subtitle: 'Track daily business expenses', screen: 'Expenses', stack: 'Settings' },
      ]
    },
    {
      title: "Staff & Payroll",
      items: [
        { icon: 'people-outline', title: 'Manage Staff & Roles', subtitle: 'Admin, Cashier, Billing roles', screen: 'StaffManagement', stack: 'Settings' },
        { icon: 'cash-outline', title: 'Staff Salary & Attendance', subtitle: 'Mark attendance & payouts', screen: 'SalaryList', stack: 'Settings' },
      ]
    },
    {
      title: "Customers & Marketing",
      items: [
        { icon: 'pricetag-outline', title: 'Coupons & Discounts', subtitle: 'Festival offers & promo codes', screen: 'CouponList', stack: 'Settings' },
        { icon: 'star-outline', title: 'Loyalty & Memberships', subtitle: 'Customer points & rewards', screen: 'MembershipList', stack: 'Settings' },
        { icon: 'book-outline', title: 'Laterpad & Rough Khata', subtitle: 'Instant rough notes & estimates', screen: 'LaterpadList', stack: 'Settings' },
      ]
    },
    {
      title: "Data, Backup & Security",
      items: [
        { icon: 'cloud-upload-outline', title: 'Backup & Restore', subtitle: 'Supabase & Google Drive backup', screen: 'BackupRestore', stack: 'Settings' },
        { icon: 'sync-outline', title: 'Cloud Sync & Offline Mode', subtitle: 'Real-time database sync status', screen: 'CloudSync', stack: 'Settings' },
        { icon: 'shield-checkmark-outline', title: 'Security & Audit Logs', subtitle: 'Track activity and bill changes', screen: 'SecurityLogs', stack: 'Settings' },
        { icon: 'notifications-outline', title: 'Payment Reminders', subtitle: 'Automated WhatsApp alerts', screen: 'Reminder', stack: 'Settings' },
      ]
    },
  ];

  const handleNavigation = (item) => {
    if (!item.screen) {
      Alert.alert('Coming Soon', 'This feature is being prepared for the mobile experience.');
      return;
    }

    try {
      if (item.stack) {
        navigation.navigate(item.stack, { screen: item.screen });
      } else {
        navigation.navigate('Settings', { screen: item.screen });
      }
    } catch (err) {
      console.log('Navigation error:', err);
      // Fallback
      navigation.navigate(item.screen);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More Options & Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Business Profile Card */}
        <TouchableOpacity 
          style={styles.profileCard}
          onPress={() => navigation.navigate('Settings', { screen: 'Profile' })}
          activeOpacity={0.85}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>GH</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.businessName}>{businessName}</Text>
            <Text style={styles.phone}>{userEmail}</Text>
            <Text style={styles.statusBadge}>🟢 Active Business • Supabase Cloud</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* Desktop Sync & Cloud Card */}
        <View style={styles.premiumCard}>
          <MaterialCommunityIcons name="cloud-sync" size={28} color="#10B981" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.premiumTitle}>Multi-Device Live Sync</Text>
            <Text style={styles.premiumSub}>Mobile, Web and Desktop are 100% connected</Text>
          </View>
          <Ionicons name="checkmark-circle" size={22} color="#10B981" />
        </View>

        {/* Settings Sections */}
        {menuSections.map((section, sectionIdx) => (
          <View key={sectionIdx} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.listContainer}>
              {section.items.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.listItem, index === section.items.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => handleNavigation(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.listIconBg}>
                    <Ionicons name={item.icon} size={19} color="#6366F1" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.listTitle}>{item.title}</Text>
                    <Text style={styles.listSub}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  header: { 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 16, 
    paddingTop: Platform.OS === 'ios' ? 44 : 14, 
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { 
    color: '#0F172A', 
    fontSize: 18, 
    fontWeight: '800' 
  },
  content: { 
    padding: 14, 
    paddingBottom: 100 
  },
  profileCard: { 
    backgroundColor: '#FFFFFF', 
    padding: 14, 
    borderRadius: 14, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, 
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: { 
    width: 46, 
    height: 46, 
    borderRadius: 12, 
    backgroundColor: '#EEF2FF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  avatarText: { 
    color: '#4F46E5', 
    fontSize: 17, 
    fontWeight: '800' 
  },
  businessName: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: '#0F172A' 
  },
  phone: { 
    fontSize: 12, 
    color: '#64748B', 
    marginTop: 1 
  },
  statusBadge: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
    marginTop: 3,
  },
  premiumCard: { 
    backgroundColor: '#0F172A', 
    padding: 14, 
    borderRadius: 14, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16, 
  },
  premiumTitle: { 
    color: '#FFFFFF', 
    fontSize: 14, 
    fontWeight: '800' 
  },
  premiumSub: { 
    color: '#94A3B8', 
    fontSize: 11, 
    marginTop: 2 
  },
  
  sectionContainer: { 
    marginBottom: 16 
  },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#64748B', 
    marginBottom: 6, 
    marginLeft: 4, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  listContainer: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 14, 
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  listItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  listIconBg: { 
    width: 34, 
    height: 34, 
    borderRadius: 10, 
    backgroundColor: '#EEF2FF', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  listTitle: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#1E293B' 
  },
  listSub: { 
    fontSize: 11, 
    color: '#64748B', 
    marginTop: 1 
  }
});