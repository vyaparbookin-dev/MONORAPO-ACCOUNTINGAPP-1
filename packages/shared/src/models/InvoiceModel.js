export default class InvoiceModel {
  constructor({
    id,
    invoiceNo,
    customerName,
    customerPhone,
    items = [],
    totalAmount = 0,
    gstTotal = 0,
    discount = 0,
    billType = "GST",
    createdAt
  }) {
    this.id = id;
    this.invoiceNo = invoiceNo;
    this.customerName = customerName;
    this.customerPhone = customerPhone;
    this.items = items;
    this.totalAmount = totalAmount;
    this.gstTotal = gstTotal;
    this.discount = discount;
    this.billType = billType;
    this.createdAt = createdAt;
  }
}