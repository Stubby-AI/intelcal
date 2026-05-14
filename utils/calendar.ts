
import { CalendarEvent } from '../types';

// Function to format date for ICS file (YYYYMMDDTHHMMSSZ)
const toICSDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

export const generateICS = (event: CalendarEvent) => {
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  
  let description = '';
  if(event.summary) description += `Summary: ${event.summary}\\n\\n`;
  if(event.eligibility) description += `Eligibility: ${event.eligibility}\\n\\n`;
  if(event.category) description += `Category: ${event.category}\\n\\n`;
  if(event.source) {
    description += `Source: ${event.source}\\n\\n`;
  }
  description = description.replace(/\n/g, '\\n');

  const attendeesICS = event.attendees?.map(email => 
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${email};X-NUM-GUESTS=0:mailto:${email}`
  ).join('\r\n') || '';

  const remindersICS = (event.reminders && event.reminders.length > 0)
    ? event.reminders.map(minutes => `
BEGIN:VALARM
TRIGGER:-PT${minutes}M
ACTION:DISPLAY
DESCRIPTION:Reminder
END:VALARM`).join('')
    : `
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:Reminder
END:VALARM`;

  let rruleLine = '';
  switch (event.recurring) {
    case 'weekly':
      rruleLine = 'RRULE:FREQ=WEEKLY';
      break;
    case 'monthly':
      rruleLine = 'RRULE:FREQ=MONTHLY';
      break;
    case 'annually':
      rruleLine = 'RRULE:FREQ=YEARLY';
      break;
  }

  const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//IntelliCal//Event Generator//EN
BEGIN:VEVENT
UID:${event.id}@intellical.app
DTSTAMP:${toICSDate(new Date())}
DTSTART:${toICSDate(startDate)}
DTEND:${toICSDate(endDate)}
SUMMARY:${event.title}
${rruleLine ? `${rruleLine}` : ''}
DESCRIPTION:${description}
LOCATION:${event.location || ''}
${attendeesICS}${remindersICS}
END:VEVENT
END:VCALENDAR
  `.trim().replace(/\n/g, '\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const filename = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


export const generateInviteEmail = (event: CalendarEvent, newAttendees: string[]) => {
    if (newAttendees.length === 0) return;

    const startDate = new Date(event.start);
    const subject = `Invitation: ${event.title}`;
    const body = `
You are invited to the following event:

Event: ${event.title}
Date: ${startDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Time: ${startDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
Location: ${event.location || 'Not specified'}
Category: ${event.category || 'Not specified'}

Summary:
${event.summary || 'No summary provided.'}

---
This invitation was sent from IntelliCal.
Please download the attached .ics file to add this event to your calendar.
    `.trim();

    // The .ics file must be generated and attached by the user.
    // We will trigger the download and open the mailto link.
    generateICS(event);

    const mailtoLink = `mailto:${newAttendees.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
};