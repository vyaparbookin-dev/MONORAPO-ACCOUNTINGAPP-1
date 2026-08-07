export const isEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const isPhoneNumber = (phone) => {
  const re = /^\d{10}$/;
  return re.test(String(phone));
};

export const isGSTNumber = (gst) => {
  const re = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return re.test(String(gst).toUpperCase());
};

// Alias for mobile app compatibility
export const validateGST = isGSTNumber;

// Example for checking mandatory fields
export const isRequired = (value) => value !== null && value !== undefined && value !== "";