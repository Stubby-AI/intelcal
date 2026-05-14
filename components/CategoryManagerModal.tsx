
import React, { useState } from 'react';
import { Category } from '../types';
import { PencilIcon, TrashIcon, CheckCircleIcon } from './Icons';
import { COLOR_PALETTE, DEFAULT_CATEGORIES } from '../utils/categories';

interface CategoryManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    allCategories: Category[];
    onAddCategory: (category: Category) => void;
    onUpdateCategory: (oldName: string, category: Category) => void;
    onDeleteCategory: (name: string) => void;
}

const CategoryManagerModal: React.FC<CategoryManagerModalProps> = (props) => {
    const { isOpen, onClose, allCategories, onAddCategory, onUpdateCategory, onDeleteCategory } = props;

    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState(COLOR_PALETTE[0]);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    if (!isOpen) return null;

    const isDefaultCategory = (name: string) => DEFAULT_CATEGORIES.some(c => c.name.toLowerCase() === name.toLowerCase());

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryName.trim()) {
            onAddCategory({ name: newCategoryName.trim(), color: newCategoryColor });
            setNewCategoryName('');
            setNewCategoryColor(COLOR_PALETTE[0]);
        }
    };

    const handleStartEdit = (category: Category) => {
        if (isDefaultCategory(category.name)) return;
        setEditingCategory({ ...category });
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
    };

    const handleSaveEdit = () => {
        if (editingCategory && editingCategory.name.trim()) {
            const originalCategory = allCategories.find(c => c.color === editingCategory.color && c.name !== editingCategory.name);
            onUpdateCategory(originalCategory?.name || editingCategory.name, editingCategory);
            setEditingCategory(null);
        }
    };

    const handleDelete = (name: string) => {
        if (isDefaultCategory(name)) return;
        if (window.confirm(`Are you sure you want to delete the "${name}" category? Events using it will be moved to 'General'.`)) {
            onDeleteCategory(name);
        }
    };
    
    const handleEditNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (editingCategory) {
            setEditingCategory({ ...editingCategory, name: e.target.value });
        }
    }
    
    const handleEditColorChange = (color: string) => {
         if (editingCategory) {
            setEditingCategory({ ...editingCategory, color });
        }
    }

    const renderCategoryItem = (category: Category) => {
        const isEditing = editingCategory?.name.toLowerCase() === category.name.toLowerCase();
        const isDefault = isDefaultCategory(category.name);

        if (isEditing) {
            return (
                <li key={category.name} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="text"
                            value={editingCategory.name}
                            onChange={handleEditNameChange}
                            className="w-full text-sm px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                         <div className="flex flex-wrap gap-1">
                            {COLOR_PALETTE.map(color => (
                                <button key={color} type="button" onClick={() => handleEditColorChange(color)} className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center" style={{ backgroundColor: color }}>
                                    {editingCategory.color === color && <div className="w-2.5 h-2.5 rounded-full bg-white/70"></div>}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                             <button onClick={handleCancelEdit} className="text-xs font-semibold text-slate-600 dark:text-slate-300">Cancel</button>
                            <button onClick={handleSaveEdit} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Save</button>
                        </div>
                    </div>
                </li>
            );
        }

        return (
            <li key={category.name} className="flex items-center justify-between p-2 hover:bg-slate-100 dark:hover:bg-slate-900/50 rounded-md">
                <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }}></span>
                    <span className="text-sm font-medium">{category.name}</span>
                </div>
                {!isDefault && (
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleStartEdit(category)} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"><PencilIcon className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(category.name)} className="text-slate-500 hover:text-red-600 dark:hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                )}
            </li>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold">Manage Categories</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-2xl">&times;</button>
                </div>

                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <ul className="space-y-1">
                        {allCategories.sort((a,b) => a.name.localeCompare(b.name)).map(renderCategoryItem)}
                    </ul>
                </div>
                
                <form onSubmit={handleAdd} className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-md font-semibold mb-2">Add New Category</h4>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="New category name..."
                            required
                            className="flex-grow w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                         {COLOR_PALETTE.map(color => (
                            <button key={color} type="button" onClick={() => setNewCategoryColor(color)} className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center" style={{ backgroundColor: color }}>
                                {newCategoryColor === color && <div className="w-3 h-3 rounded-full bg-white/70"></div>}
                            </button>
                         ))}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryManagerModal;
