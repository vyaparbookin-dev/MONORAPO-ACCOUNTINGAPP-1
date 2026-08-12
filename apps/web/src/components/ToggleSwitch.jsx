import React from 'react';

const ToggleSwitch = ({ isOn, handleToggle, onColor, offColor, label }) => {
  return (
    <div className="flex items-center space-x-2">
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      <label
        htmlFor="toggle-switch"
        className={`relative inline-flex items-center cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
          isOn ? (onColor || 'bg-blue-600') : (offColor || 'bg-gray-200')
        }`}
        style={{ width: '44px', height: '24px' }}
      >
        <input
          type="checkbox"
          id="toggle-switch"
          className="sr-only peer"
          checked={isOn}
          onChange={handleToggle}
        />
        <span className="w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></span>
      </label>
    </div>
  );
};

export default ToggleSwitch;