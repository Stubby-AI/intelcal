import React, { useState, useRef, useEffect } from 'react';
import { UserCircleIcon, LogoutIcon } from './Icons';

interface ProfileDropdownProps {
  onLogout: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <UserCircleIcon className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Signed in as</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">user@example.com</p>
          </div>
          <button
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <LogoutIcon className="w-5 h-5" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
