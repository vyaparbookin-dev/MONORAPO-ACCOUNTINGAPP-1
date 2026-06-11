export default class CouponModel {
  constructor({
    id,
    code,
    description,
    discountType = "percentage",
    discountValue = 0,
    validFrom,
    validTo,
    maxUsage = 0,
    createdAt
  }) {
    this.id = id;
    this.code = code;
    this.description = description;
    this.discountType = discountType;
    this.discountValue = discountValue;
    this.validFrom = validFrom;
    this.validTo = validTo;
    this.maxUsage = maxUsage;
    this.createdAt = createdAt;
  }
}