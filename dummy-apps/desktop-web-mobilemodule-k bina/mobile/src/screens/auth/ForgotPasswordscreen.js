import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { postData } from "../../services/ApiService";

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) return Alert.alert("Error", "Please enter your email");
    
    setLoading(true);
    try {
      const res = await postData("/auth/forgot-password", { email });
      Alert.alert("Success", res.data?.message || "Reset link sent to your email");
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Unable to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your registered email to receive a reset link.</Text>
      
      <TextInput 
        placeholder="Enter Email" 
        value={email} 
        onChangeText={setEmail} 
        style={styles.input} 
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TouchableOpacity onPress={handleReset} style={styles.button} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Reset Link</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
        <Text style={{ color: "#666", textAlign: "center" }}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "bold", color: "#333", marginBottom: 10, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 30 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 15, marginBottom: 20, fontSize: 16, backgroundColor: "#f9f9f9" },
  button: { backgroundColor: "#007bff", padding: 15, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});

export default ForgotPasswordScreen;