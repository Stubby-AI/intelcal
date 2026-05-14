import React, { useState, useMemo } from 'react';
import { BookingSettings, CalendarEvent } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';
import BookingConfirmationModal from './BookingConfirmationModal';

interface BookingPageProps {
  settings: BookingSettings;
  events: CalendarEvent[];
  onBookAppointment: (slot: Date, name: string, email: string) => void;
}

const BookingPage: React.FC<BookingPageProps> = ({ settings, events, onBookAppointment }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);

  const availableSlotsByDay = useMemo(() => {
    const slotsMap = new Map<string, Date[]>();
    if (settings.availabilityRules.length === 0) return slotsMap;

    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0,0,0,0);

    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(day.getDate() + i);
        const dayOfWeek = day.getDay();
        const dateKey = day.toISOString().split('T')[0];

        const rule = settings.availabilityRules.find(r => r.dayOfWeek === dayOfWeek);
        if (!rule) {
            slotsMap.set(dateKey, []);
            continue;
        }

        const dailySlots: Date[] = [];
        const [startHour, startMinute] = rule.startTime.split(':').map(Number);
        const [endHour, endMinute] = rule.endTime.split(':').map(Number);

        const slotTime = new Date(day);
        slotTime.setHours(startHour, startMinute, 0, 0);

        const endTime = new Date(day);
        endTime.setHours(endHour, endMinute, 0, 0);

        while (slotTime < endTime) {
            const slotEnd = new Date(slotTime.getTime() + settings.appointmentDuration * 60 * 1000);
            if (slotEnd > endTime) break;

            const isOverlapping = events.some(event => {
                const eventStart = new Date(event.start);
                const eventEnd = new Date(event.end);
                return slotTime < eventEnd && slotEnd > eventStart;
            });
            
            const isPast = slotTime < new Date();

            if (!isOverlapping && !isPast) {
                dailySlots.push(new Date(slotTime));
            }
            slotTime.setTime(slotTime.getTime() + settings.appointmentDuration * 60 * 1000);
        }
        slotsMap.set(dateKey, dailySlots);
    }
    return slotsMap;
  }, [currentDate, settings, events]);

  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(day.getDate() + i);
        return day;
    });
  }, [currentDate]);
  
  const handleConfirmBooking = (name: string, email: string) => {
    if (selectedSlot) {
        onBookAppointment(selectedSlot, name, email);
        setSelectedSlot(null);
    }
  };


  return (
    <div className="mt-4">
      {selectedSlot && (
        <BookingConfirmationModal
            slot={selectedSlot}
            onConfirm={handleConfirmBooking}
            onClose={() => setSelectedSlot(null)}
        />
      )}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex items-center gap-2">
            <button onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() - 7)))} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronLeftIcon /></button>
            <button onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() + 7)))} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronRightIcon /></button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {weekDays.map(day => {
              const dateKey = day.toISOString().split('T')[0];
              const slots = availableSlotsByDay.get(dateKey) || [];
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                  <div key={dateKey}>
                      <div className="text-center mb-2">
                          <p className="text-sm text-slate-500 dark:text-slate-400">{day.toLocaleDateString('default', { weekday: 'short' })}</p>
                          <p className={`font-semibold text-lg ${isToday ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>{day.getDate()}</p>
                      </div>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                          {slots.length > 0 ? slots.map(slot => (
                              <button
                                key={slot.toISOString()}
                                onClick={() => setSelectedSlot(slot)}
                                className="w-full text-center text-sm font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700/50 rounded-md py-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                              >
                                  {slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                              </button>
                          )) : (
                            <div className="text-center text-xs text-slate-400 dark:text-slate-500 pt-2">
                                Unavailable
                            </div>
                          )}
                      </div>
                  </div>
              )
          })}
      </div>
    </div>
  );
};

export default BookingPage;
