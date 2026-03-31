import React from 'react';
import GoogleDriveBackup from '../../components/GoogleDriveBackup';

const BackupRestorePage = () => {

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6">Cloud Backup & Restore</h2>

      <GoogleDriveBackup />
    </div>
  );
};

export default BackupRestorePage;
