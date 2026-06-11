export default class ExpenseModel {
  constructor({
    id,
    type,
    amount = 0,
    date,
    description,
    createdBy
  }) {
    this.id = id;
    this.type = type;
    this.amount = amount;
    this.date = date;
    this.description = description;
    this.createdBy = createdBy;
  }
}