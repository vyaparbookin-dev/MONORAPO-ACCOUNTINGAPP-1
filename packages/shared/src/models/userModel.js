export default class UserModel {
  constructor({
    id,
    name,
    email,
    phone,
    role = "admin",
    companyId,
    isActive = true,
    isVerified = false,
    createdAt,
    updatedAt
  }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.role = role;
    this.companyId = companyId;
    this.isActive = isActive;
    this.isVerified = isVerified;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}