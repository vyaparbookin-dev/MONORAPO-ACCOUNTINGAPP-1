export default class ConsolidatedCreditStatementModel {
  constructor({
    id,
    statementNumber,
    companyId,
    partyId,
    customerName,
    date,
    bills, // Array of Bill IDs
    totalAmount,
    status,
    notes,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.statementNumber = statementNumber;
    this.companyId = companyId;
    this.partyId = partyId;
    this.customerName = customerName;
    this.date = date;
    this.bills = bills;
    this.totalAmount = totalAmount;
    this.status = status;
    this.notes = notes;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
