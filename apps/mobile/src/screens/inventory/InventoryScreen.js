import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Platform, 
  ActivityIndicator, 
  TextInput, 
  RefreshControl,
  ScrollView 
} from 'react-native';
import { getData } from '../../services/ApiService';
import { Ionicons } from '@expo/vector-icons';
import { getProductsLocal } from '../../../db';

const InventoryScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchInventory();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchInventory = async () => {
    try {
      // 1. Offline First: Local SQLite
      const localProducts = await getProductsLocal().catch(() => []);
      if (localProducts && localProducts.length > 0) {
        setItems(localProducts);
        setLoading(false);
      }

      // 2. Cloud Fetch
      const res = await getData('/inventory').catch(() => null);
      const productList = res?.products || res?.data?.products || (Array.isArray(res) ? res : []);
      if (productList.length > 0) {
        setItems(productList);
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
  }, []);

  // Advanced Multi-Word Search & Category Filtering
  const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);

  const filteredItems = items.filter(item => {
    // 1. Category Filter
    if (selectedCategory === 'LOW_STOCK') {
      const stock = Number(item.currentStock ?? item.stock ?? item.openingStock ?? 0);
      const minStock = Number(item.minimumStock ?? 10);
      if (stock > minStock) return false;
    } else if (selectedCategory !== 'ALL') {
      const cat = (item.category || '').toUpperCase();
      if (!cat.includes(selectedCategory.toUpperCase())) return false;
    }

    // 2. Multi-Word Search (matches all entered keywords across fields)
    if (searchTerms.length === 0) return true;

    const searchableText = [
      item.name,
      item.category,
      item.subCategory,
      item.brand,
      item.sku,
      item.barcode,
      item.unit,
      item.hsnCode,
      item.description
    ].filter(Boolean).join(' ').toLowerCase();

    return searchTerms.every(term => searchableText.includes(term));
  });

  const categories = [
    { id: 'ALL', label: 'All Items' },
    { id: 'GI FITTING', label: 'GI Fitting' },
    { id: 'PAINT', label: 'Paints & Primers' },
    { id: 'MONOBLOCK', label: 'Pumps & Motors' },
    { id: 'PIPE', label: 'Pipes & SWR' },
    { id: 'ELE', label: 'Electricals' },
    { id: 'LOW_STOCK', label: '⚠️ Low Stock' },
  ];

  const renderItem = ({ item }) => {
    const stock = Number(item.currentStock ?? item.stock ?? item.openingStock ?? 0);
    const price = Number(item.sellingPrice ?? item.salePrice ?? item.price ?? 0);
    const cost = Number(item.costPrice ?? item.purchasePrice ?? 0);
    const isLow = stock <= (item.minimumStock || 10);

    return (
      <TouchableOpacity 
        onPress={() => navigation.navigate('ProductDetail', { productId: item._id || item.uuid })}
        activeOpacity={0.8}
      >
        <View style={styles.card}>
          <View style={styles.iconBg}>
            <Ionicons name="cube" size={22} color="#4F46E5" />
          </View>

          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
            
            <View style={styles.metaRow}>
              {item.category ? (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText} numberOfLines={1}>{item.category}</Text>
                </View>
              ) : null}
              {item.sku ? (
                <Text style={styles.skuText}>SKU: {item.sku}</Text>
              ) : null}
            </View>

            <View style={styles.stockRow}>
              <Text style={styles.stockLabel}>Stock: </Text>
              <View style={[styles.stockBadge, { backgroundColor: isLow ? '#FEF2F2' : '#ECFDF5' }]}>
                <Text style={[styles.stockValue, { color: isLow ? '#DC2626' : '#059669' }]}>
                  {stock} {item.unit || 'pcs'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹{price.toLocaleString('en-IN')}</Text>
            {cost > 0 ? (
              <Text style={styles.costPrice}>Cost: ₹{cost.toLocaleString('en-IN')}</Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top App Header with Back Button */}
      <View style={styles.topHeader}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Dashboard');
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.itemCountSubtitle}>
            {items.length > 0 ? `${items.length} total items` : 'Loading items...'}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => navigation.navigate('AddProduct')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search by name, SKU, category, brand..." 
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 6 }}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Category Filters */}
      <View style={styles.categoryScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results Count Bar */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>
          Showing {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          {searchQuery ? ` for "${searchQuery}"` : ''}
        </Text>
      </View>

      {/* Products List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={{ marginTop: 12, color: '#64748B', fontWeight: '500' }}>Loading inventory...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item, idx) => item._id || item.uuid || String(idx)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No matching products found</Text>
              <Text style={styles.emptySubText}>
                Try searching by a different word (e.g., "GI", "Nipale", "Berger", "1.5HP")
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  topHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 14, 
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  itemCountSubtitle: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  addButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5', 
    paddingVertical: 8, 
    paddingHorizontal: 14, 
    borderRadius: 12, 
    gap: 4,
    elevation: 2,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addButtonText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  searchContainer: { 
    marginHorizontal: 16, 
    marginTop: 12,
    marginBottom: 8, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 14, 
    paddingHorizontal: 14, 
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#0F172A' },

  categoryScrollContainer: {
    paddingVertical: 6,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },

  resultsBar: {
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
  resultsText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  list: { padding: 16, paddingTop: 6 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 1,
    shadowColor: '#64748B',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  iconBg: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    backgroundColor: '#EEF2FF', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  itemName: { fontSize: 14, fontWeight: '700', color: '#1E293B', lineHeight: 19 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  skuText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  stockLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stockValue: {
    fontSize: 11,
    fontWeight: '700',
  },

  priceContainer: { alignItems: 'flex-end', justifyContent: 'center' },
  price: { fontSize: 16, fontWeight: '800', color: '#4F46E5' },
  costPrice: { fontSize: 10, color: '#94A3B8', marginTop: 2, fontWeight: '500' },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 20 },
  emptyText: { marginTop: 12, color: '#1E293B', fontSize: 15, fontWeight: '700' },
  emptySubText: { marginTop: 4, color: '#94A3B8', fontSize: 12, textAlign: 'center', lineHeight: 18 }
});

export default InventoryScreen;