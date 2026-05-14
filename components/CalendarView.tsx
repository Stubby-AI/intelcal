
import React, { useState, useMemo, useCallback } from 'react';
import { CalendarEvent, Category } from '../types';
import EventModal from './EventModal';
import CategoryManagerModal from './CategoryManagerModal';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, TagIcon, SearchIcon } from './Icons';
import { getCategoryHexColor } from '../utils/color';

interface CalendarViewProps {
  events: CalendarEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  showToast: (message: string, type?: 'success' | 'error') => void;
  isGoogleCalendarConnected: boolean;
  onAddToGoogleCalendar: (event: CalendarEvent) => Promise<void>;
  onSaveEvent: (event: CalendarEvent) => void;
  allCategories: Category[];
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (oldName: string, category: Category) => void;
  onDeleteCategory: (name: string) => void;
}

type CalendarDisplayMode = 'month' | 'week' | 'day';

const toLocalDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const CalendarView: React.FC<CalendarViewProps> = (props) => {
  const { events, setEvents, showToast, isGoogleCalendarConnected, onAddToGoogleCalendar, onSaveEvent, allCategories, onAddCategory, onUpdateCategory, onDeleteCategory } = props;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<CalendarDisplayMode>('month');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = useMemo(() => {
    if (!searchQuery) {
        return events;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return events.filter(event => 
        event.title?.toLowerCase().includes(lowercasedQuery) ||
        event.summary?.toLowerCase().includes(lowercasedQuery) ||
        event.location?.toLowerCase().includes(lowercasedQuery) ||
        event.category?.join(' ').toLowerCase().includes(lowercasedQuery)
    );
  }, [events, searchQuery]);

  // --- Modal Handlers ---
  const openModalForNew = (date: Date = new Date()) => {
    const start = new Date(date);
    start.setHours(new Date().getHours() + 1, 0, 0, 0); // Default to next hour
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    setSelectedEvent({
      id: '', // Empty ID indicates a new event
      title: '',
      start: start.toISOString(),
      end: end.toISOString(),
      isAllDay: false,
      attendees: [],
      category: ['General'],
      reminders: [],
    });
    setIsEventModalOpen(true);
  };
  
  const openModalForEdit = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };
  
  const closeModal = () => {
    setIsEventModalOpen(false);
    setSelectedEvent(null);
  };

  // --- Event CRUD Handlers ---
  const handleSaveEvent = (event: CalendarEvent) => {
    onSaveEvent(event);
    closeModal();
  };
  
  const handleDeleteEvent = (eventId: string) => {
    if(window.confirm('Are you sure you want to delete this event?')) {
        setEvents(prev => prev.filter(e => e.id !== eventId));
        showToast('Event deleted.', 'success');
        closeModal();
    }
  }

  // --- Navigation Handlers ---
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));
    } else { // day
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
    } else { // day
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)));
    }
  };

  // --- Header Title Logic ---
  const getHeaderTitle = () => {
    if (viewMode === 'month') {
        return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    if (viewMode === 'week') {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  // --- Rendering Logic ---
  
  const renderMonthView = useCallback(() => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startOfMonth.getDay());
    const endDate = new Date(endOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endOfMonth.getDay()));

    const days = [];
    let day = new Date(startDate);
    while (day <= endDate) {
        days.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }
    
    const eventsByDate = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach(event => {
        const dateKey = toLocalDateKey(new Date(event.start));
        if (!eventsByDate.has(dateKey)) {
            eventsByDate.set(dateKey, []);
        }
        eventsByDate.get(dateKey)!.push(event);
    });

    return (
        <>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
            {days.map(d => {
            const dateKey = toLocalDateKey(d);
            const dayEvents = (eventsByDate.get(dateKey) || []).sort((a,b) => (a.isAllDay ? -1 : 1));
            const isToday = d.toDateString() === new Date().toDateString();
            const isCurrentMonth = d.getMonth() === currentDate.getMonth();
            return (
                <div 
                key={d.toISOString()} 
                onClick={() => isCurrentMonth && openModalForNew(d)}
                className={`relative h-20 sm:h-28 border border-slate-200 dark:border-slate-700 rounded-md p-1.5 transition-colors ${isCurrentMonth ? 'bg-white dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50' : 'bg-slate-50 dark:bg-slate-800/50'}`}
                >
                <time dateTime={dateKey} className={`text-xs font-semibold ${isToday ? 'bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center' : ''} ${!isCurrentMonth ? 'text-slate-400 dark:text-slate-500' : ''}`}>
                    {d.getDate()}
                </time>
                <div className="mt-1 space-y-1 overflow-y-auto max-h-full">
                    {dayEvents.slice(0, 2).map(event => (
                    // FIX: Merged duplicate style attributes into a single style object.
                    <div 
                        key={event.id} 
                        onClick={(e) => { e.stopPropagation(); openModalForEdit(event); }} 
                        className={`text-slate-800 dark:text-slate-200 text-[10px] sm:text-xs font-medium p-1 rounded truncate cursor-pointer hover:opacity-80 ${event.isAllDay ? '' : 'bg-slate-100 dark:bg-slate-900/50 border-l-4'}`}
                        style={{ 
                            backgroundColor: event.isAllDay ? getCategoryHexColor(event.category, allCategories) + '40' : undefined,
                            borderLeftColor: event.isAllDay ? 'transparent' : getCategoryHexColor(event.category, allCategories)
                        }}
                    >
                        {event.title}
                    </div>
                    ))}
                    {dayEvents.length > 2 && <div className="text-[10px] text-slate-500 dark:text-slate-400">+{dayEvents.length - 2} more</div>}
                </div>
                </div>
            );
            })}
        </div>
        </>
    );
  }, [currentDate, filteredEvents, allCategories, openModalForNew]);

  const renderTimeGridView = useCallback((days: Date[]) => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    const allDayEventsByDay: { [key: string]: CalendarEvent[] } = {};
    const timedEventsByDay: { [key: string]: CalendarEvent[] } = {};

    days.forEach(day => {
        const dateKey = toLocalDateKey(day);
        const dayEvents = filteredEvents
            .filter(e => toLocalDateKey(new Date(e.start)) === dateKey)
            .sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        allDayEventsByDay[dateKey] = dayEvents.filter(e => e.isAllDay);
        timedEventsByDay[dateKey] = dayEvents.filter(e => !e.isAllDay);
    });

    return (
        <div className="flex flex-col">
            <div className="flex sticky top-0 bg-white dark:bg-slate-800 z-10 border-b border-slate-200 dark:border-slate-700">
                <div className="w-14 shrink-0"></div>
                {days.map(day => (
                    <div key={day.toISOString()} className="flex-1 text-center p-2">
                        <div className="text-xs text-slate-500 dark:text-slate-400">{day.toLocaleDateString('default', { weekday: 'short' })}</div>
                        <div className={`text-lg font-semibold ${day.toDateString() === new Date().toDateString() ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>{day.getDate()}</div>
                    </div>
                ))}
            </div>
            {/* All Day Events Row */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
                <div className="w-14 shrink-0 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center"></div>
                {days.map(day => {
                    const dateKey = toLocalDateKey(day);
                    const dayAllDayEvents = allDayEventsByDay[dateKey] || [];
                    return (
                        <div key={day.toISOString()} className="flex-1 p-1 border-r border-slate-200 dark:border-slate-700 min-h-[28px]">
                            {dayAllDayEvents.map(event => (
                                <div
                                    key={event.id}
                                    onClick={() => openModalForEdit(event)}
                                    className="p-1 rounded text-white text-xs overflow-hidden cursor-pointer mb-1"
                                    style={{ backgroundColor: getCategoryHexColor(event.category, allCategories) }}
                                >
                                    <p className="font-semibold truncate">{event.title}</p>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>

            <div className="flex overflow-y-auto" style={{ maxHeight: '60vh' }}>
                <div className="w-14 shrink-0 text-right">
                    {hours.map(hour => (
                        <div key={hour} className="h-12 flex justify-end pr-2 border-r border-slate-200 dark:border-slate-700">
                           <span className="text-xs text-slate-400 dark:text-slate-500 -translate-y-2">{hour > 0 ? `${hour % 12 === 0 ? 12 : hour % 12} ${hour < 12 ? 'AM' : 'PM'}` : ''}</span>
                        </div>
                    ))}
                </div>
                {days.map(day => {
                    const dateKey = toLocalDateKey(day);
                    const dayTimedEvents = timedEventsByDay[dateKey] || [];
                    return (
                        <div key={day.toISOString()} className="flex-1 border-r border-slate-200 dark:border-slate-700 relative">
                            {hours.map(hour => (
                                <div key={hour} className="h-12 border-t border-slate-200 dark:border-slate-700"></div>
                            ))}
                            {dayTimedEvents.map(event => {
                                const start = new Date(event.start);
                                const end = new Date(event.end);
                                const top = (start.getHours() * 60 + start.getMinutes()) / (24*60) * 100;
                                const duration = Math.max(30, (end.getTime() - start.getTime()) / (1000 * 60)); // Min 30min height
                                const height = duration / (24*60) * 100;
                                return (
                                    <div
                                        key={event.id}
                                        onClick={() => openModalForEdit(event)}
                                        className="absolute left-1 right-1 bg-slate-100 dark:bg-slate-900/70 p-1 rounded text-slate-800 dark:text-slate-200 text-xs overflow-hidden cursor-pointer border-l-4"
                                        style={{ top: `${top}%`, height: `${height}%`, borderLeftColor: getCategoryHexColor(event.category, allCategories) }}
                                    >
                                        <p className="font-semibold truncate">{event.title}</p>
                                        <p className="opacity-70">{start.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} - {end.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</p>
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
            </div>
        </div>
    );
  }, [filteredEvents, openModalForEdit, allCategories]);

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(day.getDate() + i);
        return day;
    });
    return renderTimeGridView(weekDays);
  };
  
  const renderDayView = () => {
    return renderTimeGridView([currentDate]);
  };

  return (
    <div className="mt-6 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {getHeaderTitle()}
            </h2>
            <div className="flex items-center gap-2">
                <button onClick={handlePrev} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronLeftIcon /></button>
                <button onClick={handleNext} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronRightIcon /></button>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="w-5 h-5 text-slate-400" />
                </span>
                <input
                    type="search"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full sm:w-48 pl-10 pr-3 py-2 bg-slate-100 dark:bg-slate-700 border border-transparent rounded-md leading-5 text-slate-900 dark:text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
            </div>
            <div className="p-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-semibold">
                <button onClick={() => setViewMode('month')} className={`px-3 py-1 rounded-md transition-all ${viewMode === 'month' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}>Month</button>
                <button onClick={() => setViewMode('week')} className={`px-3 py-1 rounded-md transition-all ${viewMode === 'week' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}>Week</button>
                <button onClick={() => setViewMode('day')} className={`px-3 py-1 rounded-md transition-all ${viewMode === 'day' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}>Day</button>
            </div>
            <button onClick={() => setIsCategoryModalOpen(true)} title="Manage Categories" className="flex items-center gap-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-3 rounded-lg shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
                <TagIcon className="w-5 h-5" />
            </button>
            <button onClick={() => openModalForNew()} className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-700 transition-all">
                <PlusIcon className="w-5 h-5" />
                <span className="hidden sm:inline">New Event</span>
            </button>
        </div>
      </div>
      
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}

      {isEventModalOpen && (
        <EventModal
          event={selectedEvent}
          onClose={closeModal}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          showToast={showToast}
          isGoogleCalendarConnected={isGoogleCalendarConnected}
          onAddToGoogleCalendar={onAddToGoogleCalendar}
          allCategories={allCategories}
          onAddCategory={onAddCategory}
          onUpdateCategory={onUpdateCategory}
        />
      )}
      {isCategoryModalOpen && (
        <CategoryManagerModal
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
            allCategories={allCategories}
            onAddCategory={onAddCategory}
            onUpdateCategory={onUpdateCategory}
            onDeleteCategory={onDeleteCategory}
        />
      )}
    </div>
  );
};

export default CalendarView;
