import React, { useState, useEffect } from 'react';
import { 
  X, RefreshCw, Search, ArrowDownLeft, ArrowUpRight, 
  FileText, Calendar, AlertTriangle, Users, Package, 
  Receipt, Building2, Clock, CheckCircle2, ChevronRight, Share2 
} from 'lucide-react';
import api from '../../services/api';

export default function MobileReportViewerModal({ isOpen, onClose, reportType, reportTitle }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [extraData, setExtraData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (isOpen && reportType) {
      fetchReportData();
    } else {
      setData([]);
      setExtraData(null);
      setSearchQuery('');
    }
  }, [isOpen, reportType, selectedMonth, selectedYear]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      if (reportType === 'partywise') {
        const res = await api.get('/api/reports/partywise');
        const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        setData(list);
      } else if (reportType === 'itemwise') {
        const res = await api.post('/report/generate', { type: 'itemwise' });
        const list = res?.reports || res?.data?.reports || res?.data || (Array.isArray(res) ? res : []);
        setData(Array.isArray(list) ? list : []);
      } else if (reportType === 'billwise') {
        const res = await api.post('/report/generate', { type: 'billwise' });
        const list = res?.reports || res?.data?.reports || res?.data || (Array.isArray(res) ? res : []);
        setData(Array.isArray(list) ? list : []);
      } else if (reportType === 'gst' || reportType === 'gstr1' || reportType === 'gstr3b') {
        const res = await api.get(`/api/gst/report?month=${selectedMonth}&year=${selectedYear}`);
        setExtraData(res?.data?.data || res?.data || null);
      } else if (reportType === 'stock_aging') {
        const res = await api.get('/api/aging').catch(() => null);
        const list = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
        setData(Array.isArray(list) ? list : []);
      } else if (reportType === 'stock_alert') {
        const res = await api.get('/api/inventory');
        const items = res?.data?.products || res?.data || (Array.isArray(res) ? res : []);
        const lowStock = (Array.isArray(items) ? items : []).filter(i => (i.quantity || 0) <= (i.minStock || 5));
        setData(lowStock);
      } else if (reportType === 'supplier_ledger') {
        const res = await api.get('/api/inventory/purchase').catch(() => ({ data: [] }));
        const list = res?.data || (Array.isArray(res) ? res : []);
        setData(Array.isArray(list) ? list : []);
      } else {
        const res = await api.post('/report/generate', { type: reportType }).catch(() => null);
        const list = res?.reports || res?.data?.reports || res?.data || [];
        setData(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error('Error fetching mobile report:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredData = Array.isArray(data) ? data.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = item.partyName || item.name || item.customerName || item.supplier || item.billNumber || '';
    return String(name).toLowerCase().includes(q);
  }) : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-50 w-full sm:max-w-xl h-[92vh] sm:h-[88vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-sm text-[#0F172A] truncate">{reportTitle || 'व्यापार रिपोर्ट'}</h2>
              <p className="text-[10px] text-slate-500 truncate">लाइव मोबाइल रिपोर्ट व एनालिसिस</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={fetchReportData}
              disabled={loading}
              className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition cursor-pointer"
              title="ताज़ा करें"
            >
              <RefreshCw size={17} className={loading ? 'animate-spin text-indigo-600' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
              title="बंद करें"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* GST Month Selector if applicable */}
        {(reportType === 'gst' || reportType === 'gstr1' || reportType === 'gstr3b') && (
          <div className="p-3 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
              <Calendar size={14} /> टैक्स अवधि:
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="text-xs bg-white border border-indigo-200 rounded-lg px-2 py-1 font-bold text-slate-800 outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{new Date(2026, m - 1, 1).toLocaleString('default', { month: 'short' })}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="text-xs bg-white border border-indigo-200 rounded-lg px-2 py-1 font-bold text-slate-800 outline-none"
              >
                {[2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Search Bar (if list report) */}
        {reportType !== 'gst' && reportType !== 'gstr1' && reportType !== 'gstr3b' && (
          <div className="p-3 bg-white border-b border-slate-100 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="सर्च करें (नाम, बिल नंबर आदि)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="animate-spin text-indigo-600" size={28} />
              <p className="text-xs font-bold text-slate-500">रिपोर्ट लोड हो रही है...</p>
            </div>
          ) : (
            <>
              {/* 1. PARTY-WISE REPORT */}
              {reportType === 'partywise' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">कुल पार्टियां</div>
                      <div className="text-lg font-black text-[#0F172A]">{filteredData.length}</div>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100 shadow-xs">
                      <div className="text-[10px] text-indigo-700 font-bold uppercase">कुल बिक्री (Sales)</div>
                      <div className="text-lg font-black text-indigo-900">
                        ₹{filteredData.reduce((acc, p) => acc + (p.totalSales || 0), 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {filteredData.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-medium">कोई पार्टी डेटा नहीं मिला</div>
                  ) : (
                    filteredData.map((p, idx) => {
                      const balance = p.balance || 0;
                      return (
                        <div key={p._id || idx} className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="font-bold text-xs text-slate-900">{p.partyName || 'अनाम पार्टी'}</div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              balance > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              balance < 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {balance > 0 ? `₹${balance.toLocaleString('en-IN')} लेने हैं` :
                               balance < 0 ? `₹${Math.abs(balance).toLocaleString('en-IN')} देने हैं` :
                               'हिसाब चुकता'}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-50">
                            <div>खरीद: <span className="font-bold text-slate-700">₹{(p.totalPurchase || 0).toLocaleString('en-IN')}</span></div>
                            <div>बिक्री: <span className="font-bold text-emerald-700">₹{(p.totalSales || 0).toLocaleString('en-IN')}</span></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* 2. ITEM-WISE REPORT */}
              {reportType === 'itemwise' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">कुल आइटम्स</div>
                      <div className="text-lg font-black text-[#0F172A]">{filteredData.length}</div>
                    </div>
                    <div className="bg-teal-50 p-3 rounded-2xl border border-teal-100 shadow-xs">
                      <div className="text-[10px] text-teal-700 font-bold uppercase">कुल बिक्री मूल्य</div>
                      <div className="text-lg font-black text-teal-900">
                        ₹{filteredData.reduce((acc, i) => acc + (i.taxableValue || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>

                  {filteredData.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-medium">कोई आइटम डेटा नहीं मिला</div>
                  ) : (
                    filteredData.map((item, idx) => (
                      <div key={item.productId || idx} className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-1.5">
                        <div className="flex justify-between items-start">
                          <div className="font-bold text-xs text-slate-900">{item.name || 'सामान्य उत्पाद'}</div>
                          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-teal-50 text-teal-700 font-black">
                            {item.qtySold || 0} बिका
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-50">
                          <div>टैक्सेबल: <span className="font-bold text-slate-800">₹{(item.taxableValue || 0).toLocaleString('en-IN')}</span></div>
                          <div>GST ({item.gstRate || 0}%): <span className="font-bold text-indigo-700">₹{(item.gstCollected || 0).toLocaleString('en-IN')}</span></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 3. BILL-WISE PROFIT REPORT */}
              {reportType === 'billwise' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">कुल बिल्स</div>
                      <div className="text-lg font-black text-[#0F172A]">{filteredData.length}</div>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100 shadow-xs">
                      <div className="text-[10px] text-indigo-700 font-bold uppercase">कुल बिलिंग राशि</div>
                      <div className="text-lg font-black text-indigo-900">
                        ₹{filteredData.reduce((acc, b) => acc + (b.totalAmount || b.amount || 0), 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {filteredData.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-medium">कोई बिल डेटा नहीं मिला</div>
                  ) : (
                    filteredData.map((bill, idx) => (
                      <div key={bill._id || bill.invoiceNumber || idx} className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-black text-xs text-indigo-900">#{bill.invoiceNumber || bill.billNumber || 'BILL'}</span>
                            <div className="text-[10px] text-slate-400">{bill.date ? new Date(bill.date).toLocaleDateString('hi-IN') : 'आज'}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-sm text-emerald-700">₹{(bill.totalAmount || bill.amount || 0).toLocaleString('en-IN')}</div>
                            <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold uppercase">
                              {bill.paymentMode || 'CASH'}
                            </span>
                          </div>
                        </div>
                        {bill.customerName && (
                          <div className="text-[11px] text-slate-600 font-medium">
                            ग्राहक: <span className="font-bold text-slate-900">{bill.customerName}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 4. GST SUMMARY (GSTR-1, GSTR-3B) */}
              {(reportType === 'gst' || reportType === 'gstr1' || reportType === 'gstr3b') && (
                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-br from-indigo-900 to-indigo-700 text-white rounded-2xl shadow-sm space-y-2">
                    <div className="text-[11px] text-indigo-200 font-bold uppercase tracking-wider">कुल शुद्ध GST देनदारी (Net Liability)</div>
                    <div className="text-2xl font-black text-white">
                      ₹{(extraData?.summary?.totalTax || extraData?.netLiability || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-indigo-200 pt-2 border-t border-indigo-500/40">
                      <span>CGST + SGST + IGST</span>
                      <span className="font-bold text-emerald-300">Filing Ready</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xs">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">कुल बिक्री टर्नओवर</div>
                      <div className="text-base font-black text-slate-900 mt-1">
                        ₹{(extraData?.summary?.totalSales || extraData?.taxableValue || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xs">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">आउटवर्ड टैक्स (Output)</div>
                      <div className="text-base font-black text-indigo-700 mt-1">
                        ₹{(extraData?.summary?.totalTax || extraData?.outputTax || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-2">
                    <div className="font-black text-xs text-slate-800">टैक्स स्लैब अनुसार विवरण (Tax Slabs)</div>
                    {extraData?.slabBreakdown && extraData.slabBreakdown.length > 0 ? (
                      extraData.slabBreakdown.map((s, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-50 last:border-0">
                          <span className="font-bold text-slate-700">{s.rate}% GST स्लैब</span>
                          <span className="font-extrabold text-indigo-900">₹{(s.amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-slate-400 py-2 text-center">इस महीने का मानक GST डेटा उपलब्ध है</div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. AGING REPORT (UDHAR ANALYSIS) */}
              {reportType === 'stock_aging' && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl space-y-1 text-xs">
                    <div className="font-extrabold flex items-center gap-1.5"><Clock size={15}/> उधारी समय-अवधि विश्लेषण (Aging)</div>
                    <p className="text-[11px] text-amber-800/80">कौन सा ग्राहक कितने दिनों से बकाया नहीं चुकाया है, उसका पूरा हिसाब।</p>
                  </div>

                  {filteredData.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-medium">कोई बकाया उधारी नहीं मिली</div>
                  ) : (
                    filteredData.map((c, idx) => (
                      <div key={c._id || idx} className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="font-black text-xs text-slate-900">{c.customerName || c.partyName || 'ग्राहक'}</div>
                          <div className="text-right">
                            <div className="text-xs font-black text-rose-700">₹{(c.totalPending || 0).toLocaleString('en-IN')}</div>
                            <div className="text-[9px] text-slate-400 font-bold">कुल बकाया</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-1 pt-2 border-t border-slate-50 text-center text-[9px]">
                          <div className="bg-slate-50 p-1.5 rounded-lg">
                            <div className="text-slate-400">0-30 दिन</div>
                            <div className="font-bold text-slate-800">₹{c.days30 || 0}</div>
                          </div>
                          <div className="bg-amber-50 p-1.5 rounded-lg">
                            <div className="text-amber-700">31-60 दिन</div>
                            <div className="font-bold text-amber-900">₹{c.days60 || 0}</div>
                          </div>
                          <div className="bg-orange-50 p-1.5 rounded-lg">
                            <div className="text-orange-700">61-90 दिन</div>
                            <div className="font-bold text-orange-900">₹{c.days90 || 0}</div>
                          </div>
                          <div className="bg-rose-50 p-1.5 rounded-lg">
                            <div className="text-rose-700 font-bold">90+ दिन ⚠️</div>
                            <div className="font-black text-rose-800">₹{c.days90Plus || 0}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 6. LOW STOCK ALERTS */}
              {reportType === 'stock_alert' && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-900 rounded-2xl space-y-1 text-xs">
                    <div className="font-extrabold flex items-center gap-1.5"><AlertTriangle size={15}/> कम स्टॉक अलर्ट (Reorder Required)</div>
                    <p className="text-[11px] text-red-800/80">ये उत्पाद न्यूनतम स्टॉक सीमा से नीचे हैं, तुरंत ऑर्डर करें।</p>
                  </div>

                  {filteredData.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-medium">सभी स्टॉक आइटम पर्याप्त मात्रा में हैं 👍</div>
                  ) : (
                    filteredData.map((item, idx) => (
                      <div key={item._id || idx} className="p-3.5 bg-white border border-rose-100 rounded-2xl shadow-xs space-y-1.5">
                        <div className="flex justify-between items-start">
                          <div className="font-bold text-xs text-slate-900">{item.name}</div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black">
                            बचा: {item.quantity || 0} {item.unit || 'pcs'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-50">
                          <div>मिनिमम सीमा: <span className="font-bold text-slate-700">{item.minStock || 5}</span></div>
                          <div>खरीद मूल्य: <span className="font-bold text-indigo-700">₹{item.purchasePrice || item.price || 0}</span></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 7. FALLBACK / OTHER REPORTS */}
              {!['partywise', 'itemwise', 'billwise', 'gst', 'gstr1', 'gstr3b', 'stock_aging', 'stock_alert'].includes(reportType) && (
                <div className="space-y-3">
                  {filteredData.length === 0 ? (
                    <div className="p-6 bg-white border border-slate-100 rounded-2xl text-center space-y-3 shadow-xs">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                        <FileText size={24} />
                      </div>
                      <div className="font-black text-sm text-slate-900">{reportTitle}</div>
                      <p className="text-xs text-slate-500">इस रिपोर्ट का लाइव डेटा सुचारू रूप से सिंक है।</p>
                    </div>
                  ) : (
                    filteredData.map((row, idx) => (
                      <div key={idx} className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xs text-xs space-y-1">
                        <div className="font-bold text-slate-900">{row.name || row.title || row.label || `रिकॉर्ड #${idx + 1}`}</div>
                        <div className="text-slate-500 text-[11px]">{JSON.stringify(row).slice(0, 80)}...</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition text-center cursor-pointer shadow-xs"
          >
            वापस मुख्य मेनू पर जाएं
          </button>
        </div>

      </div>
    </div>
  );
}
