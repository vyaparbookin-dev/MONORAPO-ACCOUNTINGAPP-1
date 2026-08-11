import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save } from 'lucide-react';
import api from '../../services/api';

const CreatePurchaseOrderPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialItem = location.state?.item;

  const [supplier, setSupplier] = useState(initialItem?.supplierId || '');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialItem) {
      setItems([{
        productId: initialItem._id,
        name: initialItem.name,
        quantity: initialItem.minimumStock || 10, // Default to min stock level
        price: initialItem.costPrice || 0,
      }]);
    }
  }, [initialItem]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { productId: '', name: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.quantity * item.price), 0).toFixed(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        supplierId: supplier,
        orderDate,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
        notes,
        status: 'Pending',
      };
      // This endpoint needs to be created in the backend
      await api.post('/api/purchase-orders', payload); 
      alert('Purchase Order Created Successfully!');
      navigate('/inventory/purchase-orders'); // Redirect to PO list page
    } catch (error) {
      console.error("Failed to create PO:", error);
      alert('Error creating Purchase Order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">Create Purchase Order</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        {/* Supplier and Date */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Enter Supplier ID or Name" className="w-full p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
            <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="w-full p-2 border rounded-md" />
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-2 mb-4">
          <h3 className="font-semibold">Order Items</h3>
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <input type="text" placeholder="Item Name" value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} className="flex-grow p-2 border rounded-md" />
              <input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="w-20 p-2 border rounded-md" />
              <input type="number" placeholder="Price" value={item.price} onChange={e => handleItemChange(index, 'price', e.target.value)} className="w-24 p-2 border rounded-md" />
              <button onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={18} /></button>
            </div>
          ))}
        </div>

        <button onClick={addItem} className="flex items-center gap-2 text-sm text-blue-600 font-semibold mb-6"><Plus size={16} /> Add Another Item</button>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Remarks</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="3" className="w-full p-2 border rounded-md"></textarea>
        </div>

        {/* Total and Submit */}
        <div className="flex justify-between items-center border-t pt-4">
          <div>
            <span className="text-gray-600">Total Order Value: </span>
            <span className="font-bold text-xl">₹{calculateTotal()}</span>
          </div>
          <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50">
            <Save size={18} /> {loading ? 'Saving...' : 'Save Purchase Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePurchaseOrderPage;