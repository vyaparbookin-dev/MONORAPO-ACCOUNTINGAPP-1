export const businessModules = {
  RESTAURANT: [
    "dashboard",
    "billing",
    "inventory", // For raw materials
    "recipeManagement", // Custom module
    "wastageTracking", // Custom module
    "reports",
  ],
  HOTEL: [
    "dashboard",
    "roomBooking", // Custom module
    "hallBooking", // Custom module
    "billing",
    "housekeeping", // Custom module
    "reports",
  ],
  JEWELLERY: [
    "dashboard",
    "billing", // With making charges
    "inventory", // With weight and purity
    "customerLedger",
    "reports",
  ],
  DEFAULT: ["dashboard", "billing", "inventory", "reports"],
};