import * as ImagePicker from "expo-image-picker";
import { api, API_ROUTES } from "@repo/shared";

export const extractTextFromImage = async (imageFile) => {
  // Ask for permission and launch camera
  const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
  
  if (permissionResult.granted === false) {
    alert("You've refused to allow this app to access your camera!");
    return null;
  }

  // If imageFile is provided, use it directly. Otherwise, launch camera.
  let assetUri = imageFile?.uri;
  if (!assetUri) {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (result.canceled) return null;
    assetUri = result.assets[0].uri;
  }

  // Prepare form data for upload
  const formData = new FormData();
  formData.append('file', {
    uri: assetUri,
    name: 'bill_image.jpg',
    type: 'image/jpeg',
  });

  try {
    // Send to backend for processing
    const response = await api.post(API_ROUTES.BILLING.PARSE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response; // Should return { items: [...], total: ... }
  } catch (error) {
    console.error("OCR Upload Failed:", error);
    throw error;
  }
};