
import { CalendarEvent } from '../types';

// The Gemini API key is used here for the discovery service.
const API_KEY = process.env.API_KEY; 

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

// FIX: Use 'any' type for tokenClient as 'google' namespace is not available at compile time.
let tokenClient: any = null;
declare var gapi: any;
declare var google: any;

export const initGoogleClient = (
    clientId: string,
    onSuccess: (tokenResponse: any) => void, 
    onError: () => void,
    onSignOut: () => void
) => {
    gapi.load('client', async () => {
        if (!API_KEY) {
            console.error("API_KEY is not set. Cannot initialize Google API client.");
            onError();
            return;
        }
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
        });

        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPES,
            callback: (tokenResponse: any) => {
              if (tokenResponse && tokenResponse.access_token) {
                onSuccess(tokenResponse);
              } else {
                console.error('Google Auth Error: No access token received.', tokenResponse);
                onError();
              }
            },
        });
    });
};

export const handleAuthClick = () => {
  if (gapi.client.getToken() === null) {
      tokenClient?.requestAccessToken({ prompt: 'consent' });
  } else {
      tokenClient?.requestAccessToken({ prompt: '' });
  }
};

export const handleSignoutClick = (onSignOut: () => void) => {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken(null);
            onSignOut();
        });
    } else {
        onSignOut();
    }
};

export const addEventToGoogleCalendar = async (event: CalendarEvent): Promise<any> => {
  if (!gapi.client.getToken()) {
    throw new Error("User not authenticated with Google.");
  }

  const reminderOverrides = (event.reminders || []).map(minutes => ({
      method: 'popup',
      minutes
  }));

  let recurrenceRule: string[] | undefined = undefined;
  switch (event.recurring) {
      case 'weekly':
          recurrenceRule = ['RRULE:FREQ=WEEKLY'];
          break;
      case 'monthly':
          recurrenceRule = ['RRULE:FREQ=MONTHLY'];
          break;
      case 'annually':
          recurrenceRule = ['RRULE:FREQ=YEARLY'];
          break;
  }

  const googleEvent = {
    'summary': event.title,
    'location': event.location || '',
    'description': `Summary: ${event.summary || ''}\nEligibility: ${event.eligibility || ''}`,
    'start': {
      'dateTime': event.start,
      'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    'end': {
      'dateTime': event.end,
      'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    'attendees': event.attendees?.map(email => ({ 'email': email })) || [],
    'reminders': {
      'useDefault': false,
      'overrides': reminderOverrides.length > 0 ? reminderOverrides : [
        { 'method': 'popup', 'minutes': 30 }, // Default reminder if none are set
      ],
    },
    'recurrence': recurrenceRule,
  };

  try {
    const request = gapi.client.calendar.events.insert({
      'calendarId': 'primary',
      'resource': googleEvent,
      'sendNotifications': true, // This sends invites to attendees
    });

    const response = await request;
    console.log('Event created in Google Calendar: ', response.result);
    return response.result;
  } catch (err: any) {
    console.error('Error adding event to Google Calendar:', err);
    const errorMessage = err.result?.error?.message || err.message || 'An unknown error occurred.';
    // Check for common configuration error
    if (errorMessage.includes("API key not valid")) {
      throw new Error("The provided API_KEY is not valid for Google Calendar API. Please check your Google Cloud Console setup.");
    }
    throw new Error('Failed to add event: ' + errorMessage);
  }
};