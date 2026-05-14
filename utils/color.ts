
import { Category } from '../types';

const tailwindColorMap: Record<string, { background: string; text: string }> = {
  '#ef4444': { background: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-200' },
  '#f97316': { background: 'bg-orange-100 dark:bg-orange-900/50', text: 'text-orange-800 dark:text-orange-200' },
  '#eab308': { background: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-800 dark:text-yellow-200' },
  '#84cc16': { background: 'bg-lime-100 dark:bg-lime-900/50', text: 'text-lime-800 dark:text-lime-200' },
  '#22c55e': { background: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-200' },
  '#14b8a6': { background: 'bg-teal-100 dark:bg-teal-900/50', text: 'text-teal-800 dark:text-teal-200' },
  '#06b6d4': { background: 'bg-cyan-100 dark:bg-cyan-900/50', text: 'text-cyan-800 dark:text-cyan-200' },
  '#3b82f6': { background: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-800 dark:text-blue-200' },
  '#6366f1': { background: 'bg-indigo-100 dark:bg-indigo-900/50', text: 'text-indigo-800 dark:text-indigo-200' },
  '#8b5cf6': { background: 'bg-violet-100 dark:bg-violet-900/50', text: 'text-violet-800 dark:text-violet-200' },
  '#a855f7': { background: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-800 dark:text-purple-200' },
  '#d946ef': { background: 'bg-fuchsia-100 dark:bg-fuchsia-900/50', text: 'text-fuchsia-800 dark:text-fuchsia-200' },
  '#ec4899': { background: 'bg-pink-100 dark:bg-pink-900/50', text: 'text-pink-800 dark:text-pink-200' },
  '#78716c': { background: 'bg-stone-100 dark:bg-stone-700', text: 'text-stone-800 dark:text-stone-200' },
  'default': { background: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-800 dark:text-slate-200' },
};

const getFirstCategory = (categoryNameOrNames: string | string[] | undefined | null, allCategories: Category[]): Category | undefined => {
    if (!categoryNameOrNames) {
        // Find the 'General' category as a fallback
        return allCategories.find(c => c.name.toLowerCase() === 'general');
    }
    const firstName = Array.isArray(categoryNameOrNames) ? categoryNameOrNames[0] : categoryNameOrNames;
    if (!firstName) {
        return allCategories.find(c => c.name.toLowerCase() === 'general');
    }
    return allCategories.find(c => c.name.toLowerCase() === firstName.toLowerCase());
};


/**
 * Gets the Tailwind CSS color classes for a category.
 * @param categoryNameOrNames The name of the category or an array of names.
 * @param allCategories The list of all available Category objects.
 * @returns An object with Tailwind CSS classes for background and text color.
 */
export const getCategoryColorClasses = (categoryNameOrNames: string | string[] | undefined | null, allCategories: Category[]) => {
    const category = getFirstCategory(categoryNameOrNames, allCategories);
    const colorHex = category?.color;
    return (colorHex && tailwindColorMap[colorHex]) ? tailwindColorMap[colorHex] : tailwindColorMap['default'];
};

/**
 * Gets the hex color for a category.
 * @param categoryNameOrNames The name of the category or an array of names.
 * @param allCategories The list of all available Category objects.
 * @returns A hex color code string.
 */
export const getCategoryHexColor = (categoryNameOrNames: string | string[] | undefined | null, allCategories: Category[]): string => {
    const category = getFirstCategory(categoryNameOrNames, allCategories);
    return category?.color || '#64748b'; // slate-500 as fallback
};