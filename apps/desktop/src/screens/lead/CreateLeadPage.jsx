import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Users } from 'lucide-react';
import api from '../../services/api';
import Loader from '../../components/Loader';

export default function CreateLeadPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // For editing existing lead
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    email: '',
    source: '',
    status: 'new',
    notes: '',
    followUpDate: '',
  });

  useEffect(() => {
    if (id) {
      const fetchLead = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/api/leads/${id}`);
          const lead = res.data.data;
          setFormData({
            ...lead,
            followUpDate: lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : '',
          });
        } catch (err) {
          console.error("Failed to fetch lead", err);
        } finally {
          setLoading(false);
        }
      };
      fetchLead();
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await api.put(`/api/leads/${id}`, formData);
        alert("Lead updated successfully!");
      } else {
        await api.post('/api/leads', formData);
        alert("Lead created successfully!");
      }
      navigate('/leads');
    } catch (err) {
      console.error("Failed to save lead", err);
      alert("Failed to save lead.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{id ? 'Edit Lead' : 'Create New Lead'}</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full border p-2 rounded-md" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
            <input type="text" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} className="mt-1 block w-full border p-2 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="mt-1 block w-full border p-2 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Source</label>
            <input type="text" name="source" value={formData.source} onChange={handleInputChange} className="mt-1 block w-full border p-2 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select name="status" value={formData.status} onChange={handleInputChange} className="mt-1 block w-full border p-2 rounded-md">
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="unqualified">Unqualified</option>
              <option value="converted">Converted</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Follow-up Date</label>
            <input type="date" name="followUpDate" value={formData.followUpDate} onChange={handleInputChange} className="mt-1 block w-full border p-2 rounded-md" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3" className="mt-1 block w-full border p-2 rounded-md"></textarea>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/leads')} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
          <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Save size={18} /> {id ? 'Update Lead' : 'Save Lead'}
          </button>
        </div>
      </form>
    </div>
  );
}