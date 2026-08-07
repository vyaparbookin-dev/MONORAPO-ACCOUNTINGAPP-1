import QRCode from 'qrcode';

/**
 * Dynamic UPI QR Code generate karta hai
 * @param {string} upiId - Merchant/Company ki UPI ID (e.g., merchant@sbi)
 * @param {string} merchantName - Company ka naam
 * @param {number} amount - Bill ka final amount
 * @param {string} billNumber - Bill ka number (Reference ke liye)
 * @returns {Promise<string|null>} Base64 Image URL
 */
export const generateUpiQrCode = async (upiId, merchantName, amount, billNumber = '') => {
  try {
    if (!upiId || !amount || amount <= 0) return null;

    const formattedAmount = Number(amount).toFixed(2);
    
    // Standard UPI Intent URL format
    // pa = Payee Address (UPI ID), pn = Payee Name, am = Amount, cu = Currency, tr = Transaction Ref
    let upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${formattedAmount}&cu=INR`;
    
    if (billNumber) {
      upiString += `&tr=${encodeURIComponent(billNumber)}`;
    }

    // Is string ko Base64 Image me convert kar rahe hain taki frontend direct <img src="..." /> me dikha sake
    const qrCodeBase64 = await QRCode.toDataURL(upiString, { width: 200, margin: 1 });
    return qrCodeBase64;
  } catch (error) {
    console.error("❌ Error generating UPI QR Code:", error);
    return null;
  }
};