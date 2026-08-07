import React, { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import { X, Gift, Percent, CheckCircle, AlertCircle, Plus, Search, Scan } from "lucide-react";
import BarcodeScanner from "../../components/BarcodeScanner";

const ScheemApplyModel = ({ isOpen, onClose, cartItems, onApply }) => {
  const [activeTab, setActiveTab] = useState("schemes"); // 'schemes' or 'custom'
  const [schemes, setSchemes] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customItemSearch, setCustomItemSearch] = useState("");
  const [selectedCustomItem, setSelectedCustomItem] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchSchemes();
      fetchInventory();
    }
  }, [isOpen]);

  useEffect(() => {
    // Auto-focus input when switching to Custom tab for physical scanner readiness
    if (activeTab === 'custom' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeTab]);

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      // Fetch active schemes from backend
      const response = await api.get("/api/schemes/active");
      const data = response.data || response;
      // Fallback mock data if API is empty for demonstration
      const mockSchemes = [
        { _id: "1", name: "Diwali Dhamaka", type: "flat", minAmount: 5000, discountPercent: 10, description: "Flat 10% off on bill above ₹5000" },
        { _id: "2", name: "Buy 1 Get 1 Rice", type: "bogo", triggerProduct: "Rice", freeProduct: "Rice", description: "Buy 1kg Rice get 1kg Free" },
        { _id: "3", name: "Combo Offer", type: "combo", triggerProduct: "Sugar", freeProduct: "Tea", description: "Free Tea packet with 5kg Sugar" }
      ];
      setSchemes(Array.isArray(data) && data.length > 0 ? data : mockSchemes);
    } catch (error) {
      console.error("Error fetching schemes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await api.get("/api/inventory");
      const data = response.data?.products || response.data || [];
      setInventory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  // Logic to check if a scheme is applicable based on current cart
  const checkEligibility = (scheme) => {
    if (scheme.type === "flat") {
      const total = cartItems.reduce((sum, item) => sum + (item.total || 0), 0);
      return total >= scheme.minAmount;
    }
    if (scheme.type === "bogo" || scheme.type === "combo") {
      // Check if trigger product exists in cart (partial match on name for demo)
      return cartItems.some(item => item.name.toLowerCase().includes(scheme.triggerProduct.toLowerCase()));
    }
    return false;
  };

  const handleApply = (scheme) => {
    // Calculate benefit
    let result = { schemeId: scheme._id, schemeName: scheme.name, type: scheme.type, discount: 0, freeItems: [] };

    if (scheme.type === "flat") {
      const total = cartItems.reduce((sum, item) => sum + (item.total || 0), 0);
      result.discount = (total * scheme.discountPercent) / 100;
    } else if (scheme.type === "bogo" || scheme.type === "combo") {
      // Find the trigger item to determine quantity
      const triggerItem = cartItems.find(item => item.name.toLowerCase().includes(scheme.triggerProduct.toLowerCase()));
      if (triggerItem) {
        // Find the free product in inventory to get real stats (CP, SKU)
        const inventoryItem = inventory.find(p => p.name.toLowerCase().includes(scheme.freeProduct.toLowerCase()));
        
        result.freeItems.push({
          productId: inventoryItem ? inventoryItem._id : null, // Link to inventory
          name: inventoryItem ? `${inventoryItem.name} (Free)` : `${scheme.freeProduct} (Free)`,
          quantity: 1, // Logic can be improved to match trigger quantity
          rate: 0,
          originalRate: inventoryItem ? inventoryItem.sellingPrice : 0,
          costPrice: inventoryItem ? inventoryItem.costPrice : 0, // Track cost for P&L
          unit: inventoryItem ? inventoryItem.unit : 'pcs',
          hsnCode: inventoryItem ? inventoryItem.hsnCode : '',
          total: 0,
          isFree: true,
          category: "Scheme Item"
        });
      }
    }

    onApply(result);
    onClose();
  };

  const handleCustomApply = () => {
    if (!selectedCustomItem) return;

    const result = {
      schemeName: "Manual Free Item",
      type: "custom",
      discount: 0,
      freeItems: [{
        productId: selectedCustomItem._id,
        name: `${selectedCustomItem.name} (Free)`,
        quantity: 1,
        rate: 0,
        originalRate: selectedCustomItem.sellingPrice,
        costPrice: selectedCustomItem.costPrice,
        unit: selectedCustomItem.unit,
        hsnCode: selectedCustomItem.hsnCode,
        total: 0,
        isFree: true,
        category: "Manual Scheme"
      }]
    };
    onApply(result);
    onClose();
  };

  const handleScanSuccess = (decodedText) => {
    setCustomItemSearch(decodedText);
    setShowScanner(false);
    
    // Try to find exact match in inventory
    const foundItem = inventory.find(item => 
      (item.sku && item.sku.toLowerCase() === decodedText.toLowerCase()) || 
      (item.barcode && item.barcode === decodedText) ||
      (item.name && item.name.toLowerCase() === decodedText.toLowerCase())
    );
    
    if (foundItem) {
      setSelectedCustomItem(foundItem);
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(customItemSearch.toLowerCase()) || 
    item.sku?.toLowerCase().includes(customItemSearch.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl m-4 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Gift className="text-purple-600" /> Apply Scheme / Offer
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button 
            className={`flex-1 py-3 font-medium text-sm ${activeTab === 'schemes' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('schemes')}
          >
            Active Schemes
          </button>
          <button 
            className={`flex-1 py-3 font-medium text-sm ${activeTab === 'custom' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('custom')}
          >
            Custom Free Item (Inventory)
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'schemes' ? (
            loading ? (
            <div className="text-center py-8">Loading schemes...</div>
          ) : (
            <div className="grid gap-4">
              {schemes.map((scheme) => {
                const isEligible = checkEligibility(scheme);
                return (
                  <div 
                    key={scheme._id} 
                    className={`border rounded-lg p-4 flex justify-between items-center transition ${
                      isEligible ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50 opacity-70"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-800">{scheme.name}</h3>
                        {isEligible ? (
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle size={12} /> Eligible
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle size={12} /> Not Eligible
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{scheme.description}</p>
                    </div>
                    
                    <button
                      onClick={() => handleApply(scheme)}
                      disabled={!isEligible}
                      className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                        isEligible 
                          ? "bg-purple-600 text-white hover:bg-purple-700 shadow-sm" 
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {scheme.type === 'flat' ? <Percent size={16} /> : <Gift size={16} />}
                      Apply
                    </button>
                  </div>
                );
              })}
              
              {schemes.length === 0 && (
                <p className="text-center text-gray-500">No active schemes found.</p>
              )}
            </div>
          )
          ) : (
            // Custom Tab Content
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search inventory for free item..." 
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  value={customItemSearch}
                  onChange={(e) => setCustomItemSearch(e.target.value)}
                />
              </div>
              
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {filteredInventory.slice(0, 20).map(item => (
                  <div 
                    key={item._id} 
                    onClick={() => setSelectedCustomItem(item)}
                    className={`p-3 border-b last:border-0 cursor-pointer flex justify-between items-center hover:bg-gray-50 ${selectedCustomItem?._id === item._id ? 'bg-purple-50' : ''}`}
                  >
                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">Stock: {item.currentStock} | Price: ₹{item.sellingPrice}</p>
                    </div>
                    {selectedCustomItem?._id === item._id && <CheckCircle className="text-purple-600" size={18} />}
                  </div>
                ))}
                {filteredInventory.length === 0 && <p className="p-4 text-center text-gray-500">No items found</p>}
              </div>

              <button 
                onClick={handleCustomApply}
                disabled={!selectedCustomItem}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                <Plus size={18} /> Add Selected Item as FREE
              </button>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-gray-50 text-right">
           <button className="text-blue-600 text-sm font-medium hover:underline">
             + Create New Scheme (Go to Settings)
           </button>
        </div>
      </div>
    </div>
  );
};

export default ScheemApplyModel;
