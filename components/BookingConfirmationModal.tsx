import React, { useState } from 'react';

interface BookingConfirmationModalProps {
  slot: Date;
  onConfirm: (name: string, email: string) => void;
  onClose: () => void;
}

const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({ slot, onConfirm, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
        setError('Name and email are required.');
        return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        setError('Please enter a valid email address.');
        return;
    }
    onConfirm(name, email);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold">Confirm Your Booking</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {slot.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Your Name</label>
              <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Your Email</label>
              <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700">Confirm Booking</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingConfirmationModal;
