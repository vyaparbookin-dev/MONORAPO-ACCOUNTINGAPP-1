import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
        <p>&copy; {new Date().getFullYear()} Vyapar Accounting Software. All rights reserved.</p>
      </div>
    </footer>
  );
}