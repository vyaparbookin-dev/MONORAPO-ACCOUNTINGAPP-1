import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { getData } from '../../services/ApiService';

const SchemeApplyModel = ({ visible, onClose, onApply }) => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) loadSchemes();
  }, [visible]);

  const loadSchemes = async () => {
    setLoading(true);
    try {
      const res = await getData('/schemes/active');
      setSchemes(res.data?.schemes || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Apply Scheme</Text>
          
          {loading ? <ActivityIndicator color="#007bff" /> : (
            <FlatList
              data={schemes}
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.item} onPress={() => { onApply(item); onClose(); }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.desc}>{item.description}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.empty}>No active schemes</Text>}
            />
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modal: { 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    padding: 20, 
    maxHeight: '80%',
    ...Platform.select({
      ios: {     },
      android: { ...Platform.select({
      ios: {     },
      android: { elevation: 5 },
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.2)' }
    }), },
      web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.25)' }
    })
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  item: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#007bff' },
  desc: { fontSize: 12, color: '#666' },
  closeBtn: { marginTop: 15, padding: 10, alignItems: 'center' },
  closeText: { color: 'red', fontWeight: 'bold' },
  empty: { textAlign: 'center', padding: 20, color: '#888' }
});

export default SchemeApplyModel