
import React, { useState, useEffect, useCallback } from 'react';
import { CalendarEvent, Category } from '../types';
import { TrashIcon, GoogleIcon } from './Icons';
import AttendeesInput from './AttendeesInput';
import CategorySelector from './CategorySelector';
import { COLOR_PALETTE } from '../utils/categories';

interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  isGoogleCalendarConnected: boolean;
  onAddToGoogleCalendar: (event: CalendarEvent) => Promise<void>;
  allCategories: Category[];
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (oldName: string, category: Category) => void;
}

const REMINDER_OPTIONS = [
    { value: 30, label: '30 minutes before' },
    { value: 120, label: '2 hours before' },
    { value: 360, label: '6 hours before' },
    { value: 720, label: '12 hours before' },
];

const EventModal: React.FC<EventModalProps> = (props) => {
  const { event, onClose, onSave, onDelete, showToast, isGoogleCalendarConnected, onAddToGoogleCalendar, allCategories, onAddCategory } = props;

  const [title, setTitle] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [summary, setSummary] = useState('');
  const [location, setLocation] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState<string[]>(['General']);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [reminders, setReminders] = useState<number[]>([]);
  const [recurring, setRecurring] = useState<CalendarEvent['recurring']>();
  
  const [fullEvent, setFullEvent] = useState<CalendarEvent | null>(event);

  const formatToInput = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
  };

  useEffect(() => {
    if (event) {
      setFullEvent(event);
      setTitle(event.title);
      setAttendees(event.attendees || []);
      setSummary(event.summary || '');
      setLocation(event.location || '');
      setEligibility(event.eligibility || '');
      setSource(event.source || 'Manually Added');
      setCategory(event.category || ['General']);
      setReminders(event.reminders || []);
      setRecurring(event.recurring);
      setIsAllDay(event.isAllDay || false);
      
      const start = new Date(event.start);
      const end = new Date(event.end);

      const { date: startDateStr, time: startTimeStr } = formatToInput(start);
      const { date: endDateStr, time: endTimeStr } = formatToInput(end);

      setStartDate(startDateStr);
      setStartTime(startTimeStr);
      setEndDate(endDateStr);
      setEndTime(endTimeStr);
    }
  }, [event]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    if (newStartDate > endDate) {
        setEndDate(newStartDate);
    }
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = e.target.value;
    setStartTime(newStartTime);
    const startDateTime = new Date(`${startDate}T${newStartTime}`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Default 1 hour duration
    const { date, time } = formatToInput(endDateTime);
    setEndDate(date);
    setEndTime(time);
  };

  const handleCategoryChange = (categoryNames: string[], newCategoryData?: {name: string, color: string}) => {
    setCategory(categoryNames);
    if (newCategoryData) {
        onAddCategory(newCategoryData);
    }
  }

  const handleReminderChange = (value: number) => {
    setReminders(prev => 
      prev.includes(value)
        ? prev.filter(r => r !== value)
        : [...prev, value].sort((a,b) => a-b)
    );
  };
  
  const getCurrentEventFromState = useCallback((): CalendarEvent => {
    let startDateTime, endDateTime;

    if (isAllDay) {
        startDateTime = new Date(`${startDate}T00:00:00`);
        endDateTime = new Date(`${startDate}T23:59:59`);
    } else {
        startDateTime = new Date(`${startDate}T${startTime}`);
        endDateTime = new Date(`${endDate}T${endTime}`);
    }

    return {
      ...(fullEvent as CalendarEvent),
      id: event?.id || '',
      title,
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      isAllDay,
      attendees,
      summary,
      location,
      eligibility,
      source,
      category,
      reminders,
      recurring,
    };
  }, [isAllDay, startDate, startTime, endDate, endTime, fullEvent, event?.id, title, attendees, summary, location, eligibility, source, category, reminders, recurring]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate) {
        showToast('Please fill title and start date.', 'error');
        return;
    }
    if (!isAllDay && (!startTime || !endDate || !endTime)) {
        showToast('Please fill out all time fields.', 'error');
        return;
    }
    const currentEvent = getCurrentEventFromState();
    if (new Date(currentEvent.end) < new Date(currentEvent.start)) {
        showToast('End time cannot be before start time.', 'error');
        return;
    }
    onSave(currentEvent);
  };

  const handleDelete = () => {
    if (event?.id) {
        onDelete(event.id);
    }
  }
  
  const handleGoogleCalendarClick = async () => {
    if (!title || !startDate) {
        showToast('Please set a title and date before adding.', 'error');
        return;
    }
    const currentEvent = getCurrentEventFromState();
    await onAddToGoogleCalendar(currentEvent);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-bold">{event?.id ? 'Edit Event' : 'Create Event'}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                 <CategorySelector
                    selected={category}
                    onChange={handleCategoryChange}
                    allCategories={allCategories}
                  />
              </div>
            </div>
            
            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="all-day"
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="all-day" className="ml-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    All-day event
                </label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Start Date</label>
                    <input type="date" id="start-date" value={startDate} onChange={handleStartDateChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                {!isAllDay && (
                    <div>
                        <label htmlFor="start-time" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Start Time</label>
                        <input type="time" id="start-time" value={startTime} onChange={handleStartTimeChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                )}
            </div>
            {!isAllDay && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">End Date</label>
                        <input type="date" id="end-date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div>
                        <label htmlFor="end-time" className="block text-sm font-medium text-slate-700 dark:text-slate-300">End Time</label>
                        <input type="time" id="end-time" value={endTime} onChange={e => setEndTime(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                </div>
            )}


            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Reminders</label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                {REMINDER_OPTIONS.map(option => (
                  <label key={option.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={reminders.includes(option.value)}
                      onChange={() => handleReminderChange(option.value)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label htmlFor="recurring" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Repeat</label>
              <select
                id="recurring"
                value={recurring || ''}
                onChange={(e) => setRecurring((e.target.value as CalendarEvent['recurring']) || undefined)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Does not repeat</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="annually">Annually</option>
              </select>
            </div>

            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Summary</label>
              <textarea id="summary" value={summary} onChange={e => setSummary(e.target.value)} rows={2} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
                <input type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
               <div>
                <label htmlFor="source" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Source</label>
                <input type="text" id="source" value={source} readOnly className="mt-1 block w-full px-3 py-2 bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm cursor-not-allowed"/>
              </div>
            </div>
             <div>
                <label htmlFor="eligibility" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Eligibility</label>
                <textarea id="eligibility" value={eligibility} onChange={e => setEligibility(e.target.value)} rows={2} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
             </div>
             <AttendeesInput attendees={attendees} setAttendees={setAttendees} />
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap justify-between items-center gap-2">
            <div>
                {event?.id && (
                    <button type="button" onClick={handleDelete} title="Delete Event" className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                )}
            </div>
            <div className="flex items-center gap-2">
                {isGoogleCalendarConnected && (
                    <button type="button" onClick={handleGoogleCalendarClick} title="Save to Google Calendar" className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                        <GoogleIcon className="w-5 h-5"/>
                    </button>
                )}
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">Cancel</button>
                <button type="submit" className="ml-3 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700">Save</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;