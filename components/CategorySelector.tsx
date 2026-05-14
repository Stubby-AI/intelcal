
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Category } from '../types';
import { COLOR_PALETTE } from '../utils/categories';
import { getCategoryHexColor } from '../utils/color';

interface CategorySelectorProps {
    selected: string[];
    onChange: (categoryNames: string[], newCategoryData?: {name: string, color: string}) => void;
    allCategories: Category[];
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ selected, onChange, allCategories }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const filteredCategories = useMemo(() => {
        if (!filter) return allCategories;
        return allCategories.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));
    }, [allCategories, filter]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setFilter(''); 
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const handleToggleCategory = (categoryName: string) => {
        const newSelected = selected.includes(categoryName)
            ? selected.filter(c => c !== categoryName)
            : [...selected, categoryName];
        
        // Ensure 'General' is added if the list becomes empty
        if (newSelected.length === 0) {
            onChange(['General']);
        } else {
            // Remove 'General' if another category is selected
            onChange(newSelected.filter(c => c !== 'General' || newSelected.length === 1));
        }
    };

    const handleCreateCategory = () => {
        if (filter && !allCategories.some(c => c.name.toLowerCase() === filter.toLowerCase())) {
            const newCategory = {
                name: filter,
                color: COLOR_PALETTE[allCategories.length % COLOR_PALETTE.length],
            };
            const newSelected = [...selected.filter(c => c !== 'General'), filter];
            onChange(newSelected, newCategory);
            setIsOpen(false);
            setFilter('');
        }
    };
    
    const renderSelected = () => {
        if (!selected || selected.length === 0) {
            return <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Assign Category</span>;
        }
        return (
             <div className="flex items-center gap-1.5 flex-wrap">
                {selected.map(catName => (
                    <span
                        key={catName}
                        className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                            backgroundColor: getCategoryHexColor(catName, allCategories) + '20', // 20% opacity
                            color: getCategoryHexColor(catName, allCategories),
                        }}
                    >
                        {catName}
                    </span>
                ))}
            </div>
        )
    }

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 min-h-[30px]"
            >
                {renderSelected()}
            </button>

            {isOpen && (
                <div className="absolute z-10 mt-1 w-64 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="p-2">
                        <input
                            type="text"
                            autoFocus
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                            placeholder="Find or create category..."
                            className="w-full px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm"
                        />
                    </div>
                    <ul className="max-h-48 overflow-y-auto">
                        {filteredCategories.map(cat => (
                            <li key={cat.name} className="flex items-center p-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    id={`cat-${cat.name}`}
                                    checked={selected.includes(cat.name)}
                                    onChange={() => handleToggleCategory(cat.name)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor={`cat-${cat.name}`} className="ml-2 flex items-center gap-2 text-sm cursor-pointer">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                    {cat.name}
                                </label>
                            </li>
                        ))}
                    </ul>
                    {filter && !allCategories.some(c => c.name.toLowerCase() === filter.toLowerCase()) && (
                         <div className="p-2 border-t border-slate-200 dark:border-slate-600">
                            <button
                                type="button"
                                onClick={handleCreateCategory}
                                className="w-full text-sm text-left text-indigo-600 dark:text-indigo-400 font-semibold p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                            >
                                + Create "{filter}"
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CategorySelector;