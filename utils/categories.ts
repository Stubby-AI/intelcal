
import { Category } from '../types';

export const COLOR_PALETTE: string[] = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#84cc16', // lime-500
  '#22c55e', // green-500
  '#14b8a6', // teal-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#a855f7', // purple-500
  '#d946ef', // fuchsia-500
  '#ec4899', // pink-500
  '#78716c', // stone-500
];

export const DEFAULT_CATEGORIES: Category[] = [
    { name: 'Business', color: '#3b82f6' },
    { name: 'Personal', color: '#22c55e' },
    { name: 'Grant', color: '#eab308' },
    { name: 'Competition', color: '#a855f7' },
    { name: 'Meeting', color: '#ec4899' },
    { name: 'Deadline', color: '#ef4444' },
    { name: 'Social', color: '#14b8a6' },
    { name: 'General', color: '#78716c' },
    { name: 'Finance', color: '#84cc16' },
    { name: 'Health', color: '#d946ef' },
    { name: 'Education', color: '#f97316' },
];
