import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Picker } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/ApiService';

export default function CreateLeadScreen({ navigation, route }) {
  const { leadId } = route.params || {}; // For editing existing lead
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    email: '',
    source: '',
    status: 'new',
    notes: '',
    followUpDate: '',
  });

  useEffect(() => {
    if (leadId) {
      const fetchLead = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/leads/${leadId}`);
          const lead = res.data.data;
          setFormData({
            ...lead,
            followUpDate: lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : '',
          });
        } catch (err) {
          console.error("Failed to fetch lead", err);
          Alert.alert("Error", "Failed to load lead data.");
        } finally {
          setLoading(false);
        }
      };
      fetchLead();
    }
  }, [leadId]);

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (leadId) {
        await api.put(`/leads/${leadId}`, formData);
        Alert.alert("Success", "Lead updated successfully!");
      } else {
        await api.post('/leads', formData);
        Alert.alert("Success", "Lead created successfully!");
      }
      navigation.goBack();
    } catch (err) {
      console.error("Failed to save lead", err);
      Alert.alert("Error", "Failed to save lead.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#8b5cf6" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{leadId ? 'Edit Lead' : 'Create Lead'}</Text>
        <TouchableOpacity onPress={handleSubmit} style={styles.saveButton}>
          <Ionicons name="save-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.formSection}>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={formData.name} onChangeText={(text) => handleInputChange('name', text)} required />

          <Text style={styles.label}>Mobile Number</Text>
          <TextInput style={styles.input} value={formData.mobileNumber} onChangeText={(text) => handleInputChange('mobileNumber', text)} keyboardType="phone-pad" />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={formData.email} onChangeText={(text) => handleInputChange('email', text)} keyboardType="email-address" />

          <Text style={styles.label}>Source</Text>
          <TextInput style={styles.input} value={formData.source} onChangeText={(text) => handleInputChange('source', text)} />

          <Text style={styles.label}>Status</Text>
          <Picker
            selectedValue={formData.status}
            onValueChange={(itemValue) => handleInputChange('status', itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="New" value="new" />
            <Picker.Item label="Contacted" value="contacted" />
            <Picker.Item label="Qualified" value="qualified" />
            <Picker.Item label="Unqualified" value="unqualified" />
            <Picker.Item label="Converted" value="converted" />
          </Picker>

          <Text style={styles.label}>Follow-up Date</Text>
          <TextInput style={styles.input} value={formData.followUpDate} onChangeText={(text) => handleInputChange('followUpDate', text)} placeholder="YYYY-MM-DD" />

          <Text style={styles.label}>Notes</Text>
          <TextInput style={[styles.input, styles.textArea]} multiline value={formData.notes} onChangeText={(text) => handleInputChange('notes', text)} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#111827', paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  backButton: { padding: 5 },
  saveButton: { padding: 5 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { padding: 15 },
  formSection: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41 },
  label: { fontSize: 14, color: '#4b5563', marginBottom: 5, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 10, backgroundColor: '#fff' },
  picker: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, marginBottom: 10, backgroundColor: '#fff' },
  textArea: { height: 80, textAlignVertical: 'top' },
});