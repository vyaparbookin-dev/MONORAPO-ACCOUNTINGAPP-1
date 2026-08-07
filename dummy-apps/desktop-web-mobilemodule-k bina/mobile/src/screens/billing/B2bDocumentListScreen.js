import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { getData, postData } from '../../services/ApiService';
import { Ionicons } from '@expo/vector-icons';
import { syncQueue } from '@repo/shared/src/services/syncqueue.native';

const B2bDocumentListScreen = ({ navigation }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDocuments();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await getData('/b2b');
      setDocuments(res.data?.data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = (id) => {
    Alert.alert('Convert to Bill', 'Are you sure you want to convert this to a final invoice?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes, Convert', onPress: async () => {
          try {
            syncQueue.enqueue({ method: 'post', url: `/b2b/${id}/convert`, data: {} });
            Alert.alert('Success', 'Successfully converted to Final Invoice!');
            fetchDocuments();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to convert document');
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>B2B Documents</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('CreateB2bDocument')}>
          <Text style={styles.createBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={documents}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 15 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>No documents found.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.docNumber}>{item.documentNumber}</Text>
                <Text style={styles.typeText}>{item.type.replace('_', ' ').toUpperCase()}</Text>
                <Text style={styles.partyText}>{item.partyId?.name || "Unknown"}  |  ₹{item.finalAmount}</Text>
              </View>
              <View style={{ justifyContent: 'center' }}>
                {item.status === 'converted' ? (
                  <Text style={styles.convertedText}>✓ Converted</Text>
                ) : (
                  <TouchableOpacity style={styles.convertBtn} onPress={() => handleConvert(item._id)}>
                    <Text style={styles.convertBtnText}>Convert to Bill</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', alignItems: 'center', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  createBtn: { backgroundColor: '#2563eb', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  createBtnText: { color: '#fff', fontWeight: 'bold' },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1 },
  docNumber: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  typeText: { fontSize: 12, color: '#2563eb', fontWeight: 'bold', marginVertical: 2 },
  partyText: { fontSize: 14, color: '#4b5563' },
  convertBtn: { backgroundColor: '#16a34a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  convertBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  convertedText: { color: '#16a34a', fontWeight: 'bold', fontSize: 13, fontStyle: 'italic' }
});

export default B2bDocumentListScreen;