import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Image, Alert, ActivityIndicator, Platform, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { getData, putData } from '../../services/ApiService';
import { AuthContext } from '../../context/AuthContext';
import { getSettingLocal, saveSettingLocal, updateCompanyLocal } from '../../../db'; // Offline DB
import api, { RAZORPAY_KEY_ID } from '../../services/ApiService'; // Ensure this is imported for payment API calls and Razorpay Key

// Safely import Razorpay so it doesn't crash the Web version or Expo Go
let RazorpayCheckout = null;
if (Platform.OS !== 'web') {
  RazorpayCheckout = require('react-native-razorpay').default;
}

const AppSettingsScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext); // Assuming user has company ID
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyId, setCompanyId] = useState(user?.company || null);
  
  const [theme, setTheme] = useState('light');
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // New states for licensing
  const [invoiceThemeColor, setInvoiceThemeColor] = useState('#007bff'); // Default blue
  const [invoiceTemplateType, setInvoiceTemplateType] = useState('classic'); // Default classic
  const [plan, setPlan] = useState('free');
  const [freeBillCount, setFreeBillCount] = useState(0);
  const [maxFreeBills, setMaxFreeBills] = useState(50);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState(null);

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });

  useEffect(() => {
    fetchCompanyDetails();
  }, []);

  const fetchCompanyDetails = async () => {
    try {
      // Fetch company from backend
      const compRes = await getData('/company');
      const comp = compRes.data?.companies?.[0];
      
      if (comp) {
        setSelectedCompany(comp);
        setCompanyId(comp._id);
        if (comp.logo) setLogoPreview(comp.logo);
        setInvoiceThemeColor(comp.invoiceThemeColor || '#007bff');
        setInvoiceTemplateType(comp.invoiceTemplateType || 'classic');
        setPlan(comp.plan || 'free');
        setFreeBillCount(comp.freeBillCount || 0);
        setMaxFreeBills(comp.maxFreeBills || 50);
        setSubscriptionExpiresAt(comp.subscriptionExpiresAt ? new Date(comp.subscriptionExpiresAt) : null);
      }

      // Load other settings from local DB
      const pushSetting = await getSettingLocal('pushNotif');
      if (pushSetting !== null) setNotifications(prev => ({ ...prev, push: pushSetting === 'true' }));

    } catch (err) {
      console.error("Failed to load company details", err);
    } finally {
      setLoading(false);
    }
  };

  const refetchCompanies = () => fetchCompanyDetails();

  const handleLogoUpload = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'You need to allow camera roll permissions to upload a logo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true, // We need base64 to send to backend directly like web
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setLogoPreview(base64Image);
    }
  };

  const handleSaveChanges = async () => {
    if (!companyId) return Alert.alert("Error", "No company selected.");
    setSaving(true);
    try {
      // Save to SQLite (for local settings)
      if (logoPreview) await saveSettingLocal(`company_logo_${selectedCompany._id}`, logoPreview);
      await saveSettingLocal('pushNotif', String(notifications.push));
      
      // Send to backend (for company-specific settings like logo, invoice theme)
      await api.put(`/api/company/${selectedCompany._id}`, { 
        logo: logoPreview, 
        invoiceThemeColor, 
        invoiceTemplateType,
        // plan, freeBillCount, maxFreeBills, subscriptionExpiresAt are updated via payment flow, not directly here.
      });

      refetchCompanies(); // Refresh company data from backend
      Alert.alert("Success", "Settings saved successfully!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleInvoiceThemeColorChange = (value) => {
    setInvoiceThemeColor(value);
  };

  const handleInvoiceTemplateTypeChange = (value) => {
    setInvoiceTemplateType(value);
  };

  const handleUpgradeToPremium = async () => {
    if (!selectedCompany) {
      Alert.alert("Error", "Please select a company first.");
      return;
    }

    const amount = 99900; // ₹999.00 (in paisa) for 1 year premium
    const planName = "Premium Plan (1 Year)";

    try {
      // Backend se Razorpay order create karein
      const orderRes = await api.post('/api/payment/order', { amount, currency: 'INR', receipt: `subscription_${selectedCompany._id}` });
      const order = orderRes.data.order;

      const options = {
        description: planName,
        image: 'https://your-app-logo.png', // Replace with your app logo URL
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID', // **IMPORTANT: Replace with your actual Razorpay Key ID**
        amount: order.amount,
        name: 'RedAccounting App',
        order_id: order.id,
        prefill: {
          email: selectedCompany.email,
          contact: selectedCompany.phone,
          name: selectedCompany.name,
        },
        theme: { color: selectedCompany.invoiceThemeColor || '#007bff' },
      };

      if (!RazorpayCheckout) {
        Alert.alert("Notice", "Razorpay payments require a Native Android/iOS App. It won't work on Web or basic Expo Go app.");
        return;
      }

      RazorpayCheckout.open(options)
        .then(async (data) => {
          // Payment successful
          await api.post('/api/payment/verify', { ...data, billId: null, companyId: selectedCompany._id }); // billId is null for subscription
          Alert.alert("Success", "Payment Successful! Your plan has been upgraded.");
          refetchCompanies(); // Fetch updated company details
        })
        .catch((error) => {
          // Payment failed or cancelled
          console.error("Razorpay Error:", error);
          Alert.alert("Payment Failed", error.description || "Please try again.");
        });
    } catch (error) {
      console.error("Payment initiation failed:", error);
      Alert.alert("Error", "Failed to initiate payment. Please try again.");
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>App Settings</Text>

      {/* Company Logo Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Company Logo</Text>
        <Text style={styles.subText}>This logo will appear on PDF invoices.</Text>
        
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            {logoPreview ? (
              <Image source={{ uri: logoPreview }} style={styles.logoImage} />
            ) : (
              <Text style={styles.noLogoText}>No Logo</Text>
            )}
          </View>
          <TouchableOpacity style={styles.uploadBtn} onPress={handleLogoUpload}>
            <Text style={styles.uploadBtnText}>Choose Logo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Invoice Customization Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invoice Customization</Text>
        <Text style={styles.subText}>Customize the look and feel of your PDF invoices.</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Theme Color</Text>
          <TextInput
            style={styles.colorInput}
            value={invoiceThemeColor}
            onChangeText={handleInvoiceThemeColorChange}
            placeholder="#007bff"
          />
          <View style={[styles.colorPreview, { backgroundColor: invoiceThemeColor }]} />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Invoice Template</Text>
          <Picker
            selectedValue={invoiceTemplateType}
            onValueChange={handleInvoiceTemplateTypeChange}
            style={styles.picker}
          >
            <Picker.Item label="Classic" value="classic" />
            <Picker.Item label="Modern" value="modern" />
            <Picker.Item label="Minimal" value="minimal" />
          </Picker>
        </View>
      </View>

      {/* Subscription & Plan Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription & Plan</Text>
        <Text style={styles.subText}>Manage your current plan and upgrade for more features.</Text>
        
        <View style={styles.planCard}>
          <View style={styles.planRow}>
            <Text style={styles.planLabel}>Current Plan:</Text>
            <Text style={[styles.planStatus, plan === 'premium' ? styles.premiumStatus : styles.freeStatus]}>
              {plan.toUpperCase()}
            </Text>
          </View>
          {plan === 'free' && (
            <View style={styles.planRow}>
              <Text style={styles.planLabel}>Bills Created:</Text>
              <Text style={styles.planValue}>{freeBillCount} / {maxFreeBills}</Text>
              {freeBillCount >= maxFreeBills && (
                <Text style={styles.limitExceededText}>Free bill limit reached! Upgrade to continue creating bills.</Text>
              )}
            </View>
          )}
          {plan === 'premium' && subscriptionExpiresAt && (
            <View style={styles.planRow}>
              <Text style={styles.planLabel}>Expires On:</Text>
              <Text style={styles.planValue}>{subscriptionExpiresAt.toLocaleDateString()}</Text>
            </View>
          )}
          {plan === 'free' && (
            <TouchableOpacity onPress={handleUpgradeToPremium} style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Upgrade to Premium (₹999/year)</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Other Settings Placeholder */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Push Notifications</Text>
          <Switch value={notifications.push} onValueChange={(val) => setNotifications({...notifications, push: val})} />
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSaveChanges} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Settings</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  section: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 5 },
  subText: { fontSize: 12, color: '#6b7280', marginBottom: 10 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoBox: { width: 80, height: 80, borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'dashed', borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6', overflow: 'hidden' },
  logoImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  noLogoText: { fontSize: 12, color: '#9ca3af' },
  uploadBtn: { marginLeft: 20, backgroundColor: '#eff6ff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#bfdbfe' },
  uploadBtnText: { color: '#2563eb', fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  label: { fontSize: 16, color: '#374151' },
  saveBtn: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // New styles for Invoice Customization
  colorInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 40,
    width: 100,
    fontSize: 14,
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  picker: {
    height: 40,
    width: '50%', // Adjust width as needed
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
  },

  // New styles for Subscription & Plan
  planCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  planLabel: { fontSize: 14, fontWeight: '500', color: '#333' },
  planValue: { fontSize: 14, color: '#555' },
  planStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontSize: 10, fontWeight: 'bold' },
  freeStatus: { backgroundColor: '#e0f7fa', color: '#007bff' },
  premiumStatus: { backgroundColor: '#e8f5e9', color: '#28a745' },
  limitExceededText: { fontSize: 12, color: 'red', marginTop: 4, textAlign: 'right', flex: 1 },
  upgradeButton: { backgroundColor: '#6a0dad', paddingVertical: 10, borderRadius: 8, marginTop: 12, alignItems: 'center' },
  upgradeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default AppSettingsScreen;