import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator, Platform, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { getData, postData } from '../../services/ApiService';
const { putData } = require('../../services/ApiService'); // Assumes putData exists for updating
import { getPartiesLocal, getProductsLocal, addBillLocal, updateProductLocal, updateCustomerLocal, addTransactionLocal } from '../../../db'; // Offline DB
import { syncQueue } from '@repo/shared/src/services/syncqueue.native';

const CreateBillScreen = ({ navigation }) => {
  const [parties, setParties] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null); 
  const [inventory, setInventory] = useState([]);
  
  const [selectedParty, setSelectedParty] = useState('');
  const [billItems, setBillItems] = useState([]);
  
  const [currentItem, setCurrentItem] = useState({
    productId: '',
    name: '',
    price: '',
    quantity: '1',
    unit: 'pcs'
  });
  const [amountPaid, setAmountPaid] = useState('');
  
  // NEW: Additional Charges & Agent
  const [extraCharges, setExtraCharges] = useState({ tax: '', discount: '', freight: '', pnf: '', labor: '' });
  const [agentInfo, setAgentInfo] = useState({ name: '', commission: '' });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const hasPermission = permission?.granted;
  
  // Smart Barcode Unfound States
  const [unfoundBarcode, setUnfoundBarcode] = useState(null);
  const [showUnfoundModal, setShowUnfoundModal] = useState(false);
  const [unfoundAction, setUnfoundAction] = useState('link'); // 'link' or 'create'
  const [unfoundSearchQuery, setUnfoundSearchQuery] = useState('');
  const [unfoundFilteredInventory, setUnfoundFilteredInventory] = useState([]);
  const [unfoundSelectedProduct, setUnfoundSelectedProduct] = useState(null);
  const [newProdData, setNewProdData] = useState({ name: '', price: '', unit: 'pcs' });
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [unitsList, setUnitsList] = useState(["pcs", "kg", "ltr", "box", "dz"]);

  // Ek hi baar mein dono list (Parties + Inventory) fetch karenge
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // 1. Offline First: Fetch from SQLite DB
      const localParties = await getPartiesLocal();
      const localProducts = await getProductsLocal();
      
      setParties(localParties || []);
      setInventory(localProducts || []);

      // Fetch company for licensing check
      try {
        const compRes = await getData('/company');
        if (compRes.data?.companies?.length > 0) {
          setSelectedCompany(compRes.data.companies[0]);
        }
      } catch (err) { console.log('Offline: Could not fetch company limits'); }

    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Failed to load parties or inventory.");
    } finally {
      setFetching(false);
    }
  };

  const handleAddItem = () => {
    if (!currentItem.name || parseFloat(currentItem.quantity) <= 0 || !currentItem.price) {
      Alert.alert('Error', 'Please enter product name, price, and valid quantity.');
      return;
    }

    const currentUnit = (currentItem.unit || "pcs").toLowerCase();
    
    // Tally wala Auto-Save logic
    if (!unitsList.includes(currentUnit)) {
       postData("/unit", { name: currentUnit, shortCode: currentUnit.substring(0, 3).toUpperCase() })
         .catch(err => console.error("Could not auto-save unit", err));
       setUnitsList(prev => [...prev, currentUnit]);
    }

    const qty = parseFloat(currentItem.quantity);
    const price = parseFloat(currentItem.price || 0);
    const total = qty * price;

    setBillItems([...billItems, {
      productId: currentItem.productId || 'custom',
      name: currentItem.name,
      quantity: qty,
      unit: currentUnit,
      price: price,
      total: total
    }]);

    // Agla item add karne ke liye fields clear karein
    setCurrentItem({ productId: '', name: '', price: '', quantity: '1', unit: 'pcs' });
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleBarCodeScanned = ({ type, data }) => {
    setShowScanner(false);
    const product = inventory.find(p => p.barcode === data || p.sku === data || p.uuid === data || p._id === data);
    if (product) {
      setCurrentItem({
        productId: product.uuid || product._id,
        name: product.name,
        price: String(product.sellingPrice || product.price || 0),
        quantity: '1',
        unit: product.unit || 'pcs'
      });
      setSearchQuery(product.name);
    } else {
      // Naya system: Agar barcode nahi mila to smart modal kholo
      setUnfoundBarcode(data);
      setUnfoundAction('link');
      setUnfoundSearchQuery('');
      setUnfoundSelectedProduct(null);
      setNewProdData({ name: '', price: '', unit: 'pcs' });
      setShowUnfoundModal(true);
    }
  };

  const handleLinkProduct = async () => {
    if (!unfoundSelectedProduct) return Alert.alert('Required', 'Please select an existing product from the list.');
    setIsSavingProduct(true);
    try {
      // API request to update existing product with this new barcode
      const payload = { barcode: unfoundBarcode };
      const updateMethod = putData || postData; // Fallback to postData if putData not destructured correctly
      
      // Update local inventory list
      setInventory(prev => prev.map(p => (p.uuid || p._id) === (unfoundSelectedProduct.uuid || unfoundSelectedProduct._id) ? { ...p, barcode: unfoundBarcode } : p));
      
      // Set to current bill item
      setCurrentItem({
        productId: unfoundSelectedProduct.uuid || unfoundSelectedProduct._id,
        name: unfoundSelectedProduct.name,
        price: String(unfoundSelectedProduct.sellingPrice || unfoundSelectedProduct.price || 0),
        quantity: '1',
        unit: unfoundSelectedProduct.unit || 'pcs'
      });
      setSearchQuery(unfoundSelectedProduct.name);
      setShowUnfoundModal(false);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to link barcode to product.');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProdData.name || !newProdData.price) return Alert.alert('Required', 'Product Name and Price are required.');
    setIsSavingProduct(true);
    try {
      const payload = {
        name: newProdData.name,
        sellingPrice: parseFloat(newProdData.price),
        costPrice: 0,
        category: 'General',
        hsnCode: '0000',
        unit: newProdData.unit || 'pcs',
        barcode: unfoundBarcode,
        currentStock: 0
      };
      const res = await postData('/inventory', payload);
      const createdProd = res.data.product || res.data;
      
      setInventory(prev => [...prev, createdProd]);
      setCurrentItem({ productId: createdProd.uuid || createdProd._id, name: createdProd.name, price: String(createdProd.sellingPrice || 0), quantity: '1', unit: createdProd.unit || 'pcs' });
      setSearchQuery(createdProd.name);
      setShowUnfoundModal(false);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create new product.');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleRemoveItem = (index) => {
    const newItems = [...billItems];
    newItems.splice(index, 1);
    setBillItems(newItems);
  };

  const calculateGrandTotal = () => {
    const subTotal = billItems.reduce((acc, item) => acc + item.total, 0);
    const tax = parseFloat(extraCharges.tax) || 0;
    const discount = parseFloat(extraCharges.discount) || 0;
    const freight = parseFloat(extraCharges.freight) || 0;
    const pnf = parseFloat(extraCharges.pnf) || 0;
    const labor = parseFloat(extraCharges.labor) || 0;
    return subTotal + tax - discount + freight + pnf + labor;
  };

  const handleSaveBill = async () => {
    if (!selectedParty) {
      return Alert.alert('Validation', 'Please select a Customer for the bill.');
    }
    if (billItems.length === 0) {
      return Alert.alert('Validation', 'Please add at least one item.');
    }

    const finalAmount = calculateGrandTotal();
    const paidAmt = parseFloat(amountPaid) || 0;
    const pendingAmount = finalAmount - paidAmt;

    // --- CREDIT LIMIT & BLOCKING CHECK ---
    // --- LICENSING CHECK ---
    if (selectedCompany && selectedCompany.plan === 'free' && selectedCompany.freeBillCount >= selectedCompany.maxFreeBills) {
      Alert.alert(
        "Free Limit Exceeded",
        `You have reached your free bill limit of ${selectedCompany.maxFreeBills} bills. Please upgrade to Premium to create more bills.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Upgrade Now", onPress: () => navigation.navigate('Settings', { screen: 'AppSettings' }) } // Navigate to AppSettingsScreen
        ]
      );
      return; // Prevent bill creation
    }
    const party = parties.find(p => p._id === selectedParty || p.uuid === selectedParty);
    if (party && party.creditLimit && party.creditLimit > 0) {
      const currentBal = party.currentBalance ?? party.balance ?? 0;
      if (currentBal + pendingAmount > party.creditLimit) {
        Alert.alert('⚠️ CREDIT LIMIT EXCEEDED!', `Customer's credit limit is ₹${party.creditLimit}.\nCurrent Udhar + This Bill = ₹${currentBal + pendingAmount}.\n\nPlease collect cash or ask owner for approval.`);
        return; // Block bill creation
      }
    }

    setLoading(true);
    try {
      const newId = `INV-${Date.now()}`;
      const payload = {
        _id: newId,
        uuid: newId,
        partyId: selectedParty,
        customerName: party?.name || 'Cash Customer',
        billNumber: newId,
        items: billItems,
        total: billItems.reduce((acc, item) => acc + item.total, 0),
        tax: parseFloat(extraCharges.tax) || 0,
        discount: parseFloat(extraCharges.discount) || 0,
        freightCharges: parseFloat(extraCharges.freight) || 0,
        packingForwardingCharges: parseFloat(extraCharges.pnf) || 0,
        laborCharges: parseFloat(extraCharges.labor) || 0,
        agentName: agentInfo.name,
        agentCommission: parseFloat(agentInfo.commission) || 0,
        finalAmount: finalAmount,
        totalAmount: finalAmount,
        amountPaid: paidAmt,
        paymentMethod: paidAmt >= finalAmount ? 'cash' : 'credit',
        date: new Date().toISOString(),
        status: paidAmt >= finalAmount ? 'paid' : 'issued'
      };

      // --- 1. LOCAL OFFLINE SAVE & STOCK UPDATE ---
      try {
        if (typeof addBillLocal === 'function') await addBillLocal(payload, billItems);

        // Local Stock Deduction
        for (const item of billItems) {
          const product = inventory.find(p => p._id === item.productId || p.uuid === item.productId);
          if (product && typeof updateProductLocal === 'function') {
            await updateProductLocal(product._id || product.uuid, { ...product, currentStock: (parseFloat(product.currentStock) || 0) - item.quantity });
          }
        }

        // Local Customer Ledger Update (Accounts Receivable)
        if (party && typeof updateCustomerLocal === 'function') {
          const newBalance = (parseFloat(party.balance || party.currentBalance || 0)) + pendingAmount;
          await updateCustomerLocal(party._id || party.uuid, { ...party, balance: newBalance, currentBalance: newBalance });

          if (pendingAmount > 0 && typeof addTransactionLocal === 'function') {
            await addTransactionLocal({
              uuid: `TX-INV-${Date.now()}`, partyId: party._id || party.uuid, type: 'bill',
              debit: pendingAmount, credit: 0, date: payload.date, details: `Invoice #${payload.billNumber}`, status: 'completed'
            });
          }
          if (paidAmt > 0 && typeof addTransactionLocal === 'function') {
            await addTransactionLocal({
              uuid: `TX-PAY-${Date.now()}`, partyId: party._id || party.uuid, type: 'payment_received',
              debit: 0, credit: paidAmt, date: payload.date, details: `Cash Received for #${payload.billNumber}`, status: 'completed'
            });
          }
        }
      } catch (localErr) {
        console.log("Local save skipped or failed", localErr);
      }

      // --- 2. CLOUD SYNC QUEUE ---
      syncQueue.enqueue({
        method: 'post',
        url: '/billing',
        data: payload
      });

      Alert.alert('Success', 'Bill created & offline stock updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error("Save Bill Error:", error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create bill.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 50 }} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>New Invoice</Text>
        <Text style={styles.headerSubtitle}>Fast POS & Billing</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 15, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
      {/* Customer Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Select Customer *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedParty}
            onValueChange={(val) => setSelectedParty(val)}
            style={styles.picker}
          >
            <Picker.Item label="-- Choose Customer --" value="" color="#888" />
            {parties.map((p) => (
              <Picker.Item key={p.uuid || p._id} label={p.name} value={p.uuid || p._id} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Add Item Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.label}>Add Product</Text>
          <TouchableOpacity style={styles.scanButton} onPress={async () => {
            if (hasPermission) {
              setShowScanner(true);
            } else {
              const res = await requestPermission();
              if (res.granted) setShowScanner(true);
              else Alert.alert("Permission", "Camera permission is required");
            }
          }}>
            <Ionicons name="barcode-outline" size={18} color="#fff" />
            <Text style={styles.scanButtonText}> Scan</Text>
          </TouchableOpacity>
        </View>
        
        {/* Smart Search Bar / Custom Item Input */}
        <View style={{ zIndex: 10, marginBottom: 10 }}>
          <TextInput
            style={styles.searchInput}
            placeholder="Type Product Name to Search or Add Custom..."
            value={currentItem.name}
            onChangeText={(text) => {
              setCurrentItem({ ...currentItem, name: text, productId: '' });
              if (text.length > 0) {
                setFilteredInventory(inventory.filter(p => p.name.toLowerCase().includes(text.toLowerCase())));
                setShowSuggestions(true);
              } else {
                setShowSuggestions(false);
              }
            }}
            onFocus={() => { if (currentItem.name.length > 0) setShowSuggestions(true); }}
          />
          {showSuggestions && filteredInventory.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={filteredInventory}
              keyExtractor={(item) => item.uuid || item._id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.suggestionItem} onPress={() => {
                  setCurrentItem({ productId: item.uuid || item._id, name: item.name, price: String(item.sellingPrice || item.price || 0), quantity: '1', unit: item.unit || 'pcs' });
                    setShowSuggestions(false);
                  }}>
                    <Text style={styles.suggestionText}>{item.name} - ₹{item.sellingPrice || item.price || 0}</Text>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 150 }}
              />
            </View>
          )}
        </View>

        <View style={styles.addItemRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 5, paddingHorizontal: 5 }]}
            placeholder="Qty"
            keyboardType="numeric"
            value={currentItem.quantity}
            onChangeText={(txt) => setCurrentItem({ ...currentItem, quantity: txt })}
          />
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 5, paddingHorizontal: 5 }]}
            placeholder="Unit"
            value={currentItem.unit}
            onChangeText={(txt) => setCurrentItem({ ...currentItem, unit: txt })}
          />
          <TextInput
            style={[styles.input, { flex: 1.5, marginRight: 5, paddingHorizontal: 5 }]}
            placeholder="Price"
            keyboardType="numeric"
            value={currentItem.price}
            onChangeText={(txt) => setCurrentItem({ ...currentItem, price: txt })}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Added Items List */}
      <View style={{ marginTop: 10 }}>
        {billItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cart-outline" size={40} color="#cbd5e1" />
            <Text style={styles.emptyText}>Cart is empty. Add products above.</Text>
          </View>
        ) : (
          billItems.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemIconBg}><Ionicons name="cube" size={20} color="#4338ca" /></View>
              <View style={{ flex: 1, paddingHorizontal: 12 }}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemDetail}>{item.quantity} {item.unit} × ₹{item.price}</Text>
              </View>
              <Text style={styles.itemTotal}>₹{item.total.toFixed(2)}</Text>
              <TouchableOpacity onPress={() => handleRemoveItem(index)} style={styles.deleteBtn}>
                <Ionicons name="trash" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
      
      {/* Extra Charges Section */}
      <View style={[styles.section, { backgroundColor: '#fff', padding: 15, borderRadius: 16, marginTop: 10 }]}>
        <Text style={styles.label}>Additional Charges & Discounts</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <TextInput style={[styles.input, {flex: 1}]} placeholder="Tax / GST (₹)" keyboardType="numeric" value={extraCharges.tax} onChangeText={t => setExtraCharges({...extraCharges, tax: t})} />
          <TextInput style={[styles.input, {flex: 1, color: 'red'}]} placeholder="Discount (₹)" keyboardType="numeric" value={extraCharges.discount} onChangeText={t => setExtraCharges({...extraCharges, discount: t})} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput style={[styles.input, {flex: 1}]} placeholder="Freight (₹)" keyboardType="numeric" value={extraCharges.freight} onChangeText={t => setExtraCharges({...extraCharges, freight: t})} />
          <TextInput style={[styles.input, {flex: 1}]} placeholder="P&F Charge (₹)" keyboardType="numeric" value={extraCharges.pnf} onChangeText={t => setExtraCharges({...extraCharges, pnf: t})} />
          <TextInput style={[styles.input, {flex: 1}]} placeholder="Labor (₹)" keyboardType="numeric" value={extraCharges.labor} onChangeText={t => setExtraCharges({...extraCharges, labor: t})} />
        </View>
      </View>

      {/* Broker / Agent Details */}
      <View style={[styles.section, { backgroundColor: '#fff7ed', padding: 15, borderRadius: 16, marginTop: 10, borderColor: '#ffedd5', borderWidth: 1 }]}>
        <Text style={[styles.label, { color: '#c2410c' }]}>Broker / Agent / Painter Details</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput style={[styles.input, {flex: 2, backgroundColor: '#fff', borderColor: '#fdba74'}]} placeholder="Agent Name" value={agentInfo.name} onChangeText={t => setAgentInfo({...agentInfo, name: t})} />
          <TextInput style={[styles.input, {flex: 1, backgroundColor: '#fff', borderColor: '#fdba74'}]} placeholder="Comm. ₹" keyboardType="numeric" value={agentInfo.commission} onChangeText={t => setAgentInfo({...agentInfo, commission: t})} />
        </View>
      </View>
      </ScrollView>

      {/* Footer Area */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Payable</Text>
          <Text style={styles.totalAmount}>₹{calculateGrandTotal().toLocaleString()}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
          <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#4b5563' }}>Cash Received:</Text>
          <TextInput 
            style={[styles.input, { flex: 1, marginBottom: 0, height: 45, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534', fontWeight: 'bold' }]} 
            placeholder="₹ 0" 
            placeholderTextColor="#86efac"
            keyboardType="numeric" 
            value={String(amountPaid)} 
            onChangeText={setAmountPaid} 
          />
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBill} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Save & Generate Bill</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Barcode Scanner Modal */}
      <Modal visible={showScanner} animationType="slide" transparent={false} onRequestClose={() => setShowScanner(false)}>
        <View style={styles.scannerContainer}>
          <CameraView
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "upc_a", "upc_e", "pdf417"],
            }}
            onBarcodeScanned={showScanner ? handleBarCodeScanned : undefined}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.scannerOverlay}>
            <Text style={styles.scannerText}>Scan Product Barcode</Text>
            <TouchableOpacity style={styles.closeScannerBtn} onPress={() => setShowScanner(false)}>
              <Text style={styles.closeScannerText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Smart Unfound Barcode Modal */}
      <Modal visible={showUnfoundModal} animationType="fade" transparent={true} onRequestClose={() => setShowUnfoundModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Barcode Not Found!</Text>
            <Text style={styles.modalSubtitle}>Barcode: {unfoundBarcode}</Text>

            <View style={styles.tabContainer}>
              <TouchableOpacity style={[styles.tabBtn, unfoundAction === 'link' && styles.activeTab]} onPress={() => setUnfoundAction('link')}>
                <Text style={[styles.tabText, unfoundAction === 'link' && styles.activeTabText]}>Link Existing</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabBtn, unfoundAction === 'create' && styles.activeTab]} onPress={() => setUnfoundAction('create')}>
                <Text style={[styles.tabText, unfoundAction === 'create' && styles.activeTabText]}>Create New</Text>
              </TouchableOpacity>
            </View>

            {unfoundAction === 'link' ? (
              <View style={styles.actionContainer}>
                <TextInput style={styles.inputModal} placeholder="Search existing product..." value={unfoundSearchQuery} onChangeText={(txt) => {
                    setUnfoundSearchQuery(txt);
                    if (txt.length > 0) setUnfoundFilteredInventory(inventory.filter(p => p.name.toLowerCase().includes(txt.toLowerCase())));
                    else setUnfoundFilteredInventory([]);
                  }} />
                {unfoundFilteredInventory.length > 0 && (
                  <View style={styles.suggestionsListModal}>
                    <FlatList data={unfoundFilteredInventory} keyExtractor={(item) => item._id} keyboardShouldPersistTaps="handled" renderItem={({ item }) => (
                    <TouchableOpacity style={[styles.suggestionItem, (unfoundSelectedProduct?.uuid || unfoundSelectedProduct?._id) === (item.uuid || item._id) && { backgroundColor: '#dbeafe' }]} onPress={() => { setUnfoundSelectedProduct(item); setUnfoundFilteredInventory([]); setUnfoundSearchQuery(item.name); }}>
                          <Text style={styles.suggestionText}>{item.name}</Text>
                        </TouchableOpacity>
                      )} style={{ maxHeight: 150 }} />
                  </View>
                )}
                <TouchableOpacity style={styles.primaryBtn} onPress={handleLinkProduct} disabled={isSavingProduct}>
                  {isSavingProduct ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Link & Add to Bill</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.actionContainer}>
                <TextInput style={styles.inputModal} placeholder="Product Name" value={newProdData.name} onChangeText={t => setNewProdData({...newProdData, name: t})} />
                <TextInput style={styles.inputModal} placeholder="Price (₹)" keyboardType="numeric" value={newProdData.price} onChangeText={t => setNewProdData({...newProdData, price: t})} />
                <TextInput style={styles.inputModal} placeholder="Unit (pcs, kg...)" value={newProdData.unit} onChangeText={t => setNewProdData({...newProdData, unit: t})} />
                <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateProduct} disabled={isSavingProduct}>
                  {isSavingProduct ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save & Add to Bill</Text>}
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowUnfoundModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  headerContainer: { backgroundColor: '#fff', padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6b7280', fontWeight: '500', marginTop: 2 },
  section: { marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  scanButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4338ca', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, shadowColor: '#4338ca', shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 },
  scanButtonText: { color: '#fff', fontSize: 13, fontWeight: 'bold', marginLeft: 4 },
  pickerContainer: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', height: 50, justifyContent: 'center' },
  searchInput: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 15, height: 50, fontSize: 16, color: '#111827' },
  suggestionsContainer: { position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', zIndex: 100, elevation: 5 },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  suggestionText: { fontSize: 16, color: '#374151' },
  picker: { height: 50, width: '100%' },
  input: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 12, height: 50, textAlign: 'center', fontSize: 16, color: '#111827' },
  addItemRow: { flexDirection: 'row', alignItems: 'center' },
  addButton: { backgroundColor: '#4338ca', width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#4338ca', shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },
  addButtonText: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginTop: -2 },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  itemIconBg: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  itemDetail: { fontSize: 13, color: '#6b7280', marginTop: 3, fontWeight: '500' },
  itemTotal: { fontSize: 17, fontWeight: '900', color: '#4338ca' },
  deleteBtn: { padding: 8, marginLeft: 5 },
  emptyCard: { backgroundColor: '#fff', padding: 30, borderRadius: 16, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#e2e8f0' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 10, fontSize: 14, fontWeight: '600' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' },
  totalAmount: { fontSize: 28, fontWeight: '900', color: '#111827' },
  saveBtn: { backgroundColor: '#4338ca', paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#4338ca', shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scannerOverlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 50 },
  scannerText: { color: '#fff', fontSize: 20, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 8 },
  closeScannerBtn: { backgroundColor: '#dc2626', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 8 },
  closeScannerText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 15 },
  tabContainer: { flexDirection: 'row', marginBottom: 15, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#d1d5db' },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#f3f4f6' },
  activeTab: { backgroundColor: '#2563eb' },
  tabText: { fontWeight: '600', color: '#4b5563' },
  activeTabText: { color: '#fff' },
  actionContainer: { marginBottom: 10 },
  inputModal: { backgroundColor: '#f9fafb', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', paddingHorizontal: 15, height: 45, marginBottom: 10 },
  suggestionsListModal: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', marginBottom: 10 },
  primaryBtn: { backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 5 },
  cancelBtnText: { color: '#dc2626', fontWeight: 'bold', fontSize: 16 },
});

export default CreateBillScreen;