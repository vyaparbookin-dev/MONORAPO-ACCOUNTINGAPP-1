import React from 'react';

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center py-20 px-6">
      <div className="max-w-4xl text-center space-y-8">
        
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">
          Aapka Apna <span className="text-blue-600">Vyapar Accounting</span> Software
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Billing, Inventory, aur Accounting ab hua aur bhi aasan. Apne business ko manage karein kahin se bhi - Web, Mobile, ya Desktop par!
        </p>

        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
          <a 
            href="https://app.vyapar.com" 
            target="_blank" 
            rel="noreferrer"
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-transform transform hover:scale-105"
          >
            🌐 Open Web App (PWA)
          </a>
          <a href="#" className="w-full sm:w-auto px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-bold shadow-lg transition-transform transform hover:scale-105">
            💻 Download for Windows
          </a>
          <a href="#" className="w-full sm:w-auto px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-lg transition-transform transform hover:scale-105">
            📱 Get Android App
          </a>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Offline Support ⚡</h3>
            <p className="text-gray-600">Bina internet ke bhi bill banayein, net aate hi auto-sync ho jayega.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Secure Cloud ☁️</h3>
            <p className="text-gray-600">Aapka data Google/AWS servers par 100% secure aur encrypted hai.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Multi-Platform 📱</h3>
            <p className="text-gray-600">Ek hi account se Mobile, PC aur Tablet par live data dekhein.</p>
          </div>
        </div>

      </div>
    </div>
  );
}