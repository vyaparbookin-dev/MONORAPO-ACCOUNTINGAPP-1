import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Printer, Share2 } from 'lucide-react';
import Loader from '../../components/Loader';
import { crmApiService } from '@repo/shared/services/crmApiService';

export default function QuotationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotation = async () => {
      setLoading(true);
      try {
        const res = await crmApiService.getQuotationById(id);
        setQuotation(res.data.data);
      } catch (err) {
        console.error("Failed to fetch quotation details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotation();
  }, [id]);

  if (loading) return <Loader />;
  if (!quotation) return <div className="p-6 text-center">Quotation not found.</div>;

  const subTotal = quotation.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => navigate('/quotations')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="flex gap-2">
          <button className="p-2 border rounded-lg hover:bg-gray-50"><Share2 size={18} /></button>
          <button className="p-2 border rounded-lg hover:bg-gray-50"><Printer size={18} /></button>
          <Link to={`/quotations/edit/${id}`} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Edit size={18} /> Edit
          </Link>
        </div>
      </div>

      {/* Quotation Header */}
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Quotation</h1>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <p>To: <span className="font-semibold">{quotation.customerName}</span></p>
          <p>Date: <span className="font-semibold">{new Date(quotation.date).toLocaleDateString()}</span></p>
        </div>
        <div className="flex justify-between mt-1 text-sm text-gray-600">
          <p>Quotation No: <span className="font-semibold">#{quotation.quotationNumber}</span></p>
          <p>Valid Until: <span className="font-semibold">{new Date(quotation.validUntil).toLocaleDateString()}</span></p>
        </div>
      </div>

      {/* Items Table */}
      <div className="mt-4">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left text-xs font-semibold text-gray-600">ITEM</th>
              <th className="p-2 text-right text-xs font-semibold text-gray-600">QTY</th>
              <th className="p-2 text-right text-xs font-semibold text-gray-600">RATE</th>
              <th className="p-2 text-right text-xs font-semibold text-gray-600">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {quotation.items.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="p-2 font-medium">{item.itemName}</td>
                <td className="p-2 text-right">{item.quantity}</td>
                <td className="p-2 text-right">₹{item.rate.toFixed(2)}</td>
                <td className="p-2 text-right">₹{(item.quantity * item.rate).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mt-4 flex justify-end">
        <div className="w-64">
          <div className="flex justify-between p-2"><span className="text-gray-600">Subtotal:</span> <span>₹{subTotal.toFixed(2)}</span></div>
          <div className="flex justify-between p-2"><span className="text-gray-600">Tax ({quotation.taxRate || 0}%):</span> <span>₹{quotation.taxAmount.toFixed(2)}</span></div>
          <div className="flex justify-between p-2 border-t font-bold text-lg"><span >Total:</span> <span>₹{quotation.totalAmount.toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );
}