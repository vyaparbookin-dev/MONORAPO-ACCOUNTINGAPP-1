import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { postData } from "../../services/ApiService";

const KeyRecoveryScreen = () => {
  const [recoveryKey, setRecoveryKey] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRecovery = async () => {
    if (!recoveryKey) return Alert.alert("Error", "Please enter recovery key");
    
    setLoading(true);
    try {
      const res = await postData("/api/security/recover-key", { key: recoveryKey });
      Alert.alert("Success", res.data?.message || "Key verified successfully!");
      // Navigate to reset password or dashboard as needed
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Invalid or expired key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recover Access</Text>
      <Text style={styles.subtitle}>Enter your secret recovery key to regain access.</Text>
      
      <TextInput 
        placeholder="Enter Recovery Key" 
        value={recoveryKey} 
        onChangeText={setRecoveryKey} 
        style={styles.input} 
      />
      
      <TouchableOpacity onPress={handleRecovery} style={styles.button} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Verify Key</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "bold", color: "#333", marginBottom: 10, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 30 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 15, marginBottom: 20, fontSize: 16, backgroundColor: "#f9f9f9" },
  button: { backgroundColor: "#ffc107", padding: 15, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#000", fontSize: 16, fontWeight: "bold" },
});

export default KeyRecoveryScreen;