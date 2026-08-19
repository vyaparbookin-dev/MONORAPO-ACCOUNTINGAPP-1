import { useCameraPermissions } from "expo-camera";
import { useState } from "react";

export const useBarcodeScanner = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [data, setData] = useState("");

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    setData(data);
  };

  return { 
    hasPermission: permission?.granted || false, 
    scanned, 
    data, 
    handleBarCodeScanned,
    requestPermission 
  };
};