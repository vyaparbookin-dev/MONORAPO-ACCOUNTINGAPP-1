export const uploadFile = (file) => {
  // placeholder logic, integrate multer/s3 later
  return { filename: file.name, path: /uploads/${file.name} };
};