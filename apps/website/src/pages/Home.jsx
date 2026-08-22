import React from 'react';

export default function Home() {
  const GITHUB_REPO = "https://github.com/vyaparbookin-dev/MONORAPO-ACCOUNTINGAPP-1";
  const WINDOWS_EXE_URL = "https://github.com/vyaparbookin-dev/MONORAPO-ACCOUNTINGAPP-1/releases/download/v1.2.0/Red.Accounting.Book.Setup.1.2.0.exe";
  const ANDROID_APK_URL = "https://github.com/vyaparbookin-dev/MONORAPO-ACCOUNTINGAPP-1/releases/download/v1.2.0/Red-Accounting-Book-v1.2.0.apk";
  const LATEST_RELEASE_URL = "https://github.com/vyaparbookin-dev/MONORAPO-ACCOUNTINGAPP-1/releases/latest";

  return (
    <div className="flex flex-col justify-center items-center py-16 px-6 bg-gradient-to-b from-blue-50/50 to-white min-h-[85vh]">
      <div className="max-w-4xl text-center space-y-8">
        
        {/* Version Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full shadow-sm">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Latest Release v1.2.0 is Live!
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
          Aapka Apna <span className="text-blue-600">Red Accounting Book</span> Software
        </h1>
        
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          GST Billing, Multi-Godown Inventory, Customer Ledger, aur Complete Accounting ab hua aur bhi aasan. Apne business ko manage karein kahin se bhi - <strong>Web, Android Mobile</strong>, ya <strong>Windows Desktop</strong> par!
        </p>

        {/* Download & Launch Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-4">
          <a 
            href="/login"
            className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            <span className="text-xl">🌐</span>
            <div className="text-left">
              <div className="text-xs text-blue-100 uppercase tracking-wide">Instant Access</div>
              <div className="text-sm font-bold">Open Web App (PWA)</div>
            </div>
          </a>

          <a 
            href={WINDOWS_EXE_URL}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            <span className="text-xl">💻</span>
            <div className="text-left">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Windows 10/11 (64-bit)</div>
              <div className="text-sm font-bold">Download Desktop App (.exe)</div>
            </div>
          </a>

          <a 
            href={ANDROID_APK_URL}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            <span className="text-xl">📱</span>
            <div className="text-left">
              <div className="text-xs text-emerald-100 uppercase tracking-wide">Android 7.0+ (APK)</div>
              <div className="text-sm font-bold">Download Android App (.apk)</div>
            </div>
          </a>
        </div>

        {/* Sub-links */}
        <div className="text-xs text-gray-500 flex justify-center items-center gap-4">
          <span>✔️ 100% Free & Open-Source</span>
          <span>•</span>
          <a href={LATEST_RELEASE_URL} target="_blank" rel="noreferrer" className="underline hover:text-blue-600">
            View all releases on GitHub
          </a>
        </div>

        {/* Features Highlights */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Offline First & Fast</h3>
            <p className="text-sm text-gray-600 leading-normal">Bina internet ke bhi bill banayein aur inventory update karein. Net aate hi data auto-sync ho jayega.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-2xl mb-3">🔒</div>
            <h3 className="text-base font-bold text-gray-900 mb-1">100% Secure & Private</h3>
            <p className="text-sm text-gray-600 leading-normal">Aapka business data fully encrypted hai. Local backup aur secure cloud sync dono ki suvidha.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-2xl mb-3">🔄</div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Real-time Multi-Device</h3>
            <p className="text-sm text-gray-600 leading-normal">Dukan par Desktop PC aur field mein Mobile se live stock aur sale reports access karein.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
