import PDFDocument from 'pdfkit';

// Helper function to format currency
const formatCurrency = (amount) => {
  return `Rs. ${(amount || 0).toFixed(2)}`;
};

export const generateInvoicePDF = (billData, companyData, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Pipe the PDF to the response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Invoice-${billData.billNumber}.pdf"`);
  doc.pipe(res);

  // --- Header ---
  generateHeader(doc, companyData);

  // --- Customer & Invoice Info ---
  generateCustomerInformation(doc, billData);

  // --- Invoice Table ---
  generateInvoiceTable(doc, billData);

  // --- Footer ---
  generateFooter(doc);

  // Finalize the PDF and end the stream
  doc.end();
};

function generateHeader(doc, company) {
  let textLeft = 50;

  if (company?.logo) {
    try {
      // Draw logo if exists (Base64)
      doc.image(company.logo, 50, 45, { width: 50, height: 50 });
      textLeft = 115; // Shift text to the right side of the logo
    } catch (err) {
      console.error("Error drawing logo:", err.message);
    }
  }

  doc
    .fontSize(20)
    .text(company?.name || 'Your Company', textLeft, 57)
    .fontSize(10)
    .text(company?.address || '123 Main St, Your City', 200, 65, { align: 'right' })
    .text(company?.email || 'company@example.com', 200, 80, { align: 'right' })
    .moveDown();
}

function generateCustomerInformation(doc, invoice) {
  doc.fillColor("#444444").fontSize(20).text("Invoice", 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .text("Invoice Number:", 50, customerInformationTop)
    .font("Helvetica-Bold")
    .text(invoice.billNumber, 150, customerInformationTop)
    .font("Helvetica")
    .text("Invoice Date:", 50, customerInformationTop + 15)
    .text(new Date(invoice.date).toLocaleDateString(), 150, customerInformationTop + 15)
    .text("Due Date:", 50, customerInformationTop + 30)
    .text(new Date(invoice.dueDate || invoice.date).toLocaleDateString(), 150, customerInformationTop + 30)

    .font("Helvetica-Bold")
    .text(invoice.customerName, 300, customerInformationTop)
    .font("Helvetica")
    .text(invoice.customerAddress || '', 300, customerInformationTop + 15)
    .text(invoice.customerMobile || '', 300, customerInformationTop + 30)
    .moveDown();

  generateHr(doc, 252);
}

function generateInvoiceTable(doc, invoice) {
  let i = 0;
  const invoiceTableTop = 330;

  doc.font("Helvetica-Bold");
  generateTableRow(doc, invoiceTableTop, "Item", "Unit Cost", "Quantity", "Line Total");
  generateHr(doc, invoiceTableTop + 20);
  doc.font("Helvetica");

  for (i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];
    const position = invoiceTableTop + (i + 1) * 30;
    generateTableRow(doc, position, item.name, formatCurrency(item.rate || item.price), item.quantity, formatCurrency(item.total));
    generateHr(doc, position + 20);
  }

  const subtotalPosition = invoiceTableTop + (i + 1) * 30;
  generateTableRow(doc, subtotalPosition, "", "", "Subtotal", formatCurrency(invoice.totalAmount || invoice.total));

  const taxPosition = subtotalPosition + 20;
  generateTableRow(doc, taxPosition, "", "", "Tax", formatCurrency(invoice.tax));

  const duePosition = taxPosition + 25;
  doc.font("Helvetica-Bold");
  generateTableRow(doc, duePosition, "", "", "Grand Total", formatCurrency(invoice.finalAmount));
  doc.font("Helvetica");
}

function generateFooter(doc) {
  doc.fontSize(10).text("Thank you for your business.", 50, 780, { align: "center", width: 500 });
}

function generateTableRow(doc, y, item, unitCost, quantity, lineTotal) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(unitCost, 280, y, { width: 90, align: "right" })
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" });
}

function generateHr(doc, y) {
  doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
}