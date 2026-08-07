import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

const BarcodeScanner = ({ onScanSuccess, onScanFailure }) => {
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        setScanResult(decodedText);
        if (onScanSuccess) onScanSuccess(decodedText);
        scanner.clear();
      },
      (error) => {
        if (onScanFailure) onScanFailure(error);
      }
    );

    return () => {
      scanner.clear().catch((error) => console.error("Failed to clear scanner", error));
    };
  }, [onScanSuccess, onScanFailure]);

  return (
    <div className="p-4 bg-white rounded-lg shadow max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-2 text-center">Scan Barcode</h3>
      <div id="reader" className="w-full"></div>
      {scanResult && (
        <p className="mt-4 text-center text-green-600 font-bold">
          Scanned: {scanResult}
        </p>
      )}
    </div>
  );
};

export default BarcodeScanner;