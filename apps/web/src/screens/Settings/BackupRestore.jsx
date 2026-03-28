import React from 'react';

const BackupRestorePage = () => {
  const handleBackup = () => {
    // Logic to handle data backup
    alert('Backing up data...');
  };

  const handleRestore = () => {
    // Logic to handle data restore
    alert('Restoring data...');
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6">Backup & Restore</h2>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Data Backup</h3>
        <p className="text-gray-600 mb-4">
          Create a backup of all your application data. Keep it in a safe place.
        </p>
        <button
          onClick={handleBackup}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Backup Now
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Data Restore</h3>
        <p className="text-gray-600 mb-4">
          Restore your application data from a backup file. This will overwrite current data.
        </p>
        <input type="file" className="mb-4" />
        <button
          onClick={handleRestore}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Restore Data
        </button>
      </div>
    </div>
  );
};

export default BackupRestorePage;
