import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getData, postData } from '../../services/ApiService';
import { useOfflineMode } from '../../hooks/useOfflineMode';
import UdharReminder from '../../components/UdharReminder';
import { syncQueue } from '@repo/shared/src/services/syncqueue.native';

const ConsolidateUdharScreen = ({ navigation }) => {
  const { isOffline } = useOfflineMode();
  
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState('');
  const [udharBills, setUdharBills] = useState([]);
  const [selectedBills, setSelectedBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [consolidating, setConsolidating] = useState(false);

  useEffect(() => {
    fetchParties();
  }, []);

  useEffect(() => {
    if (selectedParty) {
      fetchUdharBills(selectedParty);
    } else {
      setUdharBills([]);
      setSelectedBills([]);
    }
  }, [selectedParty]);

  const fetchParties = async () => {
    setLoading(true);
    try {
      const response = await getData('/party'); 
      setParties(response.data?.parties || response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch parties.');
      console.error('Error fetching parties:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUdharBills = async (partyId) => {
    setLoading(true);
    try {
      const response = await getData(`/consolidated-statement/party/${partyId}/udhar`);
      setUdharBills(response.data?.bills || []);
      setSelectedBills([]); // Clear selection when party changes
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch outstanding bills.');
      console.error('Error fetching udhar bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBillSelection = (billId) => {
    setSelectedBills(prev =>
      prev.includes(billId)
        ? prev.filter(id => id !== billId)
        : [...prev, billId]
    );
  };

  const handleConsolidate = async () => {
    if (selectedBills.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one bill to consolidate.');
      return;
    }

    setConsolidating(true);
    try {
      const payload = {
        partyId: selectedParty,
        billIds: selectedBills,
      };

      syncQueue.enqueue({
        method: 'post',
        url: '/consolidated-statement',
        data: payload
      });
      Alert.alert('Success', 'Bills consolidated successfully! (Saved to queue)');
      navigation.goBack(); // Or navigate to the new consolidated statement
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to consolidate bills.');
      console.error('Error consolidating bills:', error);
    } finally {
      setConsolidating(false);
    }
  };

  const renderBillItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.billItem, selectedBills.includes(item._id) && styles.selectedBillItem]}
      onPress={() => toggleBillSelection(item._id)}
      onLongPress={() => item.billImageUrl && Alert.alert("Bill Image", "View image?", [{ text: "Cancel" }, { text: "View", onPress: () => Alert.alert("Image URL", item.billImageUrl) }])}
    >
      <View style={styles.billDetails}>
        <Text style={styles.billNumber}>Bill No: {item.billNumber}</Text>
        <Text style={styles.billDate}>Date: {new Date(item.date).toLocaleDateString()}</Text>
        <Text style={styles.billAmount}>Amount: ₹{item.finalAmount || item.total}</Text>
        {item.billImageUrl && (
          <TouchableOpacity onPress={() => Alert.alert("Image URL", item.billImageUrl)}>
            <Image
              source={{ uri: item.billImageUrl }}
              style={styles.billImagePreview}
            />
            <Text style={styles.viewImageText}>View Image</Text>
          </TouchableOpacity>
        )}
      </View>
      {selectedBills.includes(item._id) && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.selectedIndicatorText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Consolidate Outstanding Bills</Text>

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Select Customer:</Text>
        <Picker
          selectedValue={selectedParty}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedParty(itemValue)}
        >
          <Picker.Item label="-- Select Customer --" value="" />
          {parties.map(p => (
            <Picker.Item key={p._id} label={p.name} value={p._id} />
          ))}
        </Picker>
      </View>

      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      {selectedParty && !loading && (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10 }}>
            <Text style={[styles.subHeader, { marginTop: 0, marginBottom: 0 }]}>Outstanding Bills for {parties.find(p => p._id === selectedParty)?.name}</Text>
            <UdharReminder 
              partyName={parties.find(p => p._id === selectedParty)?.name}
              mobileNumber={parties.find(p => p._id === selectedParty)?.mobileNumber || parties.find(p => p._id === selectedParty)?.phone}
              pendingAmount={udharBills.reduce((sum, b) => sum + (b.finalAmount || b.total), 0)}
            />
          </View>
          <FlatList
            data={udharBills}
            keyExtractor={(item) => item._id}
            renderItem={renderBillItem}
            ListEmptyComponent={<Text style={styles.emptyListText}>No outstanding bills found for this customer.</Text>}
            style={styles.billList}
          />

          <TouchableOpacity
            style={[styles.consolidateButton, selectedBills.length === 0 && styles.disabledButton]}
            onPress={handleConsolidate}
            disabled={selectedBills.length === 0 || consolidating}
          >
            {consolidating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.consolidateButtonText}>Consolidate {selectedBills.length} Bill(s)</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#555',
  },
  pickerContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    ...Platform.select({
      ios: {
        
        
        
        
      },
      android: { ...Platform.select({
      ios: {     },
      android: { elevation: 2 },
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.2)' }
    }), },
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.2)' }
    }),
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#333',
  },
  billList: {
    flex: 1,
    marginBottom: 20,
  },
  billItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedBillItem: {
    borderColor: '#007bff',
    backgroundColor: '#e6f2ff',
  },
  billDetails: {
    flex: 1,
  },
  billNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  billDate: {
    fontSize: 14,
    color: '#666',
  },
  billAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    marginTop: 5,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#777',
  },
  consolidateButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  consolidateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#a8d7b3',
  },
  billImagePreview: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  viewImageText: {
    fontSize: 12,
    color: '#007bff',
    marginTop: 5,
  }
});

export default ConsolidateUdharScreen;