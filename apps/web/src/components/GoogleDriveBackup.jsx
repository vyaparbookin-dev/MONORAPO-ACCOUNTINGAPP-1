import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../../services/api';

const GoogleDriveBackup = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleBackup = async (tokenResponse) => {
    setLoading(true);
    setMessage('Login successful, starting backup to Google Drive...');
    try {
      const accessToken = tokenResponse.access_token;
      const res = await api.post('/api/cloud/backup', { googleAccessToken: accessToken });

      if (res.success && res.results?.googleDrive) {
        setMessage('✅ Backup successfully uploaded to your Google Drive!');
      } else {
        setMessage(`❌ Backup failed. Server response: ${res.message || 'Unknown error'}`);
      }
    } catch (error) {
      setMessage(`❌ An error occurred during backup: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const login = useGoogleLogin({
    onSuccess: handleBackup,
    onError: () => setMessage('❌ Google Login Failed. Please try again.'),
    scope: 'https://www.googleapis.com/auth/drive.file', // Important: Permission to create files
  });

  return (
    <div className="p-6 border rounded-xl mt-8 bg-gray-50">
      <h3 className="text-xl font-bold mb-2 text-gray-800">Cloud Backup</h3>
      <p className="text-sm text-gray-600 mb-4">Create a secure backup of your data in your personal Google Drive. You will be asked to sign in and grant permission.</p>
      <button onClick={() => login()} disabled={loading} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">{loading ? 'Processing...' : 'Backup to Google Drive'}</button>
      {message && <p className="mt-4 text-sm font-medium">{message}</p>}
    </div>
  );
};

export default GoogleDriveBackup;