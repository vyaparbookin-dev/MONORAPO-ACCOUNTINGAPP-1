import React from "react";
import { MessageCircle } from "lucide-react";

export default function UdharReminder({ partyName, mobileNumber, pendingAmount }) {
  const handleSend = () => {
    if (!mobileNumber) {
      alert("Customer mobile number is missing!");
      return;
    }
    if (!pendingAmount || pendingAmount <= 0) {
      alert("No pending amount for this customer.");
      return;
    }

    let mobile = mobileNumber.replace(/\D/g, "");
    if (mobile.length === 10) mobile = "91" + mobile;

    const message = `Hello ${partyName},\n\nThis is a friendly reminder from our store. Your total outstanding balance is *₹${pendingAmount.toLocaleString()}*.\n\nPlease clear the dues at your earliest convenience.\n\nThank you!`;

    const url = `https://wa.me/${mobile}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <button onClick={handleSend} type="button" className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition" title="Send Payment Reminder via WhatsApp">
      <MessageCircle size={16} />
      <span className="text-sm font-semibold">Remind</span>
    </button>
  );
}