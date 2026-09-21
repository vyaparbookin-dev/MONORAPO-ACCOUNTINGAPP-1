import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Calendar, Phone, Mail, FileText } from 'lucide-react';
import Loader from '../../components/Loader';
import { crmApiService } from '@repo/shared/services/crmApiService';

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLead = async () => {
      setLoading(true);
      try {
        const res = await crmApiService.getLeadById(id);
        setLead(res.data.data);
      } catch (err) {
        console.error("Failed to fetch lead details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [id]);

  if (loading) return <Loader />;
  if (!lead) return <div className="p-6 text-center">Lead not found.</div>;

  const statusColors = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    qualified: 'bg-green-100 text-green-800',
    unqualified: 'bg-red-100 text-red-800',
    converted: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate('/leads')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
          <ArrowLeft size={20} /> Back to Leads
        </button>
        <Link to={`/leads/edit/${id}`} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Edit size={18} /> Edit Lead
        </Link>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{lead.name}</h1>
            <p className="text-gray-500 mt-1">Lead from: {lead.source || 'N/A'}</p>
          </div>
          <span className={`px-3 py-1 text-sm font-bold rounded-full ${statusColors[lead.status] || 'bg-gray-100 text-gray-800'}`}>
            {lead.status.toUpperCase()}
          </span>
        </div>

        <div className="border-t my-6"></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-gray-400" />
            <span className="text-gray-700">{lead.mobileNumber || 'Not provided'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-gray-400" />
            <span className="text-gray-700">{lead.email || 'Not provided'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-gray-400" />
            <span className="text-gray-700">Follow-up: {lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : 'Not set'}</span>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><FileText size={20} /> Notes</h3>
          <p className="mt-2 p-4 bg-gray-50 rounded-lg border text-gray-600 whitespace-pre-wrap">{lead.notes || 'No notes added.'}</p>
        </div>
      </div>
    </div>
  );
}