import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from '@expo/vector-icons';

const QrCodeGenerator = () => {
  const [text, setText] = useState("");
  const [show, setShow] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>QR Code Generator</Text>
        <Text style={styles.headerSubtitle}>Create QR codes for products</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Product Code / Data</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter product code"
            value={text}
            onChangeText={(val) => {
              setText(val);
              setShow(false);
            }}
          />
          <TouchableOpacity 
            style={[styles.btn, !text ? styles.btnDisabled : null]} 
            onPress={() => setShow(true)}
            disabled={!text}
          >
            <Ionicons name="qr-code" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.btnText}>Generate QR</Text>
          </TouchableOpacity>
        </View>

        {show && text !== "" && (
          <View style={styles.qrCard}>
            <View style={styles.qrWrapper}>
              <QRCode value={text} size={200} />
            </View>
            <Text style={styles.qrText}>{text}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  headerContainer: { backgroundColor: '#fff', padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6b7280', fontWeight: '500', marginTop: 2 },
  content: { padding: 15 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 15, height: 55, fontSize: 16, color: '#111827', marginBottom: 20 },
  btn: { flexDirection: 'row', backgroundColor: '#4338ca', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { backgroundColor: '#9ca3af' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  qrCard: { backgroundColor: '#fff', marginTop: 20, padding: 30, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  qrWrapper: { padding: 15, backgroundColor: '#fff', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12 },
  qrText: { marginTop: 15, fontSize: 16, fontWeight: 'bold', color: '#374151' }
});

export default QrCodeGenerator;