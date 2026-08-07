export default class FeatureModel {
  constructor({
    id,
    name,
    description,
    isActive = false,
    applyTo = [],
    createdAt
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.isActive = isActive;
    this.applyTo = applyTo;
    this.createdAt = createdAt;
  }
}