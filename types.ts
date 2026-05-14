
export interface Category {
  name: string;
  color: string; // hex color
}

export interface StoredDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // base64
  uploadedAt: string; // ISO string
}

export interface ExtractedData {
  title: string | null;
  summary: string | null;
  eligibility: string | null;
  location: string | null;
  start: string | null; // Format: YYYY-MM-DDTHH:MM:SS or YYYY-MM-DD
  end: string | null;   // Format: YYYY-MM-DDTHH:MM:SS or YYYY-MM-DD
  source: string | null; // Filename or "Pasted Text"
  category?: string[]; // e.g., "Business", "Personal", "Grant"
  attendees?: string[];
  clientId?: string; // a temporary ID for UI management
  recurring?: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO 8601 format
  end: string;   // ISO 8601 format
  isAllDay?: boolean;
  summary?: string;
  location?: string;
  eligibility?: string;
  source?: string;
  category?: string[];
  attendees?: string[];
  googleEventId?: string; // To store the event ID from Google Calendar for syncing
  reminders?: number[]; // Array of minutes before event (e.g., 30, 120)
  recurring?: 'annually' | 'monthly' | 'weekly';
}

export enum View {
  DASHBOARD = 'dashboard',
  DOCUMENTS = 'documents',
  CALENDAR = 'calendar',
  BOOKING = 'booking',
  DATA_STRUCTURING = 'data_structuring',
}

export interface ToastMessage {
    message: string;
    type: 'success' | 'error';
}

export interface Notification {
  id: string;
  eventId?: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface AvailabilityRule {
  dayOfWeek: number; // 0 for Sunday, 1 for Monday, etc.
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

export interface BookingSettings {
  availabilityRules: AvailabilityRule[];
  appointmentDuration: number; // in minutes
  bookingPageId: string; // a unique ID for the booking page link
}