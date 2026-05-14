import React, { useState, KeyboardEvent } from 'react';

interface AttendeesInputProps {
  attendees: string[];
  setAttendees: (attendees: string[]) => void;
}

const isValidEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);

const AttendeesInput: React.FC<AttendeesInputProps> = ({ attendees, setAttendees }) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ',', ' '].includes(e.key)) {
      e.preventDefault();
      const newAttendee = inputValue.trim();
      if (newAttendee) {
        if (!isValidEmail(newAttendee)) {
          setError('Invalid email format.');
          return;
        }
        if (attendees.includes(newAttendee)) {
          setError('Email already added.');
          setInputValue('');
          return;
        }
        setAttendees([...attendees, newAttendee]);
        setInputValue('');
        setError('');
      }
    }
  };
  
  const handleBlur = () => {
      const newAttendee = inputValue.trim();
       if (newAttendee) {
        if (!isValidEmail(newAttendee)) {
          setError('Invalid email format.');
          return;
        }
        if (attendees.includes(newAttendee)) {
          setError('Email already added.');
          setInputValue('');
          return;
        }
        setAttendees([...attendees, newAttendee]);
        setInputValue('');
        setError('');
      }
  }

  const handleRemoveAttendee = (emailToRemove: string) => {
    setAttendees(attendees.filter(email => email !== emailToRemove));
  };
  
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const emails = pastedText.split(/[\s,;]+/).filter(Boolean);
    const validNewEmails = emails
        .map(email => email.trim())
        .filter(email => isValidEmail(email) && !attendees.includes(email));

    if (validNewEmails.length > 0) {
        setAttendees([...attendees, ...new Set(validNewEmails)]);
    }
  }

  return (
    <div>
      <label htmlFor="attendees" className="block text-sm font-semibold text-slate-600 dark:text-slate-400">Invite Guests</label>
      <div className="mt-1 flex flex-wrap items-center gap-2 p-2 bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md">
        {attendees.map(email => (
          <span key={email} className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 text-sm font-medium px-2 py-1 rounded-full">
            {email}
            <button type="button" onClick={() => handleRemoveAttendee(email)} className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100">&times;</button>
          </span>
        ))}
        <input
          id="attendees"
          type="email"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          className="flex-grow bg-transparent focus:outline-none p-1 text-sm text-slate-800 dark:text-slate-200"
          placeholder="Add email and press Enter..."
        />
      </div>
       {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default AttendeesInput;