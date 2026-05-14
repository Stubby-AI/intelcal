
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { ExtractedData, Category } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { CalendarIcon, DownloadIcon, InformationCircleIcon, GoogleIcon } from './Icons';
import CategorySelector from './CategorySelector';
import { COLOR_PALETTE } from '../utils/categories';

interface ResultsDisplayProps {
  results: ExtractedData[];
  isLoading: boolean;
  onAddToCalendar: (data: ExtractedData) => void;
  onBulkAddToCalendar: (data: ExtractedData[]) => void;
  onBulkExportToICS: (data: ExtractedData[]) => void;
  isGoogleCalendarConnected: boolean;
  onAddToGoogleCalendar: (data: ExtractedData) => void;
  onBulkAddToGoogleCalendar: (data: ExtractedData[]) => void;
  allCategories: Category[];
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (oldName: string, category: Category) => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = (props) => {
  const { results, isLoading, onAddToCalendar, onBulkAddToCalendar, onBulkExportToICS, isGoogleCalendarConnected, onAddToGoogleCalendar, onBulkAddToGoogleCalendar, allCategories, onAddCategory } = props;
  const [editableResults, setEditableResults] = useState<ExtractedData[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [bulkCategories, setBulkCategories] = useState<string[]>([]);

  const topScrollRef = useRef<HTMLDivElement>(null);
  const topScrollInnerRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const isSyncingScroll = useRef(false);


  useEffect(() => {
    setEditableResults(results);
    setSelectedClientIds(new Set()); // Reset selection when results change
  }, [results]);

  useLayoutEffect(() => {
    const observer = new ResizeObserver(() => {
        if (tableRef.current && topScrollInnerRef.current) {
            topScrollInnerRef.current.style.width = `${tableRef.current.scrollWidth}px`;
        }
    });
    if (tableRef.current) {
        observer.observe(tableRef.current);
    }
    return () => observer.disconnect();
  }, [editableResults]);

  const handleScroll = (scroller: 'top' | 'bottom') => {
    if (isSyncingScroll.current) return;
    
    isSyncingScroll.current = true;
    
    if (scroller === 'top' && topScrollRef.current && tableContainerRef.current) {
        tableContainerRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    } else if (scroller === 'bottom' && topScrollRef.current && tableContainerRef.current) {
        topScrollRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    }

    // Use a timeout to reset the flag. This is crucial to prevent scroll events fired
    // programmatically from re-triggering the sync in a loop.
    setTimeout(() => {
        isSyncingScroll.current = false;
    }, 100); 
  };


  useEffect(() => {
    const selectedItems = editableResults.filter(r => selectedClientIds.has(r.clientId!));
    if (selectedItems.length > 0) {
        const firstCategories = selectedItems[0].category || [];
        const allSameCategories = selectedItems.every(item => 
            JSON.stringify((item.category || []).sort()) === JSON.stringify(firstCategories.sort())
        );
        if (allSameCategories) {
            setBulkCategories(firstCategories);
        } else {
            setBulkCategories([]);
        }
    } else {
        setBulkCategories([]);
    }
  }, [selectedClientIds, editableResults]);
  
  const handleFieldChange = (clientId: string, field: keyof ExtractedData, value: any) => {
      setEditableResults(currentResults => 
          currentResults.map(r => r.clientId === clientId ? { ...r, [field]: value } : r)
      );
  }

  const handleCategoryChange = (clientId: string, newCategories: string[], newCategoryData?: { name: string, color: string }) => {
    handleFieldChange(clientId, 'category', newCategories);
    if (newCategoryData) {
        onAddCategory(newCategoryData);
    }
  };

  const handleBulkCategoryChange = (newCategories: string[], newCategoryData?: { name: string, color: string }) => {
    setBulkCategories(newCategories);

    setEditableResults(currentResults =>
        currentResults.map(r =>
            selectedClientIds.has(r.clientId!) ? { ...r, category: newCategories } : r
        )
    );

    if (newCategoryData) {
        onAddCategory(newCategoryData);
    }
  };

  const handleSelect = (clientId: string, isSelected: boolean) => {
    setSelectedClientIds(prev => {
        const newSet = new Set(prev);
        if (isSelected) {
            newSet.add(clientId);
        } else {
            newSet.delete(clientId);
        }
        return newSet;
    });
  }

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
        setSelectedClientIds(new Set(editableResults.map(r => r.clientId!)));
    } else {
        setSelectedClientIds(new Set());
    }
  }

  const getSelectedData = () => {
    return editableResults.filter(r => selectedClientIds.has(r.clientId!));
  }

  if (isLoading) {
    return (
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 px-6 py-4 rounded-lg shadow-md">
            <LoadingSpinner />
            <span className="font-medium text-slate-600 dark:text-slate-300">Analyzing your content...</span>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="mt-8 text-center bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
        <InformationCircleIcon className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-500" />
        <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-200">Ready to Extract</h3>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Upload documents, images, or paste text to get started.</p>
      </div>
    );
  }

  const isAllSelected = selectedClientIds.size > 0 && selectedClientIds.size === editableResults.length;
  
  const BulkActionBar = () => (
      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3">
          <span className="font-semibold">{selectedClientIds.size} item(s) selected</span>
          <div className="w-48 z-20">
            <CategorySelector
              selected={bulkCategories}
              onChange={handleBulkCategoryChange}
              allCategories={allCategories}
            />
          </div>
          <div className="flex-grow"></div>
          <button onClick={() => onBulkAddToCalendar(getSelectedData())} className="flex items-center gap-2 text-sm bg-indigo-600 text-white font-semibold py-2 px-3 rounded-lg shadow-sm hover:bg-indigo-700">
              <CalendarIcon className="w-4 h-4"/> Add to In-App Calendar
          </button>
          <button onClick={() => onBulkExportToICS(getSelectedData())} className="flex items-center gap-2 text-sm bg-slate-600 text-white font-semibold py-2 px-3 rounded-lg shadow-sm hover:bg-slate-700">
              <DownloadIcon className="w-4 h-4"/> Export (.ics)
          </button>
          {isGoogleCalendarConnected && (
              <button onClick={() => onBulkAddToGoogleCalendar(getSelectedData())} className="flex items-center gap-2 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-semibold py-2 px-3 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">
                  <GoogleIcon className="w-4 h-4"/> Add to Google
              </button>
          )}
      </div>
  );


  return (
    <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Extraction Results</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Review and edit the extracted information below.</p>
      </div>

      {selectedClientIds.size > 0 && <BulkActionBar />}

      <div ref={topScrollRef} onScroll={() => handleScroll('top')} className="overflow-x-auto overflow-y-hidden h-4">
        <div ref={topScrollInnerRef} style={{ height: '1px' }}></div>
      </div>
      
      <div ref={tableContainerRef} onScroll={() => handleScroll('bottom')} className="overflow-x-auto">
        <table ref={tableRef} className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                <tr>
                    <th scope="col" className="p-4">
                        <input type="checkbox" checked={isAllSelected} onChange={(e) => handleSelectAll(e.target.checked)} className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"/>
                    </th>
                    <th scope="col" className="px-6 py-3 min-w-[200px]">Title</th>
                    <th scope="col" className="px-6 py-3 min-w-[250px]">Category</th>
                    <th scope="col" className="px-6 py-3 min-w-[200px]">Start Date & Time</th>
                    <th scope="col" className="px-6 py-3 min-w-[200px]">End Date & Time</th>
                    <th scope="col" className="px-6 py-3 min-w-[120px]">Repeat Annually</th>
                    <th scope="col" className="px-6 py-3 min-w-[250px]">Summary</th>
                    <th scope="col" className="px-6 py-3 min-w-[150px]">Location</th>
                    <th scope="col" className="px-6 py-3 min-w-[100px]">Actions</th>
                    <th scope="col" className="px-6 py-3 min-w-[150px]">Source</th>
                </tr>
            </thead>
            <tbody>
                {editableResults.map((result) => (
                    <tr key={result.clientId} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/20">
                        <td className="w-4 p-4">
                            <input type="checkbox" checked={selectedClientIds.has(result.clientId!)} onChange={e => handleSelect(result.clientId!, e.target.checked)} className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"/>
                        </td>
                        <td className="px-6 py-4"><input type="text" value={result.title || ''} onChange={e => handleFieldChange(result.clientId!, 'title', e.target.value)} className="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 focus:outline-none focus:border-indigo-500"/></td>
                        <td className="px-6 py-4">
                            <CategorySelector
                                selected={result.category || []}
                                onChange={(cats, newCatData) => handleCategoryChange(result.clientId!, cats, newCatData)}
                                allCategories={allCategories}
                            />
                        </td>
                        <td className="px-6 py-4"><input type="datetime-local" value={(result.start || '').substring(0,16)} onChange={e => handleFieldChange(result.clientId!, 'start', e.target.value)} className="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 focus:outline-none focus:border-indigo-500 dark:[color-scheme:dark]"/></td>
                        <td className="px-6 py-4"><input type="datetime-local" value={(result.end || '').substring(0,16)} onChange={e => handleFieldChange(result.clientId!, 'end', e.target.value)} className="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 focus:outline-none focus:border-indigo-500 dark:[color-scheme:dark]"/></td>
                        <td className="px-6 py-4 text-center">
                            <input type="checkbox" checked={!!result.recurring} onChange={e => handleFieldChange(result.clientId!, 'recurring', e.target.checked)} className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"/>
                        </td>
                        <td className="px-6 py-4"><textarea rows={1} value={result.summary || ''} onChange={e => handleFieldChange(result.clientId!, 'summary', e.target.value)} className="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 focus:outline-none focus:border-indigo-500 resize-none"/></td>
                        <td className="px-6 py-4"><input type="text" value={result.location || ''} onChange={e => handleFieldChange(result.clientId!, 'location', e.target.value)} className="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 focus:outline-none focus:border-indigo-500"/></td>
                        <td className="px-6 py-4">
                            <button onClick={() => onAddToCalendar(result)} className="font-medium text-indigo-600 dark:text-indigo-500 hover:underline">Add</button>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{result.source}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {selectedClientIds.size > 0 && <BulkActionBar />}
    </div>
  );
};

export default ResultsDisplay;
