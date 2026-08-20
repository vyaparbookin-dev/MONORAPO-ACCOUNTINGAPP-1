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
  ScrollView,
  Modal
} from 'react-native';
import { getData } from '../../services/ApiService';
import { Ionicons } from '@expo/vector-icons';
import { getProductsLocal } from '../../../db';

const InventoryScreen = ({ navigation }) => {
  const categoryScrollRef = React.useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStockFilter, setSelectedStockFilter] = useState('ALL');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditorName, setAuditorName] = useState('');

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

  const matchCategory = useCallback((item, catId) => {
    if (!item) return false;
    if (catId === 'ALL') return true;
    const stock = Number(item.currentStock ?? item.stock ?? item.openingStock ?? 0);
    const minStock = Number(item.minimumStock ?? 10);
    if (catId === 'LOW_STOCK') return stock <= minStock;
    if (catId === 'IN_STOCK') return stock > 0;

    const cat = String(item.category || '').toUpperCase();
    const brand = String(item.brand || '').toUpperCase();
    const subCat = String(item.subCategory || '').toUpperCase();
    const name = String(item.name || '').toUpperCase();

    if (catId === 'PLYWOOD') {
      return cat === 'PLYWOOD' || cat === 'BEAT' || cat.includes('PLY') || cat.includes('BEAT') || cat.includes('HARDWOOD') || subCat.includes('PLY') || name.includes('PLYWOOD') || name.includes('18MM') || name.includes('12MM') || name.includes('6MM');
    }
    if (catId === 'BERGER') {
      if (brand.includes('KAMDHENU') || cat.includes('KAMDHENU') || name.includes('KAMDHENU') || name.includes('KAMOBLASTER')) return false;
      return brand.includes('BERGER') || cat.includes('BERGER') || name.includes('BERGER') || name.includes('BISON') || name.includes('LUXOL') || name.includes('WALMASTA') || name.includes('WEATHERCOAT') || name.includes('SILK') || name.includes('RANGOLI') || name.includes('BUTERFLY') || (cat.includes('DISTEMPER') && !brand.includes('KAMDHENU')) || (cat.includes('ACRILIC') && !brand.includes('KAMDHENU'));
    }
    if (catId === 'KAMDHENU') {
      return brand.includes('KAMDHENU') || cat.includes('KAMDHENU') || name.includes('KAMDHENU') || name.includes('KAMOBLASTER') || name.includes('KAMOCRETE') || name.includes('KAMODUR');
    }
    if (catId === 'ELE') {
      return cat.includes('ELE') || cat.includes('ARKAYLITE') || brand.includes('ARKAYLITE') || cat.includes('MODUL') || cat.includes('SWITCH') || cat.includes('WIRE') || cat.includes('COPPER') || cat.includes('ANCHOR') || cat.includes('CONA') || cat.includes('CR') || cat.includes('VINAY') || name.includes('SWITCH') || name.includes('SOCKET') || name.includes('ELEMENT') || name.includes('MCB');
    }
    if (catId === 'GI') {
      return cat.includes('GI') || name.includes('GI ') || name.includes('PUMP') || cat.includes('MONOBLOCK') || cat.includes('PRIMING') || name.includes('ELBOW') || name.includes('NIPPLE') || name.includes('UNION') || name.includes('REDUCER');
    }
    if (catId === 'PIPES') {
      if (cat.includes('GI')) return false;
      return cat.includes('UPVC') || cat.includes('SWR') || cat.includes('CPVC') || cat.includes('PIPE') || brand.includes('KISAN') || cat.includes('PRINCE') || cat.includes('PAPULAR') || cat.includes('GARDEN') || cat.includes('SACTION') || cat.includes('FOOTVALVE') || name.includes('UPVC') || name.includes('CPVC') || name.includes('SWR');
    }
    return cat.includes(catId) || brand.includes(catId);
  }, []);

  const filteredItems = items.filter(item => {
    // 1. Category Filter
    if (!matchCategory(item, selectedCategory)) return false;

    // 2. Stock Status Sub-Filter (Prevents mixing up categories)
    const stock = Number(item.currentStock ?? item.stock ?? item.openingStock ?? 0);
    const minStock = Number(item.minimumStock ?? 10);
    if (selectedStockFilter === 'IN_STOCK' && stock <= 0) return false;
    if (selectedStockFilter === 'LOW_STOCK' && stock >= minStock) return false;
    if (selectedStockFilter === 'OUT_OF_STOCK' && stock > 0) return false;

    // 3. Multi-Word Search (matches all entered keywords across fields)
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

  // Dynamic SaaS Multi-tenant Category Detection
  const distinctCats = [...new Set(items.map(p => (p.category || '').trim()).filter(Boolean))];
  const isHardwareStore = items.some(p => {
    const c = String(p.category || '').toUpperCase();
    const n = String(p.name || '').toUpperCase();
    return c.includes('PLY') || c.includes('PAINT') || c.includes('PIPE') || c.includes('GI') || n.includes('PLY') || n.includes('BERGER');
  });

  const categories = isHardwareStore ? [
    { id: 'ALL', label: `All (${items.length})` },
    { id: 'PLYWOOD', label: `🪵 Plywood & Beat (${items.filter(it => matchCategory(it, 'PLYWOOD')).length})` },
    { id: 'BERGER', label: `🎨 Berger Paints (${items.filter(it => matchCategory(it, 'BERGER')).length})` },
    { id: 'KAMDHENU', label: `🎨 Kamdhenu Paints (${items.filter(it => matchCategory(it, 'KAMDHENU')).length})` },
    { id: 'ELE', label: `⚡ Electricals (${items.filter(it => matchCategory(it, 'ELE')).length})` },
    { id: 'GI', label: `🔩 GI Fittings & Pumps (${items.filter(it => matchCategory(it, 'GI')).length})` },
    { id: 'PIPES', label: `🚰 Pipes & UPVC (${items.filter(it => matchCategory(it, 'PIPES')).length})` },
    { id: 'IN_STOCK', label: `📦 All In Stock (${items.filter(it => Number(it.currentStock ?? it.stock ?? 0) > 0).length})` },
  ] : [
    { id: 'ALL', label: `All (${items.length})` },
    ...distinctCats.slice(0, 10).map(cat => ({
      id: cat,
      label: `🏷️ ${cat} (${items.filter(it => String(it.category || '').toLowerCase() === cat.toLowerCase()).length})`
    })),
    { id: 'IN_STOCK', label: `📦 All In Stock (${items.filter(it => Number(it.currentStock ?? it.stock ?? 0) > 0).length})` },
  ];

  // Real-time Exact Physical Valuation: Only multiply for in-stock units!
  const totalValuation = filteredItems.reduce((acc, it) => {
    const s = Number(it.currentStock ?? it.stock ?? it.openingStock ?? 0);
    const p = Number(it.sellingPrice ?? it.salePrice ?? it.price ?? 0);
    return acc + (s > 0 ? (s * p) : 0);
  }, 0);
  const lowStockTotal = filteredItems.filter(it => Number(it.currentStock ?? it.stock ?? 0) <= (it.minimumStock || 10)).length;

  const renderItem = ({ item }) => {
    const stock = Number(item.currentStock ?? item.stock ?? item.openingStock ?? 0);
    const price = Number(item.sellingPrice ?? item.salePrice ?? item.price ?? 0);
    const cost = Number(item.costPrice ?? item.purchasePrice ?? 0);
    const isLow = stock <= (item.minimumStock || 10);

    return (
      <TouchableOpacity 
        onPress={() => navigation.navigate('Inventory', { screen: 'ProductDetail', params: { productId: item._id || item.uuid } })}
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
              {item.brand ? (
                <Text style={styles.skuText}>Brand: {item.brand}</Text>
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

  const handleExportAuditCSV = () => {
    const csvHeader = "Sr No,SKU,Item Name,Brand,Category,Unit,System Qty,Physical Count (Write Here),Variance (+/-),Sale Price (Rs),System Valuation (Rs),Auditor / Staff Name,Audit Date\n";
    const csvRows = filteredItems.map((p, idx) => {
      const name = `"${String(p.name || '').replace(/"/g, '""')}"`;
      const brand = `"${String(p.brand || '').replace(/"/g, '""')}"`;
      const cat = `"${String(p.category || '').replace(/"/g, '""')}"`;
      const stock = Number(p.currentStock ?? p.stock ?? p.openingStock ?? 0);
      const price = Number(p.sellingPrice ?? p.salePrice ?? p.price ?? 0);
      const val = stock * price;
      return `${idx + 1},"${p.sku || ''}",${name},${brand},${cat},"${p.unit || 'PC'}",${stock},,,${price},${val},"${auditorName || 'Staff'}",${new Date().toLocaleDateString('en-IN')}`;
    }).join("\n");

    const csvContent = csvHeader + csvRows;

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Stock_Audit_${selectedCategory}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`Stock Audit CSV generated for ${filteredItems.length} products!`);
    }
  };

  const handlePrintAuditHTML = () => {
    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return alert("Please allow popups to print stock audit sheets.");
      const rowsHtml = filteredItems.map((p, idx) => `
        <tr>
          <td style="text-align:center; font-weight:bold;">${idx + 1}</td>
          <td><strong>${p.name}</strong> ${p.packing ? `(${p.packing})` : ''}</td>
          <td>${p.brand || '-'}</td>
          <td>${p.category || '-'}</td>
          <td style="text-align:center; font-weight:bold; background:#f8fafc;">${p.currentStock ?? p.stock ?? 0} ${p.unit || 'PC'}</td>
          <td style="text-align:center;"><div style="width:50px; height:18px; border:1px solid #94a3b8; margin:auto;"></div></td>
          <td style="text-align:center;"><div style="width:40px; height:18px; border:1px solid #94a3b8; margin:auto;"></div></td>
          <td style="text-align:right;">₹${Number(p.sellingPrice || p.price || 0).toLocaleString('en-IN')}</td>
          <td></td>
        </tr>
      `).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Stock Audit Sheet - Ganesh Hardware</title>
          <style>
            body { font-family: sans-serif; padding: 15px; font-size: 11px; color: #1e293b; }
            h1 { text-align: center; margin: 0; font-size: 18px; }
            h2 { text-align: center; margin: 3px 0 10px 0; font-size: 13px; color: #64748b; }
            .meta { display: grid; grid-template-columns: 1fr 1fr 1fr; background: #f8fafc; padding: 8px; border: 1px solid #cbd5e1; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 4px 6px; }
            th { background: #f1f5f9; text-align: left; }
            .footer { display: grid; grid-template-columns: 1fr 1fr 1fr; margin-top: 30px; text-align: center; }
            .sig { border-top: 1px solid #000; padding-top: 4px; font-weight: bold; margin-top: 25px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>GANESH HARDWARE</h1>
          <h2>📋 PHYSICAL STOCK AUDIT & VERIFICATION SHEET</h2>
          <div class="meta">
            <div><strong>Auditor:</strong> ${auditorName || 'Staff Member'}</div>
            <div><strong>Date:</strong> ${new Date().toLocaleString('en-IN')}</div>
            <div><strong>Category:</strong> ${selectedCategory}</div>
            <div><strong>Total Items:</strong> ${filteredItems.length}</div>
            <div><strong>Stock Units:</strong> ${filteredItems.reduce((acc, p) => acc + Number(p.currentStock ?? p.stock ?? 0), 0)}</div>
            <div><strong>Valuation:</strong> ₹${totalValuation.toLocaleString('en-IN')}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:25px; text-align:center;">#</th>
                <th>Product Name</th>
                <th>Brand</th>
                <th>Category</th>
                <th style="text-align:center;">System Qty</th>
                <th style="text-align:center; width:60px;">Physical Count</th>
                <th style="text-align:center; width:50px;">Variance</th>
                <th style="text-align:right;">Price</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="footer">
            <div><div class="sig">Staff / Auditor Signature</div>${auditorName || 'Auditor'}</div>
            <div><div class="sig">Store Incharge Signature</div>Store Manager</div>
            <div><div class="sig">Owner Signature</div>Ganesh Hardware</div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
      `;
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  return (
    <View style={styles.container}>
      {/* Top App Header with Back Button & Action Buttons */}
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
          <Text style={styles.title}>Inventory Master</Text>
          <Text style={styles.itemCountSubtitle}>
            {filteredItems.length} items (₹{totalValuation.toLocaleString('en-IN')})
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <TouchableOpacity 
            style={styles.auditButton} 
            onPress={() => setShowAuditModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text-outline" size={15} color="#B45309" />
            <Text style={styles.auditButtonText}>Audit</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => navigation.navigate('Inventory', { screen: 'AddProduct' })}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mini Analytics Bar */}
      <View style={styles.analyticsBar}>
        <View style={styles.analyticsItem}>
          <Text style={styles.analyticsLabel}>Items</Text>
          <Text style={styles.analyticsVal}>{filteredItems.length}</Text>
        </View>
        <View style={styles.analyticsDivider} />
        <View style={styles.analyticsItem}>
          <Text style={styles.analyticsLabel}>Stock Value</Text>
          <Text style={[styles.analyticsVal, { color: '#059669' }]}>₹{(totalValuation/100000).toFixed(2)}L</Text>
        </View>
        <View style={styles.analyticsDivider} />
        <View style={styles.analyticsItem}>
          <Text style={styles.analyticsLabel}>Low Stock</Text>
          <Text style={[styles.analyticsVal, { color: '#DC2626' }]}>{lowStockTotal}</Text>
        </View>
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

      {/* Horizontal Category Filters with Quick Arrow Navigation */}
      <View style={styles.categoryScrollContainer}>
        <TouchableOpacity 
          style={styles.scrollArrowBtn} 
          onPress={() => categoryScrollRef.current?.scrollTo({ x: 0, animated: true })}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={16} color="#475569" />
        </TouchableOpacity>

        <ScrollView 
          ref={categoryScrollRef}
          horizontal 
          showsHorizontalScrollIndicator={Platform.OS === 'web'} 
          contentContainerStyle={styles.categoryScroll}
        >
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

        <TouchableOpacity 
          style={styles.scrollArrowBtn} 
          onPress={() => categoryScrollRef.current?.scrollToEnd({ animated: true })}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={16} color="#475569" />
        </TouchableOpacity>
      </View>

      {/* Stock Sub-Pills (Prevents cross-category mixing) */}
      <View style={styles.stockPillsRow}>
        {[
          { id: 'ALL', label: 'All Items' },
          { id: 'IN_STOCK', label: '✨ In Stock (>0)' },
          { id: 'LOW_STOCK', label: '⚠️ Low Stock (<10)' },
          { id: 'OUT_OF_STOCK', label: '🚫 Out of Stock (0)' }
        ].map(st => {
          const isActive = selectedStockFilter === st.id;
          return (
            <TouchableOpacity
              key={st.id}
              style={[styles.stockPill, isActive && styles.stockPillActive]}
              onPress={() => setSelectedStockFilter(st.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.stockPillText, isActive && styles.stockPillTextActive]}>{st.label}</Text>
            </TouchableOpacity>
          );
        })}
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

      {/* Physical Stock Audit Modal */}
      <Modal
        visible={showAuditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAuditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="document-text" size={22} color="#D97706" />
                <Text style={styles.modalTitle}>Physical Stock Audit</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAuditModal(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Export or print verification sheet for staff godown checking.
            </Text>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.inputLabel}>Auditor / Staff Name (जांचकर्ता का नाम)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Ramesh / Godown Incharge"
                value={auditorName}
                onChangeText={setAuditorName}
              />
            </View>

            <View style={styles.auditStatsBox}>
              <View style={styles.auditStatItem}>
                <Text style={styles.auditStatLabel}>Items</Text>
                <Text style={styles.auditStatVal}>{filteredItems.length}</Text>
              </View>
              <View style={styles.analyticsDivider} />
              <View style={styles.auditStatItem}>
                <Text style={styles.auditStatLabel}>Total Units</Text>
                <Text style={styles.auditStatVal}>{filteredItems.reduce((acc, p) => acc + Number(p.currentStock ?? p.stock ?? 0), 0)}</Text>
              </View>
              <View style={styles.analyticsDivider} />
              <View style={styles.auditStatItem}>
                <Text style={styles.auditStatLabel}>Category</Text>
                <Text style={[styles.auditStatVal, { fontSize: 11 }]} numberOfLines={1}>{selectedCategory}</Text>
              </View>
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity 
                style={[styles.modalActionBtn, { backgroundColor: '#059669' }]}
                onPress={handleExportAuditCSV}
                activeOpacity={0.8}
              >
                <Ionicons name="download-outline" size={18} color="#FFF" />
                <Text style={styles.modalActionBtnText}>Export CSV</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalActionBtn, { backgroundColor: '#4F46E5' }]}
                onPress={handlePrintAuditHTML}
                activeOpacity={0.8}
              >
                <Ionicons name="print-outline" size={18} color="#FFF" />
                <Text style={styles.modalActionBtnText}>Print Sheet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  auditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 4,
  },
  auditButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
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

  analyticsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  analyticsItem: {
    alignItems: 'center',
    flex: 1,
  },
  analyticsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  analyticsVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },
  analyticsDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },

  categoryScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  scrollArrowBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginHorizontal: 2,
  },
  categoryScroll: {
    paddingHorizontal: 6,
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

  stockPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
    flexWrap: 'wrap',
  },
  stockPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stockPillActive: {
    backgroundColor: '#312E81',
    borderColor: '#312E81',
  },
  stockPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  stockPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  emptySubText: { marginTop: 4, color: '#94A3B8', fontSize: 12, textAlign: 'center', lineHeight: 18 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
  },
  auditStatsBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 14,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  auditStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  auditStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  auditStatVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350F',
    marginTop: 2,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default InventoryScreen;