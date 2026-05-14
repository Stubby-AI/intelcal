import React from 'react';
import { BookingSettings, AvailabilityRule } from '../types';

interface AvailabilitySettingsProps {
    settings: BookingSettings;
    onSettingsChange: (newSettings: BookingSettings) => void;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AvailabilitySettings: React.FC<AvailabilitySettingsProps> = ({ settings, onSettingsChange }) => {
    
    const handleRuleChange = (dayOfWeek: number, field: keyof AvailabilityRule, value: any) => {
        const newRules = [...settings.availabilityRules];
        let rule = newRules.find(r => r.dayOfWeek === dayOfWeek);
        if (rule) {
            (rule as any)[field] = value;
        }
        onSettingsChange({ ...settings, availabilityRules: newRules });
    };

    const handleDayToggle = (dayOfWeek: number, isEnabled: boolean) => {
        let newRules = [...settings.availabilityRules];
        if (isEnabled) {
            // Add a new rule if it doesn't exist
            if (!newRules.some(r => r.dayOfWeek === dayOfWeek)) {
                newRules.push({ dayOfWeek, startTime: '09:00', endTime: '17:00' });
            }
        } else {
            // Remove the rule
            newRules = newRules.filter(r => r.dayOfWeek !== dayOfWeek);
        }
        onSettingsChange({ ...settings, availabilityRules: newRules.sort((a,b) => a.dayOfWeek - b.dayOfWeek) });
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onSettingsChange({ ...settings, appointmentDuration: parseInt(e.target.value, 10) });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Set Your Availability</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Choose the hours you’re available for meetings.</p>
            </div>
            
            <div className="space-y-4">
                {WEEKDAYS.map((day, index) => {
                    const rule = settings.availabilityRules.find(r => r.dayOfWeek === index);
                    const isEnabled = !!rule;
                    return (
                        <div key={day} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                            <div className="sm:col-span-1 flex items-center">
                                <input
                                    type="checkbox"
                                    id={`day-${index}`}
                                    checked={isEnabled}
                                    onChange={(e) => handleDayToggle(index, e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor={`day-${index}`} className="ml-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {day}
                                </label>
                            </div>
                            <div className="sm:col-span-3 flex items-center gap-2">
                                <input
                                    type="time"
                                    value={rule?.startTime || '09:00'}
                                    disabled={!isEnabled}
                                    onChange={(e) => handleRuleChange(index, 'startTime', e.target.value)}
                                    className="w-full text-sm p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50"
                                />
                                <span>-</span>
                                <input
                                    type="time"
                                    value={rule?.endTime || '17:00'}
                                    disabled={!isEnabled}
                                    onChange={(e) => handleRuleChange(index, 'endTime', e.target.value)}
                                    className="w-full text-sm p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div>
                <label htmlFor="duration" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Meeting Duration
                </label>
                <select
                    id="duration"
                    value={settings.appointmentDuration}
                    onChange={handleDurationChange}
                    className="w-full sm:w-48 text-sm p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md"
                >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                </select>
            </div>
        </div>
    );
};

export default AvailabilitySettings;
