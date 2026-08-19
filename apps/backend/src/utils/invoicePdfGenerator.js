import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export const generateInvoicePdf = async (invoiceData, companyData, res) => {
  const doc = new PDFDocument({ margin: 50 });

  // Pipe the PDF into the response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceData.billNumber}.pdf"`);
  doc.pipe(res);

  // Use company's theme color
  const themeColor = companyData.invoiceThemeColor || '#007bff'; // Default blue
  const templateType = companyData.invoiceTemplateType || 'classic';

  if (templateType === 'modern') {
    // --- MODERN TEMPLATE ---
    doc.rect(0, 0, doc.page.width, 110).fill(themeColor);
    doc.fillColor('#ffffff').fontSize(24).text(companyData.name, 50, 30);
    doc.fontSize(10).text(companyData.address || 'Address N/A', 50, 60);
    
    doc.fillColor(themeColor).fontSize(20).text("INVOICE", 450, 30, { align: 'right' });
    doc.fillColor('#ffffff').fontSize(10).text(`Bill No: ${invoiceData.billNumber}`, 450, 60, { align: 'right' });
    doc.text(`Date: ${new Date(invoiceData.date || invoiceData.createdAt).toLocaleDateString()}`, 450, 75, { align: 'right' });

    doc.moveDown(4);
    doc.fillColor('#333').fontSize(12).text("Billed To:", 50, 130);
    doc.fontSize(10).text(invoiceData.customerName, 50, 150);
    if (invoiceData.partyId && invoiceData.partyId.address) {
      doc.text(invoiceData.partyId.address, 50, 165);
    }

    const tableTop = 220;
    doc.rect(50, tableTop, 515, 20).fillAndStroke(themeColor, themeColor);
    doc.fillColor('#ffffff').fontSize(10)
       .text('Item', 60, tableTop + 5).text('Qty', 250, tableTop + 5).text('Price', 300, tableTop + 5).text('Total', 490, tableTop + 5);

    let y = tableTop + 25;
    invoiceData.items.forEach(item => {
      doc.fillColor('#333').fontSize(10).text(item.productName || 'N/A', 60, y).text(item.quantity, 250, y).text(item.price.toFixed(2), 300, y).text(item.total.toFixed(2), 490, y);
      y += 20;
      doc.lineWidth(0.5).strokeColor('#eee').moveTo(50, y-5).lineTo(565, y-5).stroke();
    });

    doc.moveDown(2);
    doc.fontSize(12).text(`Subtotal: ${invoiceData.total.toFixed(2)}`, { align: 'right' });
    doc.text(`Tax: ${invoiceData.tax.toFixed(2)}`, { align: 'right' });
    if (invoiceData.discount || invoiceData.discountAmount) doc.text(`Discount: -₹${(invoiceData.discount || invoiceData.discountAmount).toFixed(2)}`, { align: 'right' });
    if (invoiceData.freightCharges) doc.text(`Freight/Transport: +₹${invoiceData.freightCharges.toFixed(2)}`, { align: 'right' });
    if (invoiceData.packingForwardingCharges) doc.text(`P&F Charges: +₹${invoiceData.packingForwardingCharges.toFixed(2)}`, { align: 'right' });
    if (invoiceData.laborCharges) doc.text(`Labor/Install: +₹${invoiceData.laborCharges.toFixed(2)}`, { align: 'right' });
    doc.fillColor(themeColor).fontSize(16).text(`Grand Total: ₹${invoiceData.finalAmount.toFixed(2)}`, { align: 'right' }).moveDown(2);

  } else if (templateType === 'minimal') {
    // --- MINIMAL TEMPLATE ---
    doc.fillColor('#000000').fontSize(26).text("INVOICE", 50, 50);
    doc.fontSize(10).fillColor('#666').text(`Invoice Number: ${invoiceData.billNumber}`, 50, 80);
    doc.text(`Date: ${new Date(invoiceData.date || invoiceData.createdAt).toLocaleDateString()}`, 50, 95);
    doc.fontSize(14).fillColor(themeColor).text(companyData.name, 400, 50, { align: 'right' });
    doc.fontSize(10).fillColor('#666').text(companyData.address || '', 400, 70, { align: 'right' });
    doc.moveDown(3);
    doc.fontSize(12).fillColor('#000').text("Bill To:", 50, 140);
    doc.fontSize(10).fillColor('#444').text(invoiceData.customerName, 50, 160);

    const tableTop = 210;
    doc.lineWidth(1).strokeColor('#000').moveTo(50, tableTop).lineTo(565, tableTop).stroke();
    doc.fillColor('#000').fontSize(10).text('Description', 50, tableTop + 10).text('Amount', 490, tableTop + 10);
    doc.lineWidth(1).strokeColor('#000').moveTo(50, tableTop + 25).lineTo(565, tableTop + 25).stroke();

    let y = tableTop + 35;
    invoiceData.items.forEach(item => {
      doc.fillColor('#444').fontSize(10).text(`${item.productName || 'N/A'} (x${item.quantity})`, 50, y).text(item.total.toFixed(2), 490, y);
      y += 20;
    });
    doc.lineWidth(1).strokeColor('#ccc').moveTo(50, y+10).lineTo(565, y+10).stroke();
    doc.moveDown(2);
    
    doc.fillColor('#000').fontSize(10);
    if (invoiceData.freightCharges) doc.text(`Freight: ₹${invoiceData.freightCharges.toFixed(2)}`, { align: 'right' });
    if (invoiceData.laborCharges) doc.text(`Labor: ₹${invoiceData.laborCharges.toFixed(2)}`, { align: 'right' });
    
    doc.fillColor('#000').fontSize(12).text(`Total: ₹${invoiceData.finalAmount.toFixed(2)}`, { align: 'right' }).moveDown(2);

  } else {
    // --- CLASSIC TEMPLATE (Default) ---
    doc.fillColor('#333')
       .fontSize(20)
       .text(companyData.name || 'Company Name', 50, 50)
       .fontSize(10)
       .text(companyData.address || '', 50, 75)
       .text(`Phone: ${companyData.phone || 'N/A'}`, 50, 90)
       .text(`GSTIN: ${companyData.gstNumber || 'N/A'}`, 50, 105);

    doc.fillColor(themeColor)
       .fontSize(20)
       .text("TAX INVOICE", 400, 50, { align: 'right' })
       .fontSize(10)
       .fillColor('#333')
       .text(`Invoice #: ${invoiceData.billNumber}`, 400, 75, { align: 'right' })
       .text(`Date: ${new Date(invoiceData.date || invoiceData.createdAt).toLocaleDateString()}`, 400, 90, { align: 'right' });

    doc.moveDown(2);
    doc.fontSize(12).text("Billed To:", 50, 140);
    doc.fontSize(10).text(invoiceData.customerName || 'Cash Customer', 50, 155);

    const tableTop = 185;
    doc.lineWidth(1);
    doc.strokeColor('#ccc');
    doc.rect(50, tableTop, 515, 20).fillAndStroke('#f0f0f0', '#ccc');
    doc.fillColor('#333')
       .fontSize(10)
       .text('Item', 60, tableTop + 5)
       .text('Qty', 250, tableTop + 5)
       .text('Price', 300, tableTop + 5)
       .text('GST%', 370, tableTop + 5)
       .text('GST Amt', 420, tableTop + 5)
       .text('Total', 490, tableTop + 5);

    let y = tableTop + 20;
    invoiceData.items.forEach(item => {
      doc.rect(50, y, 515, 20).stroke();
      doc.fillColor('#333')
         .fontSize(10)
         .text(item.productName || 'N/A', 60, y + 5)
         .text(item.quantity, 250, y + 5)
         .text(item.price.toFixed(2), 300, y + 5)
         .text(item.gstRate ? `${item.gstRate}%` : '0%', 370, y + 5)
         .text((item.gstAmount || 0).toFixed(2), 420, y + 5)
         .text(item.total.toFixed(2), 490, y + 5);
      y += 20;
    });

    doc.moveDown(1);
    doc.fillColor('#333')
       .fontSize(12)
       .text(`Subtotal: ₹${invoiceData.total.toFixed(2)}`, { align: 'right' })
       .text(`Tax: ₹${invoiceData.tax.toFixed(2)}`, { align: 'right' });
    if (invoiceData.discount || invoiceData.discountAmount) doc.text(`Discount: -₹${(invoiceData.discount || invoiceData.discountAmount).toFixed(2)}`, { align: 'right' });
    if (invoiceData.freightCharges) doc.text(`Freight: +₹${invoiceData.freightCharges.toFixed(2)}`, { align: 'right' });
    doc.fillColor(themeColor)
       .fontSize(15)
       .text(`Grand Total: ₹${invoiceData.finalAmount.toFixed(2)}`, { align: 'right' })
       .moveDown(1);
  }

  // --- DYNAMIC UPI PAYMENT QR CODE ---
  try {
    const upiId = companyData.upiId || 'vyaparbook.in@gmail.com';
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(companyData.name || 'Ganesh Hardware')}&am=${invoiceData.finalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Bill #${invoiceData.billNumber}`)}`;
    const qrBuffer = await QRCode.toBuffer(upiUrl, { width: 90, margin: 1 });
    const qrY = doc.page.height - 150;
    doc.image(qrBuffer, 50, qrY, { width: 75 });
    doc.fontSize(8).fillColor('#475569').text('Scan to Pay via UPI (GPay/PhonePe/Paytm)', 50, qrY + 80);
  } catch (qrErr) {
    console.warn('QR Code generation notice:', qrErr.message);
  }

  // --- Footer ---
  doc.fillColor('#666')
     .fontSize(9)
     .text('Thank you for your business! This is a computer-generated invoice.', 50, doc.page.height - 40, { align: 'center' });

  doc.end();
};