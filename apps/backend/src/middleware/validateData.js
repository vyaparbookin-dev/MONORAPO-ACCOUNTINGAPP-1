export const validateRequest = (schema) => (req, res, next) => {
  try {
    // Zod schema data ko validate karega
    schema.parse(req.body);
    next(); // Agar sab sahi hai, toh aage jao (Controller ke paas)
  } catch (error) {
    // Agar galat data hai, toh yahi se error return kar do DB tak jaane hi mat do
    return res.status(400).json({
      success: false,
      message: "Data validation failed! Please check your inputs.",
      errors: error.errors // Ye exact batayega konsi field galat aayi hai
    });
  }
};