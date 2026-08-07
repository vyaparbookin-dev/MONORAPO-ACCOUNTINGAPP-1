import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Users, CalendarCheck, HandCoins, Scan, Settings, MapPin, Fingerprint, Wifi } from "lucide-react";
import BarcodeScanner from "../../components/BarcodeScanner";

export default function MarkAttendancePage() {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("attendance"); // attendance or payment

  // Attendance Form
  const [attForm, setAttForm] = useState({
    status: "present",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    notes: ""
  });

  // Payment Form
  const [payForm, setPayForm] = useState({
    amount: "",
    paymentType: "advance",
    notes: ""
  });

  // Scanner State
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await api.get("/api/staff");
        setStaffList(res.data?.staff || []);
      } catch (err) {
        console.error("Failed to load staff", err);
      }
    };
    fetchStaff();
  }, []);

  // 🚀 Auto-Attendance via Barcode/QR Scan
  const handleScanSuccess = async (decodedText) => {
    // Assume ID Card Barcode contains Staff's Mobile Number, ID, or Name
    const scannedStaff = staffList.find(s => 
      s._id === decodedText || 
      s.mobileNumber === decodedText || 
      s.name.toLowerCase() === decodedText.toLowerCase()
    );

    if (!scannedStaff) {
      alert(`No staff member found for scanned ID: ${decodedText}`);
      return;
    }

    try {
      setLoading(true);
      // Automatically mark present for today
      const today = new Date().toISOString().split("T")[0];
      await api.post("/api/staff/attendance", { 
        staffId: scannedStaff._id, 
        status: "present", 
        startDate: today, 
        endDate: today 
      });
      alert(`✅ Automated Attendance: ${scannedStaff.name} marked Present!`);
    } catch (err) {
      alert("Failed to mark auto attendance");
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff) return alert("Select Staff first");
    
    setLoading(true);
    try {
      await api.post("/api/staff/attendance", { ...attForm, staffId: selectedStaff });
      alert("Attendance Marked Successfully!");
      setAttForm({ ...attForm, notes: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark attendance");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff || !payForm.amount) return alert("Select Staff and Enter Amount");

    setLoading(true);
    try {
      await api.post("/api/staff/payment", { ...payForm, staffId: selectedStaff, amount: Number(payForm.amount) });
      alert("Payment Recorded Successfully!");
      setPayForm({ ...payForm, amount: "", notes: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  const currentStaff = staffList.find(s => s._id === selectedStaff);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <Users className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
          <p className="text-gray-500 text-sm">Mark attendance, give advances, or settle salaries</p>
        </div>
        <div className="ml-auto">
          <button 
            onClick={() => setShowScanner(!showScanner)}
            className="flex items-center gap-2 bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-lg font-bold transition shadow-sm"
          >
            <Scan size={20} />
            {showScanner ? "Close Scanner" : "Auto ID Scan"}
          </button>
        </div>
      </div>

      {/* Smart Scanner Panel */}
      {showScanner && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-blue-200 mb-6 transition-all">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-blue-800">Scan Employee ID Card</h2>
            <p className="text-sm text-gray-500">Scanning will automatically mark them as <b>Present</b> for today.</p>
          </div>
          <BarcodeScanner 
            onScanSuccess={handleScanSuccess} 
            onScanFailure={(err) => console.log("Scan wait...")} 
          />
          <div className="mt-4 text-center">
             <input 
               type="text" 
               placeholder="Or click here and use physical barcode scanner..." 
               className="w-full max-w-md border border-blue-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none text-center"
               onKeyDown={(e) => {
                 if (e.key === 'Enter') {
                   handleScanSuccess(e.target.value);
                   e.target.value = '';
                 }
               }}
             />
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee *</label>
        <select className="w-full border p-3 rounded-lg bg-gray-50" value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}>
          <option value="">-- Choose Employee --</option>
          {staffList.map(s => <option key={s._id} value={s._id}>{s.name} ({s.role}) - Bal: ₹{s.balance || 0}</option>)}
        </select>
        {currentStaff && (
          <div className="mt-2 text-sm text-blue-700 font-medium">
            Current Balance: ₹{currentStaff.balance || 0} (If positive, you have to pay. If negative, it's advance.)
          </div>
        )}
      </div>

      <div className="flex border-b mb-6">
        <button onClick={() => setActiveTab("attendance")} className={`px-6 py-3 font-semibold flex items-center gap-2 ${activeTab === 'attendance' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}><CalendarCheck size={18}/> Mark Attendance</button>
        <button onClick={() => setActiveTab("payment")} className={`px-6 py-3 font-semibold flex items-center gap-2 ${activeTab === 'payment' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}><HandCoins size={18}/> Record Payment</button>
        <button onClick={() => setActiveTab("automation")} className={`px-6 py-3 font-semibold flex items-center gap-2 ${activeTab === 'automation' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}><Settings size={18}/> Automation Setup</button>
      </div>

      {activeTab === 'attendance' && (
        <form onSubmit={handleAttendanceSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input type="date" className="w-full border p-2 rounded" value={attForm.startDate} onChange={e => setAttForm({...attForm, startDate: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input type="date" className="w-full border p-2 rounded" value={attForm.endDate} onChange={e => setAttForm({...attForm, endDate: e.target.value})} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select className="w-full border p-2 rounded" value={attForm.status} onChange={e => setAttForm({...attForm, status: e.target.value})}>
              <option value="present">Present (Full Day)</option>
              <option value="half-day">Half Day</option>
              <option value="absent">Absent / Leave</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-2 rounded mt-4">Save Attendance</button>
        </form>
      )}

      {activeTab === 'payment' && (
        <form onSubmit={handlePaymentSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <input type="number" className="w-full border p-2 rounded" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
              <select className="w-full border p-2 rounded" value={payForm.paymentType} onChange={e => setPayForm({...payForm, paymentType: e.target.value})}>
                <option value="advance">Give Advance (-)</option>
                <option value="salary_settlement">Pay Salary (-)</option>
                <option value="deduction">Fine / Deduction (-)</option>
                <option value="incentive">Add Bonus / Incentive (+)</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white font-bold py-2 rounded mt-4">Record Transaction</button>
        </form>
      )}

      {activeTab === 'automation' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2"><Scan className="text-blue-600"/> 1. Smart ID Card / Barcode Scanner</h2>
            <p className="text-sm text-gray-600 mb-4">Staff can scan their ID cards at the counter to mark attendance instantly. Connect a physical USB barcode scanner or use camera.</p>
            <button 
              onClick={() => setShowScanner(!showScanner)}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-200 transition"
            >
              {showScanner ? "Close Scanner Interface" : "Launch Scanner Interface"}
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2"><Fingerprint className="text-purple-600"/> 2. Biometric Device Sync (ZKTeco / Mantra)</h2>
            <p className="text-sm text-gray-600 mb-4">Connect your local network fingerprint machine. The system will automatically fetch logs via backend.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Device IP Address</label>
                <input type="text" placeholder="e.g. 192.168.1.201" className="w-full border p-2 rounded focus:ring-2 focus:ring-purple-500 outline-none" defaultValue="192.168.1.201" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Port</label>
                <input type="text" placeholder="4370" className="w-full border p-2 rounded focus:ring-2 focus:ring-purple-500 outline-none" defaultValue="4370" />
              </div>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition flex justify-center items-center gap-2">
                <Wifi size={18} /> Test Connection
              </button>
            </div>
            <p className="text-xs text-green-600 mt-3 font-medium">* System is ready for integration when hardware is purchased.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2"><MapPin className="text-red-600"/> 3. Mobile App Geo-Fencing</h2>
            <p className="text-sm text-gray-600 mb-4">Restrict staff from marking attendance unless they are inside the shop premises (Uses Mobile GPS).</p>
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 text-red-600 rounded" />
                <span className="font-medium text-gray-700">Enforce GPS Location Check on Mobile App</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Shop Latitude (e.g. 28.704060)" className="w-full border p-2 rounded bg-gray-50 focus:bg-white" />
              <input type="text" placeholder="Shop Longitude (e.g. 77.102493)" className="w-full border p-2 rounded bg-gray-50 focus:bg-white" />
            </div>
            <button className="mt-4 px-4 py-2 border border-red-200 bg-red-50 text-red-700 rounded-lg font-bold hover:bg-red-100 transition">
              Auto-Detect Current Location
            </button>
          </div>
        </div>
      )}
    </div>
  );
}