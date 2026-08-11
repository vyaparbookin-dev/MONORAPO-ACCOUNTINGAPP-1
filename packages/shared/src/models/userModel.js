export default class UserModel {
  constructor({
    id,
    name,
    email,
    phone,
    role = "staff", // Default role is now 'staff'
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
    // Ensure role is one of the allowed values
    this.role = ['owner', 'manager', 'staff'].includes(role) ? role : 'staff';
    this.companyId = companyId;
    this.isActive = isActive;
    this.isVerified = isVerified;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}