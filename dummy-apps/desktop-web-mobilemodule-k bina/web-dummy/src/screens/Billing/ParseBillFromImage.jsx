import React, { useState } from "react";
import Tesseract from "tesseract.js";
import { Camera, RefreshCw, FileText } from "lucide-react";

export default function ParseBillFromImage() {
  const [image, setImage] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(URL.createObjectURL(e.target.files[0]));
      setText("");
    }
  };

  const handleExtract = () => {
    if (!image) return;
    setLoading(true);
    Tesseract.recognize(
      image,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(parseInt(m.progress * 100));
          }
        }
      }
    ).then(({ data: { text } }) => {
      setText(text);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Camera className="text-blue-600" /> Upload Bill Image
        </h2>
        <input type="file" onChange={handleImageChange} accept="image/*" className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
        
        {image && (
          <div className="mb-4">
            <img src={image} alt="Bill" className="w-full h-64 object-contain border rounded bg-gray-50" />
            <button
              onClick={handleExtract}
              disabled={loading}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex justify-center items-center gap-2"
            >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : <FileText size={18} />}
              {loading ? `Processing ${progress}%` : "Extract Text"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold mb-4">Extracted Data</h2>
        <textarea
          className="w-full h-80 p-3 border rounded-lg bg-gray-50 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Extracted text will appear here..."
        ></textarea>
        <p className="text-xs text-gray-500 mt-2">
          * You can edit the text manually before saving as a bill.
        </p>
      </div>
    </div>
  );
}
