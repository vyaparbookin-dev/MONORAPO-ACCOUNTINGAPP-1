import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { syncQueue } from '@repo/shared/src/services/syncqueue.native';

export default function CalculatorModal({ visible, onClose }) {
  const [display, setDisplay] = useState('0');
  const [firstValue, setFirstValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForSecondValue, setWaitingForSecondValue] = useState(false);
  const [grandTotalData, setGrandTotalData] = useState(0);
  const [equation, setEquation] = useState('');

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
      if (display === '0' && num === '00') return; // prevent multiple zeros
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
    if (op === '÷') return val1 / val2;
    return val2;
  };

  const handleSpecialInput = (type) => {
    switch (type) {
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
          setGrandTotalData(prev => prev + finalRes); // Add to Grand Total
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
      result = val / (1 + (percent / 100)); // Extracting GST properly
    }
    setDisplay(String(parseFloat(result.toFixed(2))));
  };

  const handleQuickTransaction = (type) => {
    const amount = parseFloat(display);
    if (!amount || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter an amount greater than 0");
      return;
    }

    if (type === 'IN') {
      const payload = {
        billNumber: `QPOS-${Date.now()}`,
        customerName: "Walk-in Cash Sale",
        items: [{ productId: null, name: 'Quick POS Sale', quantity: 1, rate: amount, total: amount }],
        total: amount,
        tax: 0,
        finalAmount: amount,
        status: "paid",
        paymentMethod: "cash",
        date: new Date().toISOString()
      };
      syncQueue.enqueue({ method: 'post', url: '/billing', data: payload });
      Alert.alert('Cash IN', `₹${amount.toFixed(2)} recorded as Sale!`);
    } else {
      const payload = {
        title: 'Quick Cash Out',
        amount: amount,
        category: 'General',
        date: new Date().toISOString(),
        paymentMethod: 'cash',
        description: 'Instant Calculator Expense'
      };
      syncQueue.enqueue({ method: 'post', url: '/expenses', data: payload });
      Alert.alert('Cash OUT', `₹${amount.toFixed(2)} recorded as Expense!`);
    }

    // Reset Calculator
    setDisplay('0');
    setFirstValue(null);
    setOperator(null);
    setWaitingForSecondValue(false);
    setEquation('');
  };

  const CalcBtn = ({ text, theme = 'num', tall, onPress }) => {
    const isNum = theme === 'num';
    const isAc = theme === 'ac';
    return (
      <TouchableOpacity
        style={[
          styles.calcBtn,
          isNum ? styles.numBtn : (isAc ? styles.acBtn : styles.opBtn),
          tall && { flex: 2.15 } 
        ]}
        onPress={() => onPress(text)}
        activeOpacity={0.7}
      >
        <Text style={[isNum ? styles.numText : (isAc ? styles.acText : styles.opText)]}>{text}</Text>
      </TouchableOpacity>
    )
  };

  const GstBtn = ({ label, isAdd, val }) => (
    <TouchableOpacity style={styles.gstBtn} onPress={() => applyGST(val, isAdd)}>
      <Text style={styles.gstText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerIcon}>
            <Ionicons name="arrow-back" size={26} color="#3F3D56" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quick POS & Calculator</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="settings-outline" size={24} color="#3F3D56" />
          </TouchableOpacity>
        </View>

        <View style={styles.displayBox}>
          <TouchableOpacity style={styles.backspaceBtn} onPress={handleBackspace}>
            <Ionicons name="backspace-outline" size={24} color="#A0A0A0" />
          </TouchableOpacity>
          <View style={{ alignItems: 'flex-end', width: '100%' }}>
            <Text style={styles.equationText} numberOfLines={1} adjustsFontSizeToFit>{equation}</Text>
            <Text style={styles.displayText} adjustsFontSizeToFit numberOfLines={1}>{display}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.smallActionBtn} onPress={() => handleSpecialInput('GT')}><Text style={styles.actionText}>GT</Text></TouchableOpacity>
          <TouchableOpacity style={styles.smallActionBtn} onPress={() => Alert.alert('Markup', 'MU Feature Coming Soon')}><Text style={styles.actionText}>MU</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.largeActionBtn, {backgroundColor: '#1ABC9C'}]} onPress={() => handleQuickTransaction('IN')}><Text style={styles.largeActionText}>CASH IN</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.largeActionBtn, {backgroundColor: '#E17055'}]} onPress={() => handleQuickTransaction('OUT')}><Text style={styles.largeActionText}>CASH OUT</Text></TouchableOpacity>
        </View>

        <View style={styles.gstRow}>
          <GstBtn label="+3%" isAdd={true} val={3} />
          <GstBtn label="+5%" isAdd={true} val={5} />
          <GstBtn label="+18%" isAdd={true} val={18} />
          <GstBtn label="+40%" isAdd={true} val={40} />
          <GstBtn label="+GST" isAdd={true} val={0} />
        </View>
        <View style={styles.gstRow}>
          <GstBtn label="-3%" isAdd={false} val={3} />
          <GstBtn label="-5%" isAdd={false} val={5} />
          <GstBtn label="-18%" isAdd={false} val={18} />
          <GstBtn label="-40%" isAdd={false} val={40} />
          <GstBtn label="-GST" isAdd={false} val={0} />
        </View>

        {/* Keypad 5 Column Layout */}
        <View style={styles.keypad}>
          <View style={styles.col}><CalcBtn text="7" onPress={handleNumberInput}/><CalcBtn text="4" onPress={handleNumberInput}/><CalcBtn text="1" onPress={handleNumberInput}/><CalcBtn text="0" onPress={handleNumberInput}/></View>
          <View style={styles.col}><CalcBtn text="8" onPress={handleNumberInput}/><CalcBtn text="5" onPress={handleNumberInput}/><CalcBtn text="2" onPress={handleNumberInput}/><CalcBtn text="00" onPress={handleNumberInput}/></View>
          <View style={styles.col}><CalcBtn text="9" onPress={handleNumberInput}/><CalcBtn text="6" onPress={handleNumberInput}/><CalcBtn text="3" onPress={handleNumberInput}/><CalcBtn text="." onPress={handleSpecialInput}/></View>
          <View style={styles.col}><CalcBtn text="%" theme="op" onPress={handleSpecialInput}/><CalcBtn text="-" theme="op" onPress={handleOperatorInput}/><CalcBtn text="+" theme="op" tall onPress={handleOperatorInput}/></View>
          <View style={styles.col}><CalcBtn text="AC" theme="ac" onPress={handleSpecialInput}/><CalcBtn text="÷" theme="op" onPress={handleOperatorInput}/><CalcBtn text="×" theme="op" onPress={handleOperatorInput}/><CalcBtn text="=" theme="op" onPress={handleSpecialInput}/></View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#3F3D56' },
  headerIcon: { padding: 5 },
  
  displayBox: { backgroundColor: '#FFF', margin: 16, borderRadius: 16, padding: 20, alignItems: 'flex-end', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, minHeight: 130, justifyContent: 'space-between' },
  displayText: { fontSize: 54, color: '#3F3D56', fontWeight: '300', marginTop: 5 },
  equationText: { fontSize: 22, color: '#A0A0A0', minHeight: 28 },
  backspaceBtn: { alignSelf: 'flex-start', paddingBottom: 10 },

  actionRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  smallActionBtn: { flex: 1, backgroundColor: '#E2E8F0', paddingVertical: 12, borderRadius: 12, alignItems: 'center', elevation: 1 },
  largeActionBtn: { flex: 2, paddingVertical: 12, borderRadius: 12, alignItems: 'center', elevation: 2 },
  actionText: { color: '#3F3D56', fontWeight: 'bold', fontSize: 13 },
  largeActionText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  gstRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  gstBtn: { flex: 1, backgroundColor: '#E2E8F0', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  gstText: { color: '#3F3D56', fontSize: 13, fontWeight: '600' },

  keypad: { flexDirection: 'row', flex: 1, padding: 12, gap: 12, paddingBottom: 30 },
  col: { flex: 1, gap: 12 },
  calcBtn: { flex: 1, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
  
  numBtn: { backgroundColor: '#3F3D56' },
  opBtn: { backgroundColor: '#E2E8F0' },
  acBtn: { backgroundColor: '#F39C12' },

  numText: { color: '#FFF', fontSize: 24, fontWeight: '500' },
  opText: { color: '#3F3D56', fontSize: 26, fontWeight: '500' },
  acText: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
});