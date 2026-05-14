import React, { useState, useEffect, useCallback } from 'react';
import { initGoogleClient, handleAuthClick, handleSignoutClick } from '../services/googleCalendarService';
import { GoogleIcon } from './Icons';

interface GoogleAuthProps {
  onAuthChange: (isSignedIn: boolean) => void;
  clientId: string;
  onConfigure: () => void;
}

const GoogleAuth: React.FC<GoogleAuthProps> = ({ onAuthChange, clientId, onConfigure }) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const [isClientInitialized, setIsClientInitialized] = useState(false);

  const updateSignInStatus = useCallback((signedIn: boolean) => {
    setIsSignedIn(signedIn);
    onAuthChange(signedIn);
  }, [onAuthChange]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
        if ((window as any).gapi) {
            setIsGapiLoaded(true);
        }
    };
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (isGapiLoaded && clientId && !isClientInitialized) {
      initGoogleClient(
        clientId,
        (tokenResponse) => {
          console.log('Google Auth Success:', tokenResponse);
          updateSignInStatus(true);
          setIsClientInitialized(true);
        },
        () => {
          console.error('Google Auth Error: Could not initialize client. Check your Client ID.');
          updateSignInStatus(false);
        },
        () => {
          updateSignInStatus(false);
        }
      );
    }
  }, [isGapiLoaded, clientId, updateSignInStatus, isClientInitialized]);
  
  useEffect(() => {
    setIsClientInitialized(false);
  }, [clientId]);

  const onConnectClick = () => {
    if (!clientId) {
      onConfigure();
    } else if (isClientInitialized) {
      handleAuthClick();
    } else {
      alert('Google authentication is initializing. If this persists, please check your Client ID configuration.');
    }
  };

  const onSignOut = () => {
    handleSignoutClick(() => {
      updateSignInStatus(false);
    });
  };
  
  if (isSignedIn) {
    return (
      <button onClick={onSignOut} className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-500 transition-colors">
        Disconnect Google
      </button>
    );
  }

  return (
    <button onClick={onConnectClick} className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-500 transition-colors">
      <GoogleIcon className="w-4 h-4" />
      {clientId ? 'Connect Calendar' : 'Set up Google Sync'}
    </button>
  );
};

export default GoogleAuth;
