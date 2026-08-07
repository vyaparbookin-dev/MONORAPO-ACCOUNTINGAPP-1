import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { postData } from '../../services/ApiService';
import { Ionicons } from '@expo/vector-icons';

const BackupRestoreScreen = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  // Setup Google Auth (Client IDs to be added later from Google Console)
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com', // Baad me replace karein
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',         // Baad me replace karein
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',         // Baad me replace karein
    scopes: ['https://www.googleapis.com/auth/drive.file', 'profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      setAccessToken(response.authentication.accessToken);
      Alert.alert("Login Success", "Google account linked. You can now backup to Drive.");
    }
  }, [response]);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      // API call to backend /api/cloud/backup
      const res = await postData('/cloud/backup', { googleAccessToken: accessToken });
      
      if (res.data?.success) {
        const { firebase, googleDrive } = res.data.results;
        let msg = "Backup completed successfully!";
        if (firebase) msg += "\n✅ Saved to Secure Cloud (Firebase)";
        if (googleDrive) msg += "\n✅ Saved to Google Drive";
        Alert.alert("Success", msg);
      } else {
        Alert.alert("Notice", "Backup completed, but check backend logs for cloud status.");
      }
    } catch (error) {
      console.error("Backup Error:", error);
      Alert.alert("Error", "Could not complete backup process. Is backend running?");
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Secure Cloud Backup</Text>
      <Text style={styles.subtitle}>Keep your business data safe on the cloud and your personal Google Drive.</Text>

      <View style={styles.card}>
        <View style={styles.statusRow}>
          <Ionicons name="logo-google" size={24} color={accessToken ? "#16a34a" : "#6b7280"} />
          <Text style={styles.statusText}>
            {accessToken ? "Google Account Linked" : "Google Drive Not Linked"}
          </Text>
        </View>

        {!accessToken && (
          <TouchableOpacity 
            style={styles.googleBtn} 
            onPress={() => promptAsync()}
            disabled={!request}
          >
            <Text style={styles.googleBtnText}>Link Google Drive</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.backupBtn, isBackingUp && styles.backupBtnDisabled]} 
        onPress={handleBackup}
        disabled={isBackingUp}
      >
        {isBackingUp ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.backupBtnText}>Backup Data Now</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f3f4f6' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 25 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { height: 2, width: 0 } },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  statusText: { fontSize: 16, fontWeight: '500', marginLeft: 10, color: '#374151' },
  googleBtn: { backgroundColor: '#eff6ff', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#bfdbfe' },
  googleBtnText: { color: '#2563eb', fontWeight: 'bold', fontSize: 15 },
  backupBtn: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 3 },
  backupBtnDisabled: { backgroundColor: '#93c5fd' },
  backupBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default BackupRestoreScreen;