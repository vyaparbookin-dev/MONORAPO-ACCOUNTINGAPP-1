import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { postData } from "../../services/ApiService";

const isEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      return Alert.alert("Validation Error", "All fields are required.");
    }
    if (!isEmail(email)) {
      return Alert.alert("Validation Error", "Please enter a valid email address.");
    }

    setLoading(true);
    try {
      const res = await postData("/auth/register", { name, email, password });
      Alert.alert("Success", res.data?.message || "Account created successfully");
      navigation.navigate("Login");
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join us to manage your business</Text>

      <TextInput placeholder="Full Name" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />
      
      <TouchableOpacity onPress={handleRegister} style={styles.button} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")} style={{ marginTop: 20 }}>
        <Text style={{ textAlign: "center", color: "#666" }}>
          Already have an account? <Text style={{ color: "#28a745", fontWeight: "bold" }}>Login</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 10, textAlign: "center", color: "#333" },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 30, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 15, marginBottom: 15, fontSize: 16, backgroundColor: "#f9f9f9" },
  button: { backgroundColor: "#28a745", padding: 15, marginTop: 10, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "white", textAlign: "center", fontWeight: "bold", fontSize: 16 },
});

export default RegisterScreen;