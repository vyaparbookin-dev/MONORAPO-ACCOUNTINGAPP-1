import React from 'react';
import { TouchableOpacity, Linking, Alert, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const UdharReminder = ({ partyName, mobileNumber, pendingAmount }) => {
  const handleSend = async () => {
    if (!mobileNumber) {
      Alert.alert("Error", "Customer mobile number is missing!");
      return;
    }
    if (!pendingAmount || pendingAmount <= 0) {
      Alert.alert("Notice", "No pending amount for this customer.");
      return;
    }

    let mobile = mobileNumber.replace(/\D/g, "");
    if (mobile.length === 10) mobile = "91" + mobile;

    const message = `Hello ${partyName},\n\nThis is a friendly reminder from our store. Your total outstanding balance is *₹${pendingAmount.toLocaleString()}*.\n\nPlease clear the dues at your earliest convenience.\n\nThank you!`;
    const url = `whatsapp://send?phone=${mobile}&text=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Not Installed", "WhatsApp is not installed on your device.");
      }
    } catch (error) {
      console.error("An error occurred", error);
    }
  };

  return (
    <TouchableOpacity onPress={handleSend} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 }}>
      <Ionicons name="logo-whatsapp" size={16} color="#16a34a" />
      <Text style={{ color: '#16a34a', fontWeight: 'bold', fontSize: 13, marginLeft: 5 }}>Remind</Text>
    </TouchableOpacity>
  );
};
export default UdharReminder;