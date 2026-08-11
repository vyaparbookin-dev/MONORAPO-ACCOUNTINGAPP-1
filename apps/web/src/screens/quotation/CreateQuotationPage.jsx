import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, X, Save, FileText } from 'lucide-react';
import api from '../../services/api';
import Loader from '../../components/Loader';

export default function CreateQuotationPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // For editing existing quotation
  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    partyId: '',
    date: new Date().toISOString().split('T')[0],
    validUntil: '',
    items: [],
    notes: '',
    subTotal: 0,
    totalTax: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [partiesRes, productsRes] = await Promise.all([
          api.get('/api/parties'),
          api.get('/api/inventory'),
        ]);
        setParties(partiesRes.parties || []);
        setProducts(productsRes.products || []);

        if (id) {
          const quotationRes = await api.get(`/api/quotations/${id}`);
          const quotation = quotationRes.data.data;
          setFormData({
            ...quotation,
            partyId: quotation.partyId._id,
            date: new Date(quotation.date).toISOString().split('T')[0],
            validUntil: quotation.validUntil ? new Date(quotation.validUntil).toISOString().split('T')[0] : '',
          });
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...formData.items];
    newItems[index][name] = value;

    if (name === 'productId') {
      const selectedProduct = products.find(p => p._id === value);
      if (selectedProduct) {
        newItems[index].name = selectedProduct.name;
        newItems[index].rate = selectedProduct.sellingPrice;
        newItems[index].taxRate = selectedProduct.gstRate || 0;
      }
    }

    newItems[index].total = (newItems[index].quantity * newItems[index].rate * (1 + newItems[index].taxRate / 100)).toFixed(2);
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', name: '', quantity: 1, rate: 0, taxRate: 0, total: 0 }],
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    let subTotal = 0;
    let totalTax = 0;
    formData.items.forEach(item => {
      subTotal += item.quantity * item.rate;
      totalTax += (item.quantity * item.rate * item.taxRate / 100);
    });
    setFormData(prev => ({
      ...prev,
      subTotal: subTotal.toFixed(2),
      totalTax: totalTax.toFixed(2),
      totalAmount: (subTotal + totalTax).toFixed(2),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await api.put(`/api/quotations/${id}`, formData);
        alert("Quotation updated successfully!");
      } else {
        await api.post('/api/quotations', formData);
        alert("Quotation created successfully!");
      }
      navigate('/quotations');
    } catch (err) {
      console.error("Failed to save quotation", err);
      alert("Failed to save quotation.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{id ? 'Edit Quotation' : 'Create New Quotation'}</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer</label>
            <select name="partyId" value={formData.partyId} onChange={handleInputChange} className="mt-1 block w-full border p-2 rounded-md">
              <option value="">Select Customer</option>
              {parties.map(party => (
                <option key={party._id} value={party._id}>{party.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quotation Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="mt-1 block w-full border p-2 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Valid Until</label>
            <input type="date" name="validUntil" value={formData.validUntil} onChange={handleInputChange} className="mt-1 block w-full border p-2 rounded-md" />
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Items</h2>
        <div className="space-y-4">
          {formData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end p-3 bg-gray-50 rounded-md border border-gray-100">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600">Product</label>
                <select name="productId" value={item.productId} onChange={(e) => handleItemChange(index, e)} className="mt-1 block w-full border p-2 rounded-md text-sm">
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Qty</label>
                <input type="number" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} className="mt-1 block w-full border p-2 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Rate</label>
                <input type="number" name="rate" value={item.rate} onChange={(e) => handleItemChange(index, e)} className="mt-1 block w-full border p-2 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Tax (%)</label>
                <input type="number" name="taxRate" value={item.taxRate} onChange={(e) => handleItemChange(index, e)} className="mt-1 block w-full border p-2 rounded-md text-sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">₹{item.total}</span>
                <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700"><X size={18} /></button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addItem} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
            <Plus size={18} /> Add Item
          </button>
        </div>

        <div className="text-right space-y-2 mt-6">
          <p className="text-sm text-gray-600">Sub Total: ₹{formData.subTotal}</p>
          <p className="text-sm text-gray-600">Total Tax: ₹{formData.totalTax}</p>
          <p className="text-xl font-bold text-gray-800">Total Amount: ₹{formData.totalAmount}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3" className="mt-1 block w-full border p-2 rounded-md"></textarea>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/quotations')} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
          <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Save size={18} /> {id ? 'Update Quotation' : 'Save Quotation'}
          </button>
        </div>
      </form>
    </div>
  );
}