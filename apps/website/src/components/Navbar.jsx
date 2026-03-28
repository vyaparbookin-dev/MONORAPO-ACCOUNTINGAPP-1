import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600">Vyapar</Link>
          </div>
          {/* Desktop Menu */}
          <div className="hidden sm:flex sm:space-x-8">
            <Link to="/" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md font-medium transition-colors">Home</Link>
            <Link to="/about" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md font-medium transition-colors">About Us</Link>
            <Link to="/pricing" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md font-medium transition-colors">Pricing</Link>
            <Link to="/faq" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md font-medium transition-colors">FAQ</Link>
            <Link to="/help" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md font-medium transition-colors">Help / Contact</Link>
          </div>
          {/* Mobile menu button (can be added later) */}
          <div className="sm:hidden flex items-center">
            <span className="text-sm text-gray-500">Menu</span>
          </div>
        </div>
      </div>
    </nav>
  );
}