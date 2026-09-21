import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getData, postData } from '../../services/ApiService';
import { getStaffLocal, addAttendanceLocal, addStaffPaymentLocal } from '../../../db'; // Offline DB

// 🚀 STAFF vs ADMIN Setup:
// In future, replace this with actual AuthContext to get logged-in user dynamically.
// import { useAuth } from '../../context/AuthContext';

const MarkAttendanceScreen = ({ navigation }) => {
  // const { user: loggedInUser } = useAuth();
  const loggedInUser = { role: 'admin', _id: '123' }; // CHANGE 'admin' to 'staff' to test Staff Mode!
  const isManager = ['admin', 'manager'].includes(loggedInUser?.role?.toLowerCase() || 'admin');

  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');
  const [checkingLocation, setCheckingLocation] = useState(false);

  // Mock Shop Coordinates (Will be fetched from settings in future)
  const SHOP_LATITUDE = 28.704060; 
  const SHOP_LONGITUDE = 77.102493;
  const MAX_DISTANCE_METERS = 100;

  const [attForm, setAttForm] = useState({
    status: 'present',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [payForm, setPayForm] = useState({
    amount: '',
    paymentType: 'advance'
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      // 1. Offline First: Fetch staff from SQLite
      const localStaff = await getStaffLocal();
      
      if (!isManager && loggedInUser?._id) {
        // Staff Mode: Show only the logged-in user
        const myProfile = (localStaff || []).filter(s => (s.uuid || s._id) === loggedInUser._id);
        setStaffList(myProfile);
        if (myProfile.length > 0) setSelectedStaff(myProfile[0].uuid || myProfile[0]._id);
      } else {
        // Admin Mode: Show full staff list
        setStaffList(localStaff || []);
      }
      
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load staff list');
    } finally {
      setFetching(false);
    }
  };

  // Haversine formula to calculate distance in meters
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleSmartCheckIn = async () => {
    if (!selectedStaff) return Alert.alert("Error", "Please select a staff member first");
    
    setCheckingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable GPS location to use smart attendance.');
        setCheckingLocation(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const currentLat = location.coords.latitude;
      const currentLon = location.coords.longitude;

      const distance = getDistance(currentLat, currentLon, SHOP_LATITUDE, SHOP_LONGITUDE);

      if (distance > MAX_DISTANCE_METERS) {
        Alert.alert('Out of Range', `You are ${Math.round(distance)} meters away. Must be within ${MAX_DISTANCE_METERS}m of the shop.`);
      } else {
        await handleAttendanceSubmit('present', 'Geo-Fenced Check-in');
      }
    } catch (error) {
      Alert.alert('GPS Error', 'Failed to get location. Ensure GPS is ON.');
    } finally {
      setCheckingLocation(false);
    }
  };

  const handleAttendanceSubmit = async (overrideStatus = null, notes = '') => {
    if (!selectedStaff && !overrideStatus) return Alert.alert('Error', 'Please select an employee');
    setLoading(true);
    try {
      // 1. Offline First: Save to SQLite
      const result = await addAttendanceLocal({ ...attForm, status: overrideStatus || attForm.status, notes, staffId: selectedStaff });
      if (!result.success) throw new Error("Failed to save locally");

      Alert.alert('Success', 'Attendance Marked Successfully!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedStaff || !payForm.amount) return Alert.alert('Error', 'Please select an employee and enter an amount');
    setLoading(true);
    try {
      // 1. Offline First: Save to SQLite
      const result = await addStaffPaymentLocal({ ...payForm, staffId: selectedStaff, amount: Number(payForm.amount) });
      if (!result.success) throw new Error("Failed to save locally");

      Alert.alert('Success', 'Payment Recorded Successfully!');
      setPayForm({ ...payForm, amount: '' });
      fetchStaff(); // Refresh balance
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const currentStaff = staffList.find(s => (s.uuid || s._id) === selectedStaff);

  if (fetching) return <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1, justifyContent: 'center' }} />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Staff Management</Text>

      {isManager ? (
        <View style={styles.card}>
          <Text style={styles.label}>Select Employee *</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={selectedStaff} onValueChange={val => setSelectedStaff(val)} style={styles.picker}>
              <Picker.Item label="-- Choose Employee --" value="" color="#888" />
              {staffList.map(s => <Picker.Item key={s.uuid || s._id} label={s.name} value={s.uuid || s._id} />)}
            </Picker>
          </View>
          {currentStaff && (
            <Text style={styles.balanceText}>
              Current Balance: ₹{currentStaff.balance || 0}
            </Text>
          )}
        </View>
      ) : (
        <View style={[styles.card, { alignItems: 'center', paddingVertical: 20 }]}>
          <Ionicons name="person-circle" size={60} color="#2563eb" />
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginTop: 10 }}>Welcome, {currentStaff?.name || 'Staff'}</Text>
          <Text style={{ color: '#6b7280', fontSize: 14 }}>Mark your daily attendance easily.</Text>
        </View>
      )}

      {/* Smart GPS Check-in */}
      <View style={[styles.card, { backgroundColor: '#1e3a8a' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
          <Ionicons name="location-outline" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 5 }}>GPS Smart Check-in</Text>
        </View>
        <Text style={{ color: '#93c5fd', fontSize: 12, marginBottom: 15 }}>Requires you to be within {MAX_DISTANCE_METERS}m of the shop.</Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#22c55e', padding: 12, borderRadius: 8, alignItems: 'center' }}
          onPress={handleSmartCheckIn}
          disabled={checkingLocation || loading}
        >
          {checkingLocation ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>TAP TO VERIFY & CHECK-IN</Text>}
        </TouchableOpacity>
      </View>

      {isManager && (
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'attendance' && styles.activeTab]} 
            onPress={() => setActiveTab('attendance')}>
            <Text style={[styles.tabText, activeTab === 'attendance' && styles.activeTabText]}>Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'payment' && styles.activeTab]} 
            onPress={() => setActiveTab('payment')}>
            <Text style={[styles.tabText, activeTab === 'payment' && styles.activeTabText]}>Payment / Advance</Text>
          </TouchableOpacity>
        </View>
      )}

      {(activeTab === 'attendance' || !isManager) && (
        <View style={styles.card}>
          <Text style={styles.label}>From Date (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} value={attForm.startDate} onChangeText={txt => setAttForm({...attForm, startDate: txt})} />
          
          <Text style={styles.label}>To Date (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} value={attForm.endDate} onChangeText={txt => setAttForm({...attForm, endDate: txt})} />

          <Text style={styles.label}>Status</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={attForm.status} onValueChange={val => setAttForm({...attForm, status: val})} style={styles.picker}>
              <Picker.Item label="Present (Full Day)" value="present" />
              <Picker.Item label="Half Day" value="half-day" />
              <Picker.Item label="Absent / Leave" value="absent" />
            </Picker>
          </View>

          <TouchableOpacity style={[styles.btn, { backgroundColor: '#2563eb' }]} onPress={handleAttendanceSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Attendance</Text>}
          </TouchableOpacity>
        </View>
      )}

      {isManager && activeTab === 'payment' && (
        <View style={styles.card}>
          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput style={styles.input} placeholder="Enter Amount" keyboardType="numeric" value={payForm.amount} onChangeText={txt => setPayForm({...payForm, amount: txt})} />

          <Text style={styles.label}>Payment Type</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={payForm.paymentType} onValueChange={val => setPayForm({...payForm, paymentType: val})} style={styles.picker}>
              <Picker.Item label="Give Advance (-)" value="advance" />
              <Picker.Item label="Pay Salary (-)" value="salary_settlement" />
              <Picker.Item label="Fine / Deduction (-)" value="deduction" />
              <Picker.Item label="Add Bonus / Incentive (+)" value="incentive" />
            </Picker>
          </View>

          <TouchableOpacity style={[styles.btn, { backgroundColor: '#16a34a' }]} onPress={handlePaymentSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Record Payment</Text>}
          </TouchableOpacity>
        </View>
      )}
      <View style={{height: 40}} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 15 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 15 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, elevation: 2, marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 5 },
  pickerContainer: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#f9fafb', height: 45, justifyContent: 'center', marginBottom: 15 },
  picker: { height: 45 },
  balanceText: { color: '#2563eb', fontWeight: 'bold', fontSize: 13, marginTop: -5 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, marginBottom: 15, overflow: 'hidden', elevation: 1 },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
  activeTab: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  tabText: { fontWeight: '600', color: '#6b7280' },
  activeTabText: { color: '#2563eb' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, marginBottom: 15, backgroundColor: '#f9fafb', height: 45 },
  btn: { padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default MarkAttendanceScreen;