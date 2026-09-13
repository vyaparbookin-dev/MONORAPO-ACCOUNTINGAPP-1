import React from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function LanguageSwitchButton({ className = "" }) {
  const { language, setLanguage, isEnglish, isHindi } = useLanguage();

  return (
    <div
      className={`inline-flex items-center p-1 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200 transition select-none shadow-2xs ${className}`}
      title={isHindi ? "अंग्रेजी में बदलें (Switch to English)" : "Switch to Hindi (हिन्दी में बदलें)"}
    >
      <div className="flex items-center gap-1 px-1.5 text-slate-500">
        <Globe size={14} className="text-indigo-600" />
      </div>

      <div className="flex items-center gap-0.5 text-[11px] font-black">
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={`px-2 py-1 rounded-lg transition cursor-pointer ${
            isEnglish
              ? "bg-white text-indigo-700 shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          English
        </button>

        <button
          type="button"
          onClick={() => setLanguage("hi")}
          className={`px-2 py-1 rounded-lg transition cursor-pointer ${
            isHindi
              ? "bg-white text-indigo-700 shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          हिन्दी
        </button>
      </div>
    </div>
  );
}
