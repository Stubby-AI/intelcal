import React from 'react';
import { Notification } from '../types';
import { BellIcon } from './Icons';

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

// Simple time ago function
const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "just now";
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onMarkAsRead, onMarkAllAsRead }) => {
  return (
    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
        <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Notifications</h3>
            <button onClick={onMarkAllAsRead} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                Clear All
            </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
                <ul>
                {notifications.map(n => (
                    <li key={n.id} className={`p-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${!n.read ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                        onClick={() => onMarkAsRead(n.id)}
                    >
                    <div className="flex items-start gap-3">
                        {!n.read && <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0"></div>}
                        <div className="flex-1">
                            <p className="text-sm text-slate-700 dark:text-slate-300">{n.message}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{timeAgo(new Date(n.timestamp))}</p>
                        </div>
                    </div>
                    </li>
                ))}
                </ul>
            ) : (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <BellIcon className="w-10 h-10 mx-auto mb-2"/>
                    <p>No new notifications.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default NotificationDropdown;
