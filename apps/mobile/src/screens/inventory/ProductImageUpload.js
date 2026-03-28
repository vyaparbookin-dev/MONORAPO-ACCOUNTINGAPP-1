import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, StyleSheet, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import api from "../../services/Api"; // Assuming the path is correct
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ProductImageUpload = () => {
  const navigation = useNavigation();
  const route = useRoute(); // Get route object to access params
  const { partyId, partyName } = route.params || {}; // Destructure partyId and partyName from route.params

  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Allow user to crop/edit image
      quality: 0.7, // Reduce image quality for faster upload
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const uploadImage = async () => {
    if (!image) {
      Alert.alert("Error", "Please select an image first.");
      return;
    }

    setIsLoading(true);
    try {
      const base64Image = await FileSystem.readAsStringAsync(image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await api.post("/billing/parse-image", { image: base64Image });
      
      // Assuming the response contains parsed bill data
      console.log("Parsed Bill Data:", response.data);
      Alert.alert("Success", "Bill image parsed successfully!");
      navigation.navigate('ReviewParsedBill', { parsedItems: response.data.parsedItems, fullText: response.data.text, partyId: partyId, partyName: partyName, billImageUrl: `data:image/jpeg;base64,${base64Image}` });
    } catch (error) {
      console.error("Image upload/parse error:", error);
      Alert.alert("Error", "Failed to parse bill image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Upload Bill Image</Text>
        <Text style={styles.headerSubtitle}>Parse product details from a bill</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.selectBtn} onPress={pickImage} disabled={isLoading}>
            <Ionicons name="image-outline" size={24} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.selectBtnText}>Select Image from Gallery</Text>
          </TouchableOpacity>

          {image && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.imagePreview} resizeMode="contain" />
            </View>
          )}

          <View style={styles.uploadSection}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#4338ca" />
            ) : (
              <TouchableOpacity 
                style={[styles.uploadBtn, !image ? styles.btnDisabled : null]} 
                onPress={uploadImage} 
                disabled={!image}
              >
                <Ionicons name="scan-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.uploadBtnText}>Upload & Parse Bill</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  headerContainer: { backgroundColor: '#fff', padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6b7280', fontWeight: '500', marginTop: 2 },
  content: { padding: 15 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
  selectBtn: { flexDirection: 'row', backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  selectBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  imagePreviewContainer: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 10, backgroundColor: '#f9fafb', alignItems: 'center' },
  imagePreview: { width: "100%", height: 250, borderRadius: 8 },
  uploadSection: { marginTop: 20 },
  uploadBtn: { flexDirection: 'row', backgroundColor: '#16a34a', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  btnDisabled: { backgroundColor: '#9ca3af', shadowOpacity: 0, elevation: 0 },
  uploadBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }
});

export default ProductImageUpload;