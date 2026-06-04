import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/Api';

export default function CategoryAnalyticsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});
  const [groupBy, setGroupBy] = useState("category"); // 'category', 'subCategory', 'brand'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [masterLists, setMasterLists] = useState({ category: [], subCategory: [], brand: [] });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (inventory.length > 0 || Object.keys(masterLists).some(k => masterLists[k].length > 0)) {
      processData(inventory, groupBy, masterLists);
    }
  }, [groupBy, inventory, masterLists]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, catRes, subCatRes, brandRes] = await Promise.all([
        api.get("/api/inventory").catch(() => ({ data: { products: [] } })),
        api.get("/api/category").catch(() => ({ data: { categories: [] } })),
        api.get("/api/subcategory").catch(() => ({ data: { subCategories: [] } })),
        api.get("/api/brand").catch(() => ({ data: { brands: [] } }))
      ]);

      const products = invRes.data?.products || invRes.data || [];
      const safe = Array.isArray(products) ? products : [];
      setInventory(safe);

      const masters = {
        category: (catRes.data?.categories || catRes.data || []).map(c => c.name).filter(Boolean),
        subCategory: (subCatRes.data?.subCategories || subCatRes.data || []).map(c => c.name).filter(Boolean),
        brand: (brandRes.data?.brands || brandRes.data || []).map(c => c.name).filter(Boolean)
      };
      setMasterLists(masters);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const processData = (items, groupByKey, masters) => {
    const grouped = {};
    
    // Initialize master lists to show even empty categories
    if (masters && masters[groupByKey]) {
      masters[groupByKey].forEach(name => {
        grouped[name] = [];
      });
    }

    items.forEach(p => {
      let cat = p[groupByKey];
      if (!cat || String(cat).trim() === '') cat = `Uncategorized`;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    });

    const stats = {};
    Object.keys(grouped).forEach(cat => {
      const catItems = grouped[cat];
      const lowStockCount = catItems.filter(p => (p.currentStock || 0) < (p.minimumStock || 10)).length;
      const totalValue = catItems.reduce((sum, p) => sum + ((p.currentStock || 0) * (p.costPrice || 0)), 0);
      const totalStock = catItems.reduce((sum, p) => sum + (p.currentStock || 0), 0);

      stats[cat] = {
        itemCount: catItems.length,
        lowStockCount,
        totalValue,
        totalStock,
      };
    });

    setCategories(Object.keys(grouped).sort());
    setCategoryStats(stats);
  };

  const getGroupLabel = () => {
    if (groupBy === 'category') return 'Categories';
    if (groupBy === 'subCategory') return 'Sub-Categories';
    return 'Brands';
  };

  const renderProductItem = ({ item }) => {
    const isLow = (item.currentStock || 0) <= (item.minimumStock || 10);
    return (
      <View style={[styles.productRow, isLow && styles.productRowLow]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productSku}>SKU: {item.sku || 'N/A'}</Text>
        </View>
        <View style={styles.productStockContainer}>
          <Text style={[styles.productStock, isLow && styles.productStockLowText]}>
            {item.currentStock || 0}
          </Text>
          <Text style={styles.productUnit}>{item.unit || 'pcs'}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (selectedCategory) {
    const categoryData = categoryStats[selectedCategory];
    const categoryItems = inventory.filter(p => (p[groupBy] || 'Uncategorized') === selectedCategory);

    return (
      <View style={styles.container}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setSelectedCategory(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#2563eb" />
          </TouchableOpacity>
          <View>
            <Text style={styles.detailTitle}>{selectedCategory}</Text>
            <Text style={styles.detailSubtitle}>{categoryData.itemCount} items found</Text>
          </View>
        </View>
        <FlatList
          data={categoryItems}
          keyExtractor={(item) => item._id}
          renderItem={renderProductItem}
          contentContainerStyle={styles.scrollArea}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, groupBy === 'category' && styles.tabActive]} onPress={() => setGroupBy('category')}>
          <Text style={[styles.tabText, groupBy === 'category' && styles.tabTextActive]}>Category</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, groupBy === 'subCategory' && styles.tabActive]} onPress={() => setGroupBy('subCategory')}>
          <Text style={[styles.tabText, groupBy === 'subCategory' && styles.tabTextActive]}>Sub-Category</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, groupBy === 'brand' && styles.tabActive]} onPress={() => setGroupBy('brand')}>
          <Text style={[styles.tabText, groupBy === 'brand' && styles.tabTextActive]}>Brand</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics by {getGroupLabel()}</Text>
          <Text style={styles.subtitle}>{categories.length} {getGroupLabel()} found in inventory</Text>
        </View>

        {categories.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No data found</Text>
          </View>
        ) : (
          categories.map(cat => {
            const stats = categoryStats[cat];
            const isLow = stats.lowStockCount > 0;
            return (
              <TouchableOpacity key={cat} onPress={() => setSelectedCategory(cat)}>
                <View style={[styles.card, isLow && styles.cardWarning]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.catTitleRow}>
                      <Ionicons name={isLow ? "warning" : "cube"} size={20} color={isLow ? "#ea580c" : "#2563eb"} />
                      <Text style={styles.catName} numberOfLines={1}>{cat}</Text>
                    </View>
                    <Text style={styles.itemCount}>{stats.itemCount} Items</Text>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Stock Qty</Text>
                      <Text style={styles.statValue}>{stats.totalStock}</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Low Stock</Text>
                      <Text style={[styles.statValue, isLow && { color: '#ea580c' }]}>{stats.lowStockCount}</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Stock Value</Text>
                      <Text style={[styles.statValue, { color: '#059669' }]}>₹{(stats.totalValue / 1000).toFixed(1)}k</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', padding: 10, elevation: 2 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#eff6ff' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#2563eb' },

  scrollArea: { padding: 15 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
  emptyText: { marginTop: 10, color: '#6b7280', fontSize: 16 },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#3b82f6', elevation: 1 },
  cardWarning: { borderLeftColor: '#f97316' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  catTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  catName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginLeft: 8, flex: 1 },
  itemCount: { fontSize: 12, fontWeight: 'bold', color: '#4b5563', backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 15 },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },

  // Styles for Detail View
  detailHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backButton: { marginRight: 15, padding: 5 },
  detailTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  detailSubtitle: { fontSize: 13, color: '#6b7280' },
  productRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  productRowLow: { backgroundColor: '#fff7ed' },
  productName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  productSku: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  productStockContainer: { alignItems: 'flex-end' },
  productStock: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  productStockLowText: { color: '#c2410c' },
  productUnit: { fontSize: 12, color: '#6b7280' }
});
