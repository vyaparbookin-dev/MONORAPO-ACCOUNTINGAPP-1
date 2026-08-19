export const uploadFile = (file) => {
  // placeholder logic, integrate multer/s3 later
  return { filename: file?.name || 'file', path: `/uploads/${file?.name || 'file'}` };
};