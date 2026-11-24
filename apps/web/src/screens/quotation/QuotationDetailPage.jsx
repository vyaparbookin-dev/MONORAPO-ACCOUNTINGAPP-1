import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Printer, Share2, MessageCircle } from 'lucide-react';
import Loader from '../../components/Loader';
import api from '../../services/api';

export default function QuotationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotation = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/quotations/${id}`);
        setQuotation(res.data?.data || res.data);
      } catch (err) {
        console.error("Failed to fetch quotation details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotation();
  }, [id]);

  if (loading) return <Loader />;
  if (!quotation) return <div className="p-6 text-center text-slate-600">कोटेशन नहीं मिला।</div>;

  const items = quotation.items || [];
  const subTotal = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.rate || 0)), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const phone = quotation.customerPhone || quotation.partyId?.mobileNumber || '';
    const cName = quotation.customerName || quotation.partyId?.name || 'सम्मानित ग्राहक';
    let itemLines = '';
    items.forEach((it, i) => {
      itemLines += `${i + 1}️⃣ *${it.name || it.itemName}* (${it.quantity} ${it.unit || 'Pcs'}) @ ₹${it.rate} = ₹${it.total || (it.quantity * it.rate)}\n`;
    });

    const msg =
      `नमस्ते *${cName}* जी! 🙏\n\n` +
      `📋 कोटेशन #${quotation.quotationNumber}\n` +
      `📅 दिनांक: ${quotation.date ? new Date(quotation.date).toLocaleDateString('en-IN') : '-'}\n` +
      (quotation.rateTier ? `🏷️ रेट टियर: रेट ${quotation.rateTier}\n\n` : '\n') +
      `📦 *सामान सूची:*\n` +
      itemLines +
      `\n` +
      `💰 *कुल देय राशि: ₹${Number(quotation.totalAmount || 0).toLocaleString('en-IN')}*\n\n` +
      (quotation.notes ? `📝 *शर्तें:* ${quotation.notes}\n\n` : '') +
      `ऑर्डर कन्फर्म करने हेतु कृपया बताएं। धन्यवाद!`;

    const cleanPhone = phone.replace(/\D/g, '');
    const encoded = encodeURIComponent(msg);
    if (cleanPhone) {
      window.open(`https://wa.me/91${cleanPhone}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => navigate('/quotations')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-xs">
          <ArrowLeft size={18} /> वापस कोटेशन सूची
        </button>
        <div className="flex flex-wrap gap-2">
          {quotation.status !== 'converted' ? (
            <button
              onClick={async () => {
                if (!window.confirm(`क्या आप कोटेशन #${quotation.quotationNumber} को बिक्री बिल में बदलना चाहते हैं?`)) return;
                try {
                  const res = await api.post(`/api/quotations/${id}/convert-to-bill`);
                  if (res.data?.success) {
                    alert(`🎉 कोटेशन बिल में बदल गया!\nबिल नंबर: ${res.data.data?.bill?.billNumber || 'नया बिल'}`);
                    navigate('/billing');
                  }
                } catch (e) {
                  alert("बिल में बदलने में विफल: " + (e.response?.data?.message || e.message));
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer"
            >
              <span>🧾 बिल में बदलें</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1">
              ✅ बिल बन चुका है
            </span>
          )}
          <button
            onClick={handleShareWhatsApp}
            title="WhatsApp शेयर"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <MessageCircle size={15} /> <span>WhatsApp</span>
          </button>
          <button
            onClick={handlePrint}
            title="प्रिंट करें"
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 transition"
          >
            <Printer size={18} />
          </button>
          <Link
            to={`/quotations/edit/${id}`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
          >
            <Edit size={15} /> <span>एडिट</span>
          </Link>
        </div>
      </div>

      {/* Quotation Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-xl space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black text-slate-900">कोटेशन (Quotation)</h1>
            <p className="text-xs text-blue-700 font-mono font-bold mt-0.5">#{quotation.quotationNumber}</p>
          </div>
          {quotation.rateTier && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              लागू रेट: रेट {quotation.rateTier}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs text-slate-700 pt-2 border-t border-slate-200">
          <div>
            <p><b>ग्राहक:</b> {quotation.customerName || quotation.partyId?.name || 'अनाम ग्राहक'}</p>
            {quotation.customerPhone && <p><b>फोन:</b> {quotation.customerPhone}</p>}
            {quotation.customerAddress && <p><b>पता:</b> {quotation.customerAddress}</p>}
          </div>
          <div className="text-right">
            <p><b>दिनांक:</b> {quotation.date ? new Date(quotation.date).toLocaleDateString('en-IN') : '-'}</p>
            <p><b>वैधता:</b> {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString('en-IN') : 'लागू नहीं'}</p>
            {quotation.expectedPurchaseDate && (
              <p><b>संभावित खरीद:</b> <span className="font-bold text-blue-700">{new Date(quotation.expectedPurchaseDate).toLocaleDateString('hi-IN')}</span></p>
            )}
            {quotation.followUpDate && (
              <p><b>फॉलो-अप कॉल:</b> <span className="font-bold text-amber-700">{new Date(quotation.followUpDate).toLocaleDateString('hi-IN')}</span></p>
            )}
            <p><b>स्थिति:</b> <span className="uppercase font-bold text-blue-600">{quotation.status || 'pending'}</span></p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-100 text-slate-700 uppercase font-extrabold border-b">
            <tr>
              <th className="p-2.5 text-left">सामान (Item)</th>
              <th className="p-2.5 text-center">इकाई</th>
              <th className="p-2.5 text-right">मात्रा</th>
              <th className="p-2.5 text-right">रेट (₹)</th>
              <th className="p-2.5 text-right">कुल राशि (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="p-2.5 font-bold text-slate-900">{item.name || item.itemName}</td>
                <td className="p-2.5 text-center text-slate-500">{item.unit || 'Pcs'}</td>
                <td className="p-2.5 text-right font-semibold">{item.quantity}</td>
                <td className="p-2.5 text-right">₹{Number(item?.rate || 0).toFixed(2)}</td>
                <td className="p-2.5 text-right font-black text-slate-900">₹{Number(item.total || (item.quantity * item.rate)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals & Notes */}
      <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="text-xs text-slate-600 space-y-1 w-full sm:w-1/2">
          {quotation.notes && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900 mb-1">📝 शर्तें व नोट्स:</p>
              <p className="whitespace-pre-line leading-relaxed">{quotation.notes}</p>
            </div>
          )}
        </div>

        <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>उप-योग (Subtotal):</span> <span>₹{Number(subTotal || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>टैक्स (GST):</span> <span>₹{Number(quotation?.totalTax || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200 font-black text-sm text-blue-700">
            <span>कुल अंतिम राशि:</span> <span>₹{Number(quotation?.totalAmount || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}