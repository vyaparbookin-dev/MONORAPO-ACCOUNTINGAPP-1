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
    freightCharges = 0,
    laborCharges = 0,
    packingForwardingCharges = 0,
    billType = "GST",
    status = "draft",
    dueDate,
    createdAt,
  }) {
    this.id = id;
    this.invoiceNo = invoiceNo;
    this.customerName = customerName;
    this.customerPhone = customerPhone;
    this.items = items;
    this.totalAmount = totalAmount;
    this.gstTotal = gstTotal;
    this.discount = discount;
    this.freightCharges = freightCharges;
    this.laborCharges = laborCharges;
    this.packingForwardingCharges = packingForwardingCharges;
    this.billType = billType;
    this.status = status;
    this.dueDate = dueDate;
    this.createdAt = createdAt;
  }
}