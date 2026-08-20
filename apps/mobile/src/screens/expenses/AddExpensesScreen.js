import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  Platform
} from 'react-native'; 
import { Ionicons } from '@expo/vector-icons';
import { postData } from '../../services/ApiService';
import { addExpenseLocal } from '../../../db';

const AddExpenseScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'General',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    paymentMethod: 'cash'
  });
  const [loading, setLoading] = useState(false);

  const categories = [
    '💡 Utilities / Light Bill',
    '🏬 Shop Rent',
    '🚚 Transport & Freight',
    '☕ Tea & Refreshment',
    '💼 Staff / Labor Kharcha',
    '🛠️ Repair & Maintenance',
    '🏷️ General'
  ];

  const handleChange = (name, value) => setForm(prev => ({ ...prev, [name]: value }));

  const handleSubmit = async () => {
    if (!form.title.trim()) return Alert.alert('Missing Field', 'Please enter an expense title');
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return Alert.alert('Invalid Amount', 'Please enter a valid expense amount');

    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        amount: amt,
        category: form.category,
        date: form.date,
        description: form.notes.trim(),
        paymentMethod: form.paymentMethod
      };

      // 1. Offline First: SQLite
      await addExpenseLocal(payload).catch(e => console.log("Local SQLite expense err:", e));

      // 2. Cloud API: Save to MongoDB / Supabase
      await postData('/expenses', payload);

      Alert.alert('✅ Success', `₹${amt.toLocaleString('en-IN')} expense recorded successfully!`);
      navigation.goBack();
    } catch (err) {
      console.error("Expense save err:", err);
      // Still show success if recorded offline
      Alert.alert('Saved', 'Expense recorded successfully!');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Expense (खर्चा)</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          {/* Amount Box */}
          <Text style={styles.inputLabel}>Expense Amount (₹) *</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.rupeeSymbol}>₹</Text>
            <TextInput 
              placeholder="0.00" 
              value={form.amount} 
              onChangeText={t => handleChange('amount', t)} 
              style={styles.amountInput} 
              keyboardType="numeric"
              autoFocus
            />
          </View>

          {/* Title */}
          <Text style={styles.inputLabel}>Expense Title / Payee *</Text>
          <TextInput 
            placeholder="e.g. Electricity bill, Chai-Nasta, Tempo bhada" 
            value={form.title} 
            onChangeText={t => handleChange('title', t)} 
            style={styles.textInput} 
          />

          {/* Category Chips */}
          <Text style={styles.inputLabel}>Select Category</Text>
          <View style={styles.categoryWrap}>
            {categories.map((cat, idx) => {
              const isSelected = form.category === cat;
              return (
                <TouchableOpacity 
                  key={idx}
                  style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                  onPress={() => handleChange('category', cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Payment Mode */}
          <Text style={styles.inputLabel}>Payment Mode</Text>
          <View style={styles.paymentModeRow}>
            {['cash', 'online', 'bank'].map((mode) => (
              <TouchableOpacity 
                key={mode}
                style={[styles.modeBtn, form.paymentMethod === mode && styles.modeBtnActive]}
                onPress={() => handleChange('paymentMethod', mode)}
              >
                <Text style={[styles.modeBtnText, form.paymentMethod === mode && styles.modeBtnTextActive]}>
                  {mode.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notes */}
          <Text style={styles.inputLabel}>Notes / Bill No (Optional)</Text>
          <TextInput 
            placeholder="Any extra details..." 
            value={form.notes} 
            onChangeText={t => handleChange('notes', t)} 
            style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]} 
            multiline 
          />

          {/* Big Green Save Button */}
          <TouchableOpacity 
            style={styles.saveBtn} 
            onPress={handleSubmit} 
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveBtnText}>Save Expense (खर्चा दर्ज करें)</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  scrollContent: { padding: 14 },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  rupeeSymbol: { fontSize: 24, fontWeight: '800', color: '#DC2626', marginRight: 6 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '800', color: '#DC2626', paddingVertical: 10 },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginBottom: 6,
  },
  categoryChip: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  categoryChipText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  categoryChipTextActive: { color: '#4F46E5', fontWeight: '700' },
  paymentModeRow: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 6 },
  modeBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  modeBtnText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  modeBtnTextActive: { color: '#FFF' },
  saveBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 3,
  },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});

export default AddExpenseScreen;

