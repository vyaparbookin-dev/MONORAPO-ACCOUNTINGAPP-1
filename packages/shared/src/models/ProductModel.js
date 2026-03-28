export default class ProductModel {
  constructor({
    id,
    name,
    site,
    code,
    imageUrl,
    category,
    brand,
    hsnCode,
    purchasePrice,
    salePrice,
    minStock,
    maxStock,
    gstRate,
    hasDiscount = false,
    discount = 0,
  }) {
    this.id = id;
    this.name = name;
    this.site = site;
    this.code = code;
    this.imageUrl = imageUrl;
    this.category = category;
    this.brand = brand;
    this.hsnCode = hsnCode;
    this.purchasePrice = purchasePrice;
    this.salePrice = salePrice;
    this.minStock = minStock;
    this.maxStock = maxStock;
    this.gstRate = gstRate;
    this.hasDiscount = hasDiscount;
    this.discount = discount;
  }
}