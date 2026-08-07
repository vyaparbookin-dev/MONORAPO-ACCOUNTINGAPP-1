import React, { useState, useRef } from "react";
import { Printer, FileText, AlignJustify, Type, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { dbService } from "../../services/dbService";
import { auditService } from "../../services/auditService";
import { syncQueue } from "@repo/shared";

const LaterpadPage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isRuled, setIsRuled] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const navigate = useNavigate();
  
  const handlePrint = () => {
    window.print();
  };

  // Function to save note
  const handleSave = async () => {
    if (!content.trim()) {
      alert("Please write something before saving.");
      return;
    }

    try {
      const newId = crypto.randomUUID ? crypto.randomUUID() : `NOTE-${Date.now()}`;
      const payload = { _id: newId, uuid: newId, title, content, date };

      // Save locally
      if (dbService.saveNote) await dbService.saveNote(payload);
      await auditService.logAction('CREATE', 'note', null, payload);
      
      // Queue for sync
      await syncQueue.enqueue({ entityId: newId, entity: 'note', method: "POST", url: "/api/laterpad", data: payload });

      alert("Note Saved Offline Successfully!");
      navigate("/laterpad/list"); // Redirect to list page
    } catch (error) {
      console.error("Failed to save note:", error);
      alert("Failed to save note. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 print:p-0 print:space-y-0">
      {/* Toolbar - Hidden while printing */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laterpad</h1>
          <p className="text-sm text-gray-500">Create Quotations, Notes & Letters</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsRuled(!isRuled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
              isRuled ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-300 text-gray-700"
            }`}
          >
            {isRuled ? <AlignJustify size={18} /> : <FileText size={18} />}
            {isRuled ? "Ruled Paper" : "Plain Paper"}
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <Save size={18} />
            Save
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Printer size={18} />
            Print
          </button>
        </div>
      </div>

      {/* Paper Area */}
      <div className="bg-white shadow-lg border border-gray-200 min-h-[800px] p-8 md:p-12 print:shadow-none print:border-none print:p-0 relative">
        {/* Header Section */}
        <div className="flex justify-between items-end border-b-2 border-gray-800 pb-4 mb-6">
          <div className="w-2/3">
            <input
              type="text"
              placeholder="Title / Subject (e.g., Quotation)"
              className="text-3xl font-bold text-gray-900 w-full outline-none placeholder-gray-300 bg-transparent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="text-right">
            <input
              type="date"
              className="text-gray-600 outline-none bg-transparent text-right"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* Content Area */}
        <textarea
          className={`w-full h-[600px] outline-none resize-none text-lg text-gray-800 bg-transparent ${
            isRuled ? "ruled-lines" : ""
          }`}
          placeholder="Start writing here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            lineHeight: "2rem",
            backgroundImage: isRuled
              ? "linear-gradient(transparent 95%, #e5e7eb 95%)"
              : "none",
            backgroundSize: "100% 2rem",
            backgroundAttachment: "local",
          }}
        ></textarea>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between text-sm text-gray-500 print:mt-12">
          <p>Generated via Red Accounting</p>
          <p>Authorized Signature</p>
        </div>
      </div>
    </div>
  );
};

export default LaterpadPage;
