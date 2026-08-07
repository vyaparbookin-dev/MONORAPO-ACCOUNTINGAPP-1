export const compressImage = async (file, maxWidth = 800) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.7);
      };
    };
    reader.readAsDataURL(file);
  });
};

export const previewImage = (file, elementId) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById(elementId).src = e.target.result;
  };
  reader.readAsDataURL(file);
};