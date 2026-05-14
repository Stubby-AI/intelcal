
import React from 'react';
import { View } from '../types';
import { ChartPieIcon, DocumentTextIcon, CalendarIcon, ShareIcon, TableIcon } from './Icons';

interface NavigationBarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const NavItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center space-y-1 w-full h-full transition-colors duration-200 ${
      isActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-500'
    }`}
    aria-current={isActive ? 'page' : undefined}
  >
    {icon}
    <span className="text-xs font-medium">{label}</span>
  </button>
);


const NavigationBar: React.FC<NavigationBarProps> = ({ currentView, setCurrentView }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg z-40">
      <div className="flex justify-around items-center h-16 max-w-4xl mx-auto">
        <NavItem
          label="Dashboard"
          icon={<ChartPieIcon className="w-6 h-6" />}
          isActive={currentView === View.DASHBOARD}
          onClick={() => setCurrentView(View.DASHBOARD)}
        />
        <NavItem
          label="Documents"
          icon={<DocumentTextIcon className="w-6 h-6" />}
          isActive={currentView === View.DOCUMENTS}
          onClick={() => setCurrentView(View.DOCUMENTS)}
        />
        <NavItem
          label="Calendar"
          icon={<CalendarIcon className="w-6 h-6" />}
          isActive={currentView === View.CALENDAR}
          onClick={() => setCurrentView(View.CALENDAR)}
        />
        <NavItem
          label="Structuring"
          icon={<TableIcon className="w-6 h-6" />}
          isActive={currentView === View.DATA_STRUCTURING}
          onClick={() => setCurrentView(View.DATA_STRUCTURING)}
        />
        <NavItem
          label="Booking"
          icon={<ShareIcon className="w-6 h-6" />}
          isActive={currentView === View.BOOKING}
          onClick={() => setCurrentView(View.BOOKING)}
        />
      </div>
    </nav>
  );
};

export default NavigationBar;