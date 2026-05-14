import React, { useState } from 'react';

interface GoogleClientIdModalProps {
  onSave: (clientId: string) => void;
  onClose: () => void;
}

const GoogleClientIdModal: React.FC<GoogleClientIdModalProps> = ({ onSave, onClose }) => {
  const [clientId, setClientId] = useState('');

  const handleSave = () => {
    if (clientId.trim()) {
      onSave(clientId.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold">Configure Google Calendar</h3>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            To connect your Google Calendar, you need to provide an OAuth 2.0 Client ID.
          </p>
          <ol className="text-xs text-slate-500 dark:text-slate-500 list-decimal list-inside space-y-1">
            <li>Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">Google Cloud Console</a>.</li>
            <li>Create or select a project.</li>
            <li>Go to <strong>Credentials</strong>, click <strong>+ CREATE CREDENTIALS</strong>, and choose <strong>OAuth client ID</strong>.</li>
            <li>Select <strong>Web application</strong> as the application type.</li>
            <li>Under <strong>Authorized JavaScript origins</strong>, add your app's URL.</li>
            <li>Click <strong>Create</strong> and copy the generated Client ID.</li>
          </ol>
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Your Google Client ID
            </label>
            <input
              type="text"
              id="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="xxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
            />
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700">
            Save and Connect
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleClientIdModal;
