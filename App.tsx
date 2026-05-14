
import React, { useState, useCallback, useEffect } from 'react';
import { ExtractedData, CalendarEvent, View, ToastMessage, BookingSettings, Category, StoredDocument } from './types';
import { extractInfo } from './services/geminiService';
import useLocalStorage from './hooks/useLocalStorage';
import useNotifications from './hooks/useNotifications';
import { generateICS, generateInviteEmail } from './utils/calendar';
import { addEventToGoogleCalendar } from './services/googleCalendarService';
import { fileToBase64, base64ToFile } from './utils/fileUtils';
import { DEFAULT_CATEGORIES, COLOR_PALETTE } from './utils/categories';

import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import DocumentsView from './components/DocumentsView';
import CalendarView from './components/CalendarView';
import BookingView from './components/BookingView';
import DataStructuringView from './components/DataStructuringView';
import NavigationBar from './components/NavigationBar';
import Toast from './components/Toast';
import GoogleClientIdModal from './components/GoogleClientIdModal';
import BulkAddConfirmationModal from './components/BulkAddConfirmationModal';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // Default to true for development
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [extractionResults, setExtractionResults] = useState<ExtractedData[]>([]);
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>('calendarEvents', []);
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  
  const [googleClientId, setGoogleClientId] = useLocalStorage<string>('googleClientId', '');
  const [isClientIdModalOpen, setIsClientIdModalOpen] = useState(false);
  
  const [allCategories, setAllCategories] = useLocalStorage<Category[]>('allCategories', DEFAULT_CATEGORIES);
  const [storedDocuments, setStoredDocuments] = useLocalStorage<StoredDocument[]>('storedDocuments', []);

  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [bulkAddStats, setBulkAddStats] = useState({ added: 0, skipped: 0, remaining: 0 });
  
  const [bookingSettings, setBookingSettings] = useLocalStorage<BookingSettings>('bookingSettings', {
    availabilityRules: [],
    appointmentDuration: 30,
    bookingPageId: `user-${Math.random().toString(36).substr(2, 9)}`,
  });

  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications(events);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  // One-time migration for old string-based categories
  useEffect(() => {
    const firstItem = allCategories[0];
    if (firstItem && typeof firstItem === 'string') {
        console.log('Migrating categories to new format...');
        const migratedCategories = (allCategories as unknown as string[]).map((name, index) => ({
            name,
            color: COLOR_PALETTE[index % COLOR_PALETTE.length],
        }));
        
        DEFAULT_CATEGORIES.forEach(defaultCat => {
            if (!migratedCategories.some(mc => mc.name.toLowerCase() === defaultCat.name.toLowerCase())) {
                migratedCategories.push(defaultCat);
            }
        });
        
        setAllCategories(migratedCategories);
        showToast('Categories updated!', 'success');
    }
  }, [allCategories, setAllCategories, showToast]);


  const handleExtract = useCallback(async (files: File[], text: string) => {
    // Store uploaded files
    for (const file of files) {
        const fileContent = await fileToBase64(file);
        const newDocument: StoredDocument = {
            id: `${Date.now()}-${file.name}`,
            name: file.name,
            type: file.type,
            size: file.size,
            content: fileContent,
            uploadedAt: new Date().toISOString(),
        };
        setStoredDocuments(prev => {
            if (prev.some(doc => doc.name === newDocument.name && doc.size === newDocument.size)) {
                return prev;
            }
            return [newDocument, ...prev];
        });
    }

    const tasks: { file: File | null; text: string; sourceName: string }[] = [];
    files.forEach(file => tasks.push({ file, text: '', sourceName: file.name }));
    text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .forEach(line => tasks.push({ file: null, text: line, sourceName: `Pasted Text: "${line.substring(0, 20)}..."` }));

    if (tasks.length === 0) {
        showToast('Please provide files or text to analyze.', 'error');
        return;
    }

    setIsLoading(true);
    setExtractionResults([]);

    try {
        const extractionPromises = tasks.map(task => extractInfo(task.file, task.text));
        const extractedInfosNested = await Promise.all(extractionPromises);
        const extractedInfos = extractedInfosNested.flat();
        
        const finalResults = extractedInfos.map((info, index) => {
            const task = tasks.find(t => (info as any).originalSource === t.sourceName) || tasks[0];
            return {
                ...info,
                clientId: `${Date.now()}-${index}`,
                source: task.sourceName,
                attendees: [],
                recurring: false,
            };
        });
        setExtractionResults(finalResults);

    } catch (e) {
      console.error(e);
      showToast('Failed to extract information. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, setStoredDocuments]);

  const handleReExtract = useCallback((doc: StoredDocument) => {
    const file = base64ToFile(doc.content, doc.name, doc.type);
    handleExtract([file], '');
  }, [handleExtract]);

  const handleDeleteDocument = useCallback((docId: string) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
        setStoredDocuments(prev => prev.filter(doc => doc.id !== docId));
        showToast("Document deleted.", "success");
    }
  }, [setStoredDocuments, showToast]);
  
  const handleSaveEvent = (eventData: CalendarEvent) => {
    const isNewEvent = !eventData.id;
    const oldEvent = isNewEvent ? null : events.find(e => e.id === eventData.id);

    const updatedEvent: CalendarEvent = isNewEvent 
      ? { ...eventData, id: Date.now().toString() } 
      : eventData;
    
    const existingAttendees = oldEvent?.attendees || [];
    const newAttendees = (updatedEvent.attendees || []).filter(a => !existingAttendees.includes(a));

    if (newAttendees.length > 0) {
        if(window.confirm(`Do you want to send email invites to ${newAttendees.length} new guest(s)? This will open your default email client.`)) {
            generateInviteEmail(updatedEvent, newAttendees);
        }
    }

    if (isNewEvent) {
      setEvents(prev => [...prev, updatedEvent]);
      showToast('Event created successfully!', 'success');
    } else {
      setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
      showToast('Event updated successfully!', 'success');
    }
  };

  const handleBookAppointment = useCallback((slot: Date, bookerName: string, bookerEmail: string) => {
    const newBooking: CalendarEvent = {
        id: Date.now().toString(),
        title: `Booking: ${bookerName}`,
        start: slot.toISOString(),
        end: new Date(slot.getTime() + bookingSettings.appointmentDuration * 60 * 1000).toISOString(),
        attendees: [bookerEmail],
        summary: `Meeting booked via IntelliCal with ${bookerName} (${bookerEmail}).`,
        category: ['Meeting'],
        reminders: [30, 120], // Default 30 min and 2 hour reminders
        isAllDay: false,
    };
    setEvents(prev => [...prev, newBooking]);
    showToast(`Appointment with ${bookerName} booked successfully!`, 'success');
  }, [bookingSettings.appointmentDuration, setEvents, showToast]);

  const extractedDataToCalendarEvent = (data: ExtractedData): CalendarEvent | null => {
      if (!data.end || !data.title) {
        return null;
      }
      
      const isEndAllDay = data.end.length <= 10;
      const endDate = new Date(isEndAllDay ? `${data.end}T23:59:59` : data.end);
      if (isNaN(endDate.getTime())) {
          return null;
      }
      
      let startDate: Date;
      let isAllDay = false;

      if (data.start) {
        const parsedStart = new Date(data.start.length <= 10 ? `${data.start}T00:00:00` : data.start);
        if (!isNaN(parsedStart.getTime())) {
            startDate = parsedStart;
            // An event is all-day only if both start and end are just dates without times
            isAllDay = data.start.length <= 10 && isEndAllDay;
        } else {
          // Fallback if start date is invalid, default to 1 hour before end
          startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
        }
      } else {
        // No start date provided, it's a deadline or single-day event
        isAllDay = isEndAllDay;
        if (isAllDay) {
            startDate = new Date(endDate);
            startDate.setHours(0,0,0,0);
        } else {
            // Default duration of 1 hour for timed deadlines
            startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
        }
      }

      return {
        id: '', 
        title: data.title,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        isAllDay,
        summary: data.summary || '',
        location: data.location || '',
        eligibility: data.eligibility || '',
        source: data.source || undefined,
        attendees: data.attendees || [],
        category: data.category && data.category.length > 0 ? data.category : ['General'],
        reminders: [30], // Default 30 minute reminder
        recurring: data.recurring ? 'annually' : undefined,
      };
  }

  const handleBulkAddToCalendar = useCallback((dataItems: ExtractedData[]) => {
    let addedCount = 0;
    let skippedCount = 0;
    const newEvents: CalendarEvent[] = [];

    dataItems.forEach(data => {
        const potentialEvent = extractedDataToCalendarEvent(data);
        if (potentialEvent) {
            const isDuplicate = events.some(
                e => e.title === potentialEvent.title && e.start === potentialEvent.start
            );
            if (isDuplicate) {
                skippedCount++;
            } else {
                newEvents.push({ ...potentialEvent, id: `${Date.now()}-${addedCount}` });
                addedCount++;
            }
        }
    });
    
    if (addedCount > 0) {
        setEvents(prev => [...prev, ...newEvents]);
    }
    
    const processedClientIds = new Set(dataItems.map(item => item.clientId!));
    const remainingResults = extractionResults.filter(r => !processedClientIds.has(r.clientId!));
    setExtractionResults(remainingResults);

    setBulkAddStats({
        added: addedCount,
        skipped: skippedCount,
        remaining: remainingResults.length
    });
    setIsBulkAddModalOpen(true);

  }, [events, setEvents, extractionResults]);

  const handleNavigateAndClear = () => {
    setExtractionResults([]);
    setCurrentView(View.CALENDAR);
    setIsBulkAddModalOpen(false);
  };


  const addEventToCalendar = useCallback((data: ExtractedData) => {
    const newEvent = extractedDataToCalendarEvent(data);
    if (newEvent) {
        const isDuplicate = events.some(
            e => e.title === newEvent.title && e.start === newEvent.start
        );
        if (isDuplicate) {
            showToast("This event already exists in your calendar.", 'error');
            return;
        }
        // Save event, which will assign an ID and show a success toast.
        handleSaveEvent(newEvent);
        // Remove just the added event from the results list.
        setExtractionResults(prev => prev.filter(r => r.clientId !== data.clientId));
    } else {
        showToast("Cannot add to calendar. Title and end date are required.", 'error');
    }
  }, [events, showToast, handleSaveEvent]);

  const handleBulkExportToICS = useCallback((dataItems: ExtractedData[]) => {
    let exportedCount = 0;
    dataItems.forEach(data => {
        const event = extractedDataToCalendarEvent(data);
        if (event) {
            try {
                generateICS({ ...event, id: `${Date.now()}-${exportedCount}`});
                exportedCount++;
            } catch(e) {
                // error generating one of them, continue
            }
        }
    });
     if (exportedCount > 0) {
        showToast(`${exportedCount} ICS file(s) exported successfully!`, 'success');
    } else {
        showToast('No valid events to export.', 'error');
    }
  }, [showToast]);

  const handleAddToGoogleCalendar = async (eventData: CalendarEvent | ExtractedData) => {
    if (!isGoogleCalendarConnected) {
        showToast('Please connect your Google Calendar first.', 'error');
        return;
    }

    showToast('Adding to Google Calendar...', 'success');
    try {
        let event: CalendarEvent;
        if ('clientId' in eventData || 'source' in eventData) { // It's ExtractedData
            const potentialEvent = extractedDataToCalendarEvent(eventData as ExtractedData);
            if (!potentialEvent) throw new Error("Could not convert data to a valid event.");
            event = potentialEvent;
        } else {
            event = eventData as CalendarEvent;
        }
        
        event.id = event.id || Date.now().toString();
      
        const googleEvent = await addEventToGoogleCalendar(event);
        showToast('Event added to Google Calendar!', 'success');
        
        const isExistingEvent = events.some(e => e.id === event.id);

        if (isExistingEvent) {
            setEvents(prev => prev.map(e => e.id === event.id ? { ...e, googleEventId: googleEvent.id } : e));
        } else {
            const newLocalEvent: CalendarEvent = { ...event, googleEventId: googleEvent.id };
            setEvents(prev => [...prev, newLocalEvent]);
        }

    } catch (error: any) {
        console.error(error);
        showToast(error.message || 'Failed to add to Google Calendar.', 'error');
    }
  };

  const handleBulkAddToGoogleCalendar = async (dataItems: ExtractedData[]) => {
      let addedCount = 0;
      let skippedCount = 0;
      showToast(`Processing ${dataItems.length} events for Google Calendar...`, 'success');
      for (const data of dataItems) {
          const potentialEvent = extractedDataToCalendarEvent(data);
          if (potentialEvent) {
              const isDuplicate = events.some(e => e.title === potentialEvent.title && e.start === potentialEvent.start);
              if (isDuplicate) {
                  skippedCount++;
                  continue;
              }
          }
          try {
              await handleAddToGoogleCalendar(data);
              addedCount++;
          } catch(e) {
              console.error(`Failed to add item to Google Calendar: ${data.title}`, e);
          }
      }
      
      let message = '';
      if(addedCount > 0) message += `${addedCount} event(s) added. `;
      if(skippedCount > 0) message += `${skippedCount} duplicate(s) skipped.`;
      if(message === '') message = 'No new events to add.';

      showToast(message, addedCount > 0 ? 'success' : 'error');

      if (addedCount > 0) {
        setExtractionResults([]); // Auto-clear results
      }
  }

  const handleAddCategory = useCallback((newCategory: Category) => {
    if (allCategories.some(c => c.name.toLowerCase() === newCategory.name.toLowerCase())) {
        showToast(`Category '${newCategory.name}' already exists.`, 'error');
        return;
    }
    setAllCategories(prev => [...prev, newCategory]);
    showToast('Category added!', 'success');
  }, [allCategories, setAllCategories, showToast]);

  const handleUpdateCategory = useCallback((oldName: string, newCategory: Category) => {
    if (oldName.toLowerCase() !== newCategory.name.toLowerCase() && allCategories.some(c => c.name.toLowerCase() === newCategory.name.toLowerCase())) {
        showToast(`Category name '${newCategory.name}' is already in use.`, 'error');
        return;
    }
    setAllCategories(prev => prev.map(c => c.name.toLowerCase() === oldName.toLowerCase() ? newCategory : c));
    setEvents(prev => prev.map(e => {
        if (e.category?.some(c => c.toLowerCase() === oldName.toLowerCase())) {
            return {
                ...e,
                category: e.category.map(c => c.toLowerCase() === oldName.toLowerCase() ? newCategory.name : c)
            };
        }
        return e;
    }));
    showToast('Category updated!', 'success');
  }, [allCategories, setAllCategories, setEvents, showToast]);

  const handleDeleteCategory = useCallback((nameToDelete: string) => {
    const isDefault = DEFAULT_CATEGORIES.some(c => c.name.toLowerCase() === nameToDelete.toLowerCase());
    if (isDefault) {
        showToast(`Cannot delete the default category '${nameToDelete}'.`, 'error');
        return;
    }
    setAllCategories(prev => prev.filter(c => c.name.toLowerCase() !== nameToDelete.toLowerCase()));
    setEvents(prev => prev.map(e => {
        if (e.category?.some(c => c.toLowerCase() === nameToDelete.toLowerCase())) {
            const newCategories = e.category.filter(c => c.toLowerCase() !== nameToDelete.toLowerCase());
            return { ...e, category: newCategories.length > 0 ? newCategories : ['General'] };
        }
        return e;
    }));
    showToast(`Category '${nameToDelete}' deleted. Associated events moved to 'General'.`, 'success');
  }, [setAllCategories, setEvents, showToast]);
  
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentView(View.DASHBOARD);
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {isClientIdModalOpen && (
        <GoogleClientIdModal
          onSave={setGoogleClientId}
          onClose={() => setIsClientIdModalOpen(false)}
        />
      )}
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
      <Header 
        onLogout={handleLogout}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead} 
        onGoogleAuthChange={setIsGoogleCalendarConnected}
        googleClientId={googleClientId}
        onConfigureGoogle={() => setIsClientIdModalOpen(true)}
      />
      <main className="p-4 mx-auto max-w-4xl pb-24">
        {currentView === View.DASHBOARD && <DashboardView events={events} allCategories={allCategories} />}
        {currentView === View.DOCUMENTS && (
          <DocumentsView
            onExtract={handleExtract}
            isLoading={isLoading}
            extractionResults={extractionResults}
            onAddToCalendar={addEventToCalendar}
            onBulkAddToCalendar={handleBulkAddToCalendar}
            onBulkExportToICS={handleBulkExportToICS}
            isGoogleCalendarConnected={isGoogleCalendarConnected}
            onAddToGoogleCalendar={handleAddToGoogleCalendar}
            onBulkAddToGoogleCalendar={handleBulkAddToGoogleCalendar}
            allCategories={allCategories}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            storedDocuments={storedDocuments}
            onDeleteDocument={handleDeleteDocument}
            onReExtract={handleReExtract}
          />
        )}
        {currentView === View.CALENDAR && 
            <CalendarView 
                events={events} 
                setEvents={setEvents} 
                showToast={showToast}
                isGoogleCalendarConnected={isGoogleCalendarConnected}
                onAddToGoogleCalendar={handleAddToGoogleCalendar}
                onSaveEvent={handleSaveEvent}
                allCategories={allCategories}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
            />
        }
        {currentView === View.BOOKING &&
            <BookingView
                settings={bookingSettings}
                onSettingsChange={setBookingSettings}
                events={events}
                onBookAppointment={handleBookAppointment}
                showToast={showToast}
            />
        }
        {currentView === View.DATA_STRUCTURING &&
            <DataStructuringView showToast={showToast} />
        }
      </main>
      {isBulkAddModalOpen && (
        <BulkAddConfirmationModal
            isOpen={isBulkAddModalOpen}
            onClose={() => setIsBulkAddModalOpen(false)}
            onNavigate={handleNavigateAndClear}
            stats={bulkAddStats}
        />
      )}
      <NavigationBar currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
};

export default App;