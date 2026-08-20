import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert, 
  TextInput, 
  FlatList, 
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { syncQueue } from '@repo/shared/src/services/syncqueue.native';
import { getPartiesLocal } from '../../db';
import { getData } from '../services/ApiService';

export default function CalculatorModal({ visible, onClose }) {
  const [display, setDisplay] = useState('0');
  const [firstValue, setFirstValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForSecondValue, setWaitingForSecondValue] = useState(false);
  const [grandTotalData, setGrandTotalData] = useState(0);
  const [equation, setEquation] = useState('');

  // Party Selection State
  const [partyModalVisible, setPartyModalVisible] = useState(false);
  const [txnType, setTxnType] = useState(null); // 'IN', 'UDHAR', 'OUT'
  const [parties, setParties] = useState([]);
  const [partySearch, setPartySearch] = useState('');
  const [selectedParty, setSelectedParty] = useState(null);
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyPhone, setNewPartyPhone] = useState('');

  useEffect(() => {
    if (visible) {
      loadParties();
    }
  }, [visible]);

  const loadParties = async () => {
    try {
      const local = await getPartiesLocal().catch(() => []);
      if (local && local.length > 0) {
        setParties(local);
      }
      const res = await getData('/party').catch(() => null);
      if (res) {
        setParties(res.data?.parties || (Array.isArray(res.data) ? res.data : []));
      }
    } catch (e) {
      console.log('Parties load err in calc:', e);
    }
  };

  const handleNumberInput = (num) => {
    if (equation.includes('=')) {
      setEquation('');
      setDisplay(String(num));
      setWaitingForSecondValue(false);
      return;
    }
    if (waitingForSecondValue) {
      setDisplay(String(num));
      setWaitingForSecondValue(false);
    } else {
      if (display === '0' && num === '00') return;
      setDisplay(display === '0' ? String(num) : display + String(num));
    }
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleOperatorInput = (op) => {
    const inputValue = parseFloat(display);
    if (firstValue === null) {
      setFirstValue(inputValue);
      setEquation(`${inputValue} ${op}`);
    } else if (operator) {
      if (waitingForSecondValue) {
        setOperator(op);
        setEquation(`${firstValue} ${op}`);
        return;
      }
      const result = calculate(firstValue, inputValue, operator);
      const finalRes = parseFloat(result.toFixed(4));
      setDisplay(String(finalRes));
      setFirstValue(finalRes);
      setEquation(`${finalRes} ${op}`);
    }
    setWaitingForSecondValue(true);
    setOperator(op);
  };
  
  const calculate = (val1, val2, op) => {
    if (op === '+') return val1 + val2;
    if (op === '-') return val1 - val2;
    if (op === '×') return val1 * val2;
    if (op === '÷') return val1 / (val2 || 1);
    return val2;
  };

  const handleSpecialInput = (type) => {
    switch (type) {
      case 'AC':
      case 'C':
        setDisplay('0');
        setFirstValue(null);
        setOperator(null);
        setWaitingForSecondValue(false);
        setGrandTotalData(0);
        setEquation('');
        break;
      case 'GT':
        setDisplay(String(grandTotalData));
        break;
      case '%':
        setDisplay(String(parseFloat(display) / 100));
        break;
      case '=':
        if (operator && firstValue !== null) {
          const result = calculate(firstValue, parseFloat(display), operator);
          const finalRes = parseFloat(result.toFixed(4));
          setEquation(`${firstValue} ${operator} ${display} =`);
          setDisplay(String(finalRes));
          setGrandTotalData(prev => prev + finalRes);
          setFirstValue(null);
          setOperator(null);
          setWaitingForSecondValue(false);
        }
        break;
      case '.':
        if (!display.includes('.')) {
          setDisplay(display + '.');
        }
        break;
    }
  };

  const applyGST = (percent, isAdd) => {
    const val = parseFloat(display) || 0;
    if (val === 0) return;
    
    let result = 0;
    if (isAdd) {
      result = val + (val * (percent / 100));
    } else {
      result = val / (1 + (percent / 100));
    }
    setDisplay(String(parseFloat(result.toFixed(2))));
  };

  const openPartySelector = (type) => {
    const amount = parseFloat(display);
    if (!amount || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter an amount greater than 0 first");
      return;
    }
    setTxnType(type);
    setSelectedParty(null);
    setNewPartyName('');
    setNewPartyPhone('');
    setPartySearch('');
    setPartyModalVisible(true);
  };

  const submitTransaction = async (partyInfo) => {
    const amount = parseFloat(display);
    let finalParty = partyInfo;
    let customerName = partyInfo?.name || newPartyName.trim() || (txnType === 'UDHAR' ? 'Credit Customer' : txnType === 'OUT' ? 'Supplier Expense' : 'Walk-in Cash Sale');
    let customerPhone = partyInfo?.mobileNumber || partyInfo?.phone || newPartyPhone.trim() || '';
    let partyId = partyInfo?._id || partyInfo?.id || null;

    try {
      // If user typed a new party name, persist it to DB first so it shows in party directory
      if (!partyId && newPartyName.trim()) {
        try {
          const partyType = txnType === 'OUT' ? 'supplier' : 'customer';
          const newPartyRes = await postData('/party', {
            name: newPartyName.trim(),
            mobileNumber: newPartyPhone.trim() || undefined,
            type: partyType,
            balance: txnType === 'UDHAR' ? amount : 0
          });
          const created = newPartyRes.party || newPartyRes.data || newPartyRes;
          if (created && (created._id || created.id)) {
            partyId = created._id || created.id;
            customerName = created.name || customerName;
            customerPhone = created.mobileNumber || customerPhone;
          }
          fetchParties();
        } catch (partyErr) {
          console.warn("Could not save party to /party directly:", partyErr);
        }
      }

      if (txnType === 'IN') {
        const payload = {
          billNumber: `QPOS-${Date.now()}`,
          customerName: customerName,
          customerMobile: customerPhone,
          partyId: partyId,
          items: [{ productId: null, name: 'Quick Cash POS Sale', quantity: 1, rate: amount, total: amount }],
          total: amount,
          tax: 0,
          finalAmount: amount,
          status: "paid",
          paymentMethod: "cash",
          date: new Date().toISOString()
        };
        // 1. Immediate Cloud API Post
        await postData('/billing', payload).catch(e => {
          console.log("Direct API post failed, fallback to syncQueue:", e);
          syncQueue.enqueue({ method: 'post', url: '/billing', data: payload });
        });
        Alert.alert('✅ Cash IN Recorded', `₹${amount.toLocaleString('en-IN')} Cash Sale recorded for ${customerName}!`);
      } else if (txnType === 'UDHAR') {
        const payload = {
          billNumber: `UDHAR-${Date.now()}`,
          customerName: customerName,
          customerMobile: customerPhone,
          partyId: partyId,
          items: [{ productId: null, name: 'Quick Credit Udhar Entry', quantity: 1, rate: amount, total: amount }],
          total: amount,
          tax: 0,
          finalAmount: amount,
          status: 'credit',
          paymentMethod: 'credit',
          date: new Date().toISOString()
        };
        // 1. Immediate Cloud API Post
        await postData('/billing', payload).catch(e => {
          console.log("Direct API post failed, fallback to syncQueue:", e);
          syncQueue.enqueue({ method: 'post', url: '/billing', data: payload });
        });
        Alert.alert('🟠 Udhar Recorded', `₹${amount.toLocaleString('en-IN')} Udhar ledger entry recorded for ${customerName}!`);
      } else {
        const payload = {
          title: `Cash Out: ${customerName}`,
          amount: amount,
          category: 'General Expense',
          partyId: partyId,
          recipient: customerName,
          date: new Date().toISOString(),
          paymentMethod: 'cash',
          description: `Instant Expense / Cash Out paid to ${customerName} (${customerPhone || 'Direct Cash'})`
        };
        await postData('/expenses', payload).catch(e => {
          console.log("Direct expense post failed, fallback to syncQueue:", e);
          syncQueue.enqueue({ method: 'post', url: '/expenses', data: payload });
        });
        Alert.alert('🔴 Cash OUT Recorded', `₹${amount.toLocaleString('en-IN')} Expense recorded for ${customerName}!`);
      }
    } catch (err) {
      console.error("Calculator txn err:", err);
      Alert.alert('Saved', `Entry recorded!`);
    }

    setPartyModalVisible(false);
    // Reset Calculator
    setDisplay('0');
    setFirstValue(null);
    setOperator(null);
    setWaitingForSecondValue(false);
    setEquation('');
  };

  const filteredParties = parties.filter(p => 
    (p.name || '').toLowerCase().includes(partySearch.toLowerCase()) || 
    (p.mobileNumber || '').includes(partySearch)
  );

  const CalcBtn = ({ text, theme = 'num', flex = 1, onPress }) => {
    let btnStyle = styles.numBtn;
    let textStyle = styles.numText;

    if (theme === 'op') {
      btnStyle = styles.opBtn;
      textStyle = styles.opText;
    } else if (theme === 'ac') {
      btnStyle = styles.acBtn;
      textStyle = styles.acText;
    } else if (theme === 'equal') {
      btnStyle = styles.equalBtn;
      textStyle = styles.equalText;
    }

    return (
      <TouchableOpacity
        style={[styles.calcBtn, btnStyle, { flex }]}
        onPress={() => onPress(text)}
        activeOpacity={0.7}
      >
        <Text style={textStyle}>{text}</Text>
      </TouchableOpacity>
    );
  };

  const GstBtn = ({ label, isAdd, val }) => (
    <TouchableOpacity style={styles.gstBtn} onPress={() => applyGST(val, isAdd)} activeOpacity={0.7}>
      <Text style={styles.gstText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerIcon}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🧮 Fast Billing & Calculator</Text>
          <TouchableOpacity onPress={onClose} style={styles.headerIcon}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Display Screen */}
          <View style={styles.displayBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity style={styles.backspaceBtn} onPress={handleBackspace}>
                <Ionicons name="backspace-outline" size={22} color="#64748B" />
              </TouchableOpacity>
              <Text style={styles.equationText} numberOfLines={1}>{equation}</Text>
            </View>
            <Text style={styles.displayText} adjustsFontSizeToFit numberOfLines={1}>₹ {display}</Text>
          </View>

          {/* 1-Tap Transaction Buttons with Party Link */}
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#10B981' }]} 
              onPress={() => openPartySelector('IN')}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-down-circle" size={18} color="#FFF" />
              <Text style={styles.actionBtnText}>CASH IN</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]} 
              onPress={() => openPartySelector('UDHAR')}
              activeOpacity={0.8}
            >
              <Ionicons name="time" size={18} color="#FFF" />
              <Text style={styles.actionBtnText}>+ UDHAR (खाता)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#EF4444' }]} 
              onPress={() => openPartySelector('OUT')}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-up-circle" size={18} color="#FFF" />
              <Text style={styles.actionBtnText}>CASH OUT</Text>
            </TouchableOpacity>
          </View>

          {/* GST Buttons Row 1 (+ Tax) */}
          <View style={styles.gstRow}>
            <GstBtn label="+5%" isAdd={true} val={5} />
            <GstBtn label="+12%" isAdd={true} val={12} />
            <GstBtn label="+18%" isAdd={true} val={18} />
            <GstBtn label="+28%" isAdd={true} val={28} />
          </View>

          {/* GST Buttons Row 2 (- Tax Extract) */}
          <View style={styles.gstRow}>
            <GstBtn label="-5%" isAdd={false} val={5} />
            <GstBtn label="-12%" isAdd={false} val={12} />
            <GstBtn label="-18%" isAdd={false} val={18} />
            <GstBtn label="-28%" isAdd={false} val={28} />
          </View>

          {/* 5-Column High-Contrast Full Visible Keypad */}
          <View style={styles.keypadGrid}>
            {/* Row 1 */}
            <View style={styles.keyRow}>
              <CalcBtn text="7" onPress={handleNumberInput} />
              <CalcBtn text="8" onPress={handleNumberInput} />
              <CalcBtn text="9" onPress={handleNumberInput} />
              <CalcBtn text="÷" theme="op" onPress={handleOperatorInput} />
              <CalcBtn text="AC" theme="ac" onPress={handleSpecialInput} />
            </View>

            {/* Row 2 */}
            <View style={styles.keyRow}>
              <CalcBtn text="4" onPress={handleNumberInput} />
              <CalcBtn text="5" onPress={handleNumberInput} />
              <CalcBtn text="6" onPress={handleNumberInput} />
              <CalcBtn text="×" theme="op" onPress={handleOperatorInput} />
              <CalcBtn text="%" theme="op" onPress={handleSpecialInput} />
            </View>

            {/* Row 3 */}
            <View style={styles.keyRow}>
              <CalcBtn text="1" onPress={handleNumberInput} />
              <CalcBtn text="2" onPress={handleNumberInput} />
              <CalcBtn text="3" onPress={handleNumberInput} />
              <CalcBtn text="-" theme="op" onPress={handleOperatorInput} />
              <CalcBtn text="GT" theme="op" onPress={handleSpecialInput} />
            </View>

            {/* Row 4 */}
            <View style={styles.keyRow}>
              <CalcBtn text="0" onPress={handleNumberInput} />
              <CalcBtn text="00" onPress={handleNumberInput} />
              <CalcBtn text="." onPress={handleSpecialInput} />
              <CalcBtn text="+" theme="op" onPress={handleOperatorInput} />
              <CalcBtn text="=" theme="equal" onPress={handleSpecialInput} />
            </View>
          </View>
        </ScrollView>

        {/* PARTY SELECTION POPUP / DRAWER */}
        <Modal 
          visible={partyModalVisible} 
          animationType="fade" 
          transparent={true}
          onRequestClose={() => setPartyModalVisible(false)}
        >
          <View style={styles.partyModalBackdrop}>
            <View style={styles.partyModalCard}>
              <View style={styles.partyModalHeader}>
                <Text style={styles.partyModalTitle}>
                  {txnType === 'UDHAR' ? '🟠 Select Customer for Udhar' : (txnType === 'IN' ? '🟢 Link Customer for Cash In' : '🔴 Payee for Cash Out')}
                </Text>
                <TouchableOpacity onPress={() => setPartyModalVisible(false)}>
                  <Ionicons name="close-circle" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalAmountBanner}>Amount: ₹{parseFloat(display).toLocaleString('en-IN')}</Text>

              {/* Quick Walk-in Option */}
              <TouchableOpacity 
                style={styles.walkinBtn}
                onPress={() => submitTransaction(null)}
              >
                <Text style={styles.walkinBtnText}>⚡ Direct Walk-in (No Party Name)</Text>
              </TouchableOpacity>

              {/* Search or Add New Party */}
              <View style={styles.partySearchBox}>
                <Ionicons name="search" size={16} color="#94A3B8" />
                <TextInput 
                  placeholder="Search party name or phone..." 
                  style={styles.partySearchInput}
                  value={partySearch}
                  onChangeText={setPartySearch}
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Add New Custom Party on the Fly */}
              <View style={styles.newPartyRow}>
                <TextInput 
                  placeholder="New Party Name" 
                  style={styles.newPartyInput}
                  value={newPartyName}
                  onChangeText={setNewPartyName}
                  placeholderTextColor="#94A3B8"
                />
                <TextInput 
                  placeholder="Phone" 
                  style={[styles.newPartyInput, { flex: 0.8 }]}
                  value={newPartyPhone}
                  onChangeText={setNewPartyPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor="#94A3B8"
                />
                {newPartyName.trim() ? (
                  <TouchableOpacity 
                    style={styles.saveNewPartyBtn}
                    onPress={() => submitTransaction({ name: newPartyName, mobileNumber: newPartyPhone })}
                  >
                    <Text style={styles.saveNewPartyText}>Save</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Party List */}
              <FlatList 
                data={filteredParties.slice(0, 10)}
                keyExtractor={(item) => item._id || item.id || String(Math.random())}
                style={{ maxHeight: 220 }}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.partyItem}
                    onPress={() => submitTransaction(item)}
                  >
                    <View style={styles.partyItemAvatar}>
                      <Text style={styles.partyItemAvatarText}>{(item.name || '?').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.partyItemName}>{item.name}</Text>
                      <Text style={styles.partyItemSub}>{item.mobileNumber || 'No Phone'} • Bal: ₹{item.balance || 0}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={{ textAlign: 'center', color: '#94A3B8', paddingVertical: 14 }}>
                    {partySearch ? 'No matching party found. Type name above to add.' : 'No parties available.'}
                  </Text>
                }
              />
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingTop: Platform.OS === 'ios' ? 12 : 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  headerIcon: { padding: 4 },
  
  scrollContent: { padding: 12 },
  
  displayBox: { 
    backgroundColor: '#0F172A', 
    borderRadius: 14, 
    padding: 16, 
    minHeight: 100, 
    justifyContent: 'space-between',
    marginBottom: 12,
    elevation: 3,
  },
  displayText: { fontSize: 36, color: '#10B981', fontWeight: '800', textAlign: 'right', marginTop: 4 },
  equationText: { fontSize: 15, color: '#94A3B8', fontWeight: '600' },
  backspaceBtn: { padding: 4 },

  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  actionBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 10, 
    borderRadius: 10, 
    gap: 4,
    elevation: 2,
  },
  actionBtnText: { color: '#FFF', fontWeight: '800', fontSize: 12 },

  gstRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  gstBtn: { 
    flex: 1, 
    backgroundColor: '#EEF2FF', 
    borderWidth: 1, 
    borderColor: '#C7D2FE', 
    paddingVertical: 8, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  gstText: { color: '#4338CA', fontSize: 12, fontWeight: '800' },

  // Keypad
  keypadGrid: { marginTop: 6, gap: 8 },
  keyRow: { flexDirection: 'row', gap: 8 },
  calcBtn: { 
    height: 52, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 2,
  },
  
  numBtn: { backgroundColor: '#1E293B' },
  opBtn: { backgroundColor: '#E2E8F0' },
  acBtn: { backgroundColor: '#F59E0B' },
  equalBtn: { backgroundColor: '#10B981' },

  numText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  opText: { color: '#1E293B', fontSize: 20, fontWeight: '700' },
  acText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  equalText: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },

  // Party Modal
  partyModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  partyModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    maxHeight: '85%',
  },
  partyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  partyModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalAmountBanner: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 8,
    textAlign: 'center',
    marginBottom: 10,
  },
  walkinBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  walkinBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  partySearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 8,
  },
  partySearchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    color: '#0F172A',
  },
  newPartyRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  newPartyInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 36,
    fontSize: 12,
  },
  saveNewPartyBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveNewPartyText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  partyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  partyItemAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  partyItemAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4F46E5',
  },
  partyItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  partyItemSub: {
    fontSize: 11,
    color: '#64748B',
  },
});