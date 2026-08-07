import React from 'react';
import GoogleDriveBackup from '../../components/GoogleDriveBackup';

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
      <h2 className="text-2xl font-bold mb-6">Cloud Backup & Restore</h2>

      <GoogleDriveBackup />

    </div>
  );
};

export default BackupRestorePage;
