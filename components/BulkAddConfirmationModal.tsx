
import React from 'react';

interface BulkAddConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: () => void;
    stats: {
        added: number;
        skipped: number;
        remaining: number;
    };
}

const BulkAddConfirmationModal: React.FC<BulkAddConfirmationModalProps> = ({ isOpen, onClose, onNavigate, stats }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-bold">Bulk Add Complete</h3>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-slate-700 dark:text-slate-300">
                        {stats.added > 0 ? `Successfully added ${stats.added} event(s).` : 'No new events were added.'}
                        {stats.skipped > 0 && ` Skipped ${stats.skipped} duplicate event(s).`}
                    </p>
                    {stats.remaining > 0 && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 text-amber-800 dark:text-amber-200 text-sm">
                            <p className="font-semibold">There are {stats.remaining} item(s) remaining in the results list.</p>
                            <p>Navigating to the calendar will discard these remaining items.</p>
                        </div>
                    )}
                    <p className="text-slate-700 dark:text-slate-300">What would you like to do next?</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">
                        Continue Adding
                    </button>
                    <button onClick={onNavigate} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700">
                        Go to Calendar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkAddConfirmationModal;
