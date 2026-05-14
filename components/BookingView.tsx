import React, { useState } from 'react';
import { BookingSettings, CalendarEvent } from '../types';
import AvailabilitySettings from './AvailabilitySettings';
import BookingPage from './BookingPage';

interface BookingViewProps {
  settings: BookingSettings;
  onSettingsChange: (newSettings: BookingSettings) => void;
  events: CalendarEvent[];
  onBookAppointment: (slot: Date, name: string, email: string) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

type BookingSubView = 'settings' | 'preview';

const BookingView: React.FC<BookingViewProps> = (props) => {
  const [subView, setSubView] = useState<BookingSubView>('settings');

  const handleCopyLink = () => {
    // In a real app, this would be a full URL.
    const link = `https://intellical.app/book/${props.settings.bookingPageId}`;
    navigator.clipboard.writeText(link);
    props.showToast('Booking link copied to clipboard!', 'success');
  };

  return (
    <div className="mt-6 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Booking Page</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Let others book meetings with you.</p>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={handleCopyLink} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                Copy Link
            </button>
            <div className="p-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-semibold">
                <button onClick={() => setSubView('settings')} className={`px-3 py-1 rounded-md transition-all ${subView === 'settings' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}>Settings</button>
                <button onClick={() => setSubView('preview')} className={`px-3 py-1 rounded-md transition-all ${subView === 'preview' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}>Preview Booking Page</button>
            </div>
        </div>
      </div>

      {subView === 'settings' ? (
        <AvailabilitySettings settings={props.settings} onSettingsChange={props.onSettingsChange} />
      ) : (
        <BookingPage settings={props.settings} events={props.events} onBookAppointment={props.onBookAppointment} />
      )}
    </div>
  );
};

export default BookingView;
