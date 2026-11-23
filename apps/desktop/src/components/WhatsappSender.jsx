import React, { useState } from "react";
import { MessageCircle, CheckCircle2 } from "lucide-react";
import api from "../services/api";

export default function WhatsappSender({ bill, isPaid = false }) {
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const rawMobile = bill?.customerMobile || bill?.customerPhone || bill?.phone;
    if (!rawMobile) {
      alert("इस बिल में ग्राहक का मोबाइल नंबर दर्ज नहीं है!");
      return;
    }

    setLoading(true);
    try {
      let mobile = String(rawMobile).replace(/\D/g, "");
      if (mobile.length === 10) mobile = "91" + mobile;

      const liveBillLink = `${window.location.origin}/bill/view/${bill._id || bill.id}`;
      const totalAmt = Number(bill.total || bill.finalAmount || 0);
      const isPaidBill = isPaid || bill.paymentStatus === 'paid' || bill.paymentMethod === 'CASH' || bill.paymentMethod === 'UPI' || (bill.balance === 0 && totalAmt > 0);

      // Custom message if paid bill
      let customText = undefined;
      if (isPaidBill) {
        customText = `🧾 *भुगतान पावती व चुकता बिल (PAID BILL RECEIPT)*\n` +
          `👤 ग्राहक: *${bill.customerName || 'सम्मानित ग्राहक'}*\n` +
          `📄 बिल नं: *#${bill.billNumber || bill.billNo || bill.invoiceNumber || '-'}*\n` +
          `📅 दिनांक: *${bill.date ? new Date(bill.date).toLocaleDateString('hi-IN') : new Date().toLocaleDateString('hi-IN')}*\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `💰 कुल बिल राशि: *₹${totalAmt.toLocaleString('en-IN')}*\n` +
          `✅ प्राप्त भुगतान: *₹${totalAmt.toLocaleString('en-IN')} (${bill.paymentMethod || bill.paymentMode || 'Paid'})*\n` +
          `🎉 शेष बाकी: *₹0.00 (पूर्णतः चुकता / FULLY PAID)*\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `📄 *डिजिटल बिल देखें व PDF डाउनलोड करें:*\n${liveBillLink}\n\n` +
          `🙏 हमारे साथ व्यापार करने के लिए बहुत-बहुत धन्यवाद!`;
      }

      // Call send-invoice endpoint
      const response = await api.post("/api/whatsapp/send-invoice", {
        billId: bill._id || bill.id,
        mobileNumber: mobile,
        customText
      });

      // ⚡ If sent directly in background via QR session, do NOT open browser/WhatsApp!
      if (response.data?.sentDirectly) {
        alert(`✅ बिल ${bill.customerName || ''} के WhatsApp (${mobile}) पर बैकग्राउंड में सफलतापूर्वक भेज दिया गया! (Chrome/WhatsApp खोलने की आवश्यकता नहीं पड़ी)`);
        return;
      }

      // Fallback: If not connected to background engine, open WhatsApp Web/App
      const message = response.data?.preview || response.preview || customText ||
        `नमस्ते ${bill.customerName || 'ग्राहक'},\n\nआपका बिल #${bill.billNumber || bill.billNo} (राशि: ₹${totalAmt.toLocaleString('en-IN')}) तैयार है।\n\n📄 बिल देखें:\n${liveBillLink}\n\nधन्यवाद!`;

      const url = `https://wa.me/${mobile}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank");
    } catch (error) {
      console.error("Failed to generate WhatsApp message", error);
      alert("WhatsApp संदेश भेजने में समस्या: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSend}
      disabled={loading}
      className="p-2 hover:bg-green-100 rounded-lg text-green-600 transition disabled:opacity-50 cursor-pointer"
      title="WhatsApp पर बिल / रसीद भेजें"
    >
      {loading ? (
        <div className="animate-spin w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full" />
      ) : (
        <MessageCircle size={18} />
      )}
    </button>
  );
}
