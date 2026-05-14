import React from 'react';
import ProfileDropdown from './ProfileDropdown';
import NotificationBell from './NotificationBell';
import { Notification } from '../types';
import GoogleAuth from './GoogleAuth';

interface HeaderProps {
    onLogout: () => void;
    notifications: Notification[];
    unreadCount: number;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onGoogleAuthChange: (isSignedIn: boolean) => void;
    googleClientId: string;
    onConfigureGoogle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout, notifications, unreadCount, onMarkAsRead, onMarkAllAsRead, onGoogleAuthChange, googleClientId, onConfigureGoogle }) => {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-40">
      <div className="max-w-4xl mx-auto py-3 px-4 flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            IntelliCal
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm hidden sm:block">
            Dashboard & Deadline Manager
            </p>
        </div>
        <div className="flex items-center gap-4">
            <GoogleAuth 
              onAuthChange={onGoogleAuthChange} 
              clientId={googleClientId} 
              onConfigure={onConfigureGoogle} 
            />
            <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={onMarkAsRead}
                onMarkAllAsRead={onMarkAllAsRead}
            />
            <ProfileDropdown onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
};

export default Header;
