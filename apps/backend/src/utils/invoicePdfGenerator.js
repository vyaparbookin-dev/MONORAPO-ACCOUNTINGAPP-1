import PDFDocument from 'pdfkit';

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
    doc.fillColor('#000').fontSize(12).text(`Total: ₹${invoiceData.finalAmount.toFixed(2)}`, { align: 'right' }).moveDown(2);

  } else {
    // --- CLASSIC TEMPLATE (Default) ---
  doc.fillColor(themeColor)
     .fontSize(24)
     .text(companyData.name, { align: 'center' })
     .moveDown(0.5);

  doc.fillColor('#333')
     .fontSize(12)
     .text(companyData.address, { align: 'center' })
     .text(`GSTIN: ${companyData.gstNumber || 'N/A'}`, { align: 'center' })
     .moveDown(1);

  // --- Invoice Title ---
  doc.fillColor(themeColor)
     .fontSize(20)
     .text(`TAX INVOICE`, { align: 'center' })
     .moveDown(1);

  // --- Invoice Details (Left: Customer, Right: Invoice Info) ---
  doc.fillColor('#333')
     .fontSize(10)
     .text(`Bill No: ${invoiceData.billNumber}`, 50, doc.y)
     .text(`Date: ${new Date(invoiceData.date || invoiceData.createdAt).toLocaleDateString()}`, 400, doc.y)
     .moveDown(0.5);

  doc.text(`Customer: ${invoiceData.customerName}`, 50, doc.y)
     .text(`Due Date: ${invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString() : 'N/A'}`, 400, doc.y)
     .moveDown(1);

  // Customer Address (if available)
  if (invoiceData.partyId && invoiceData.partyId.address) {
    doc.text(`Address: ${invoiceData.partyId.address}`, 50, doc.y)
       .moveDown(1);
  }

  // --- Items Table Header ---
  const tableTop = doc.y;
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

  // --- Items Table Rows ---
  let y = tableTop + 20;
  invoiceData.items.forEach(item => {
    doc.rect(50, y, 515, 20).stroke();
    doc.fillColor('#333')
       .fontSize(10)
       .text(item.productName || 'N/A', 60, y + 5)
       .text(item.quantity, 250, y + 5)
       .text(item.price.toFixed(2), 300, y + 5)
       .text(item.gstRate || '0%', 370, y + 5)
       .text((item.gstAmount || 0).toFixed(2), 420, y + 5)
       .text(item.total.toFixed(2), 490, y + 5);
    y += 20;
  });

  // --- Totals ---
  doc.moveDown(1);
  doc.fillColor('#333')
     .fontSize(12)
     .text(`Subtotal: ${invoiceData.total.toFixed(2)}`, { align: 'right' })
     .text(`Tax: ${invoiceData.tax.toFixed(2)}`, { align: 'right' })
     .fillColor(themeColor)
     .fontSize(14)
     .text(`Grand Total: ₹${invoiceData.finalAmount.toFixed(2)}`, { align: 'right' })
     .moveDown(2);
  }

  // --- Footer ---
  doc.fillColor('#666')
     .fontSize(10)
     .text('Thank you for your business!', 50, doc.page.height - 50, { align: 'center' });

  doc.end();
};