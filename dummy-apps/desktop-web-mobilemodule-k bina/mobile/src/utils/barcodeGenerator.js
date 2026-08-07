import { BarCodeScanner } from "expo-barcode-scanner";
import { useState, useEffect } from "react";

export const useBarcodeScanner = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [data, setData] = useState("");

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    setData(data);
  };

  return { hasPermission, scanned, data, handleBarCodeScanned };
};