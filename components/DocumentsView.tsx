
import React from 'react';
import { ExtractedData, Category, StoredDocument } from '../types';
import InputArea from './InputArea';
import ResultsDisplay from './ResultsDisplay';
import { RefreshIcon, TrashIcon, DocumentTextIcon, FilePdfIcon, FileImageIcon, FileWordIcon, FileExcelIcon } from './Icons';

interface DocumentsViewProps {
  onExtract: (files: File[], text: string) => void;
  isLoading: boolean;
  extractionResults: ExtractedData[];
  onAddToCalendar: (data: ExtractedData) => void;
  onBulkAddToCalendar: (data: ExtractedData[]) => void;
  onBulkExportToICS: (data: ExtractedData[]) => void;
  isGoogleCalendarConnected: boolean;
  onAddToGoogleCalendar: (data: ExtractedData) => void;
  onBulkAddToGoogleCalendar: (data: ExtractedData[]) => void;
  allCategories: Category[];
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (oldName: string, category: Category) => void;
  storedDocuments: StoredDocument[];
  onDeleteDocument: (docId: string) => void;
  onReExtract: (doc: StoredDocument) => void;
}

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImageIcon className="w-6 h-6 text-pink-500" />;
    if (mimeType.includes('pdf')) return <FilePdfIcon className="w-6 h-6 text-red-500" />;
    if (mimeType.includes('word')) return <FileWordIcon className="w-6 h-6 text-blue-500" />;
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileExcelIcon className="w-6 h-6 text-green-500" />;
    return <DocumentTextIcon className="w-6 h-6 text-slate-500" />;
};


const StoredDocumentsList: React.FC<{
    documents: StoredDocument[];
    onDelete: (docId: string) => void;
    onReExtract: (doc: StoredDocument) => void;
}> = ({ documents, onDelete, onReExtract }) => {
    if (documents.length === 0) {
        return <p className="text-center text-slate-500 dark:text-slate-400 py-8">No documents uploaded yet.</p>
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                    <tr>
                        <th scope="col" className="px-6 py-3 w-12">Type</th>
                        <th scope="col" className="px-6 py-3">Name</th>
                        <th scope="col" className="px-6 py-3">Uploaded</th>
                        <th scope="col" className="px-6 py-3">Size</th>
                        <th scope="col" className="px-6 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {documents.map(doc => (
                        <tr key={doc.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/20">
                            <td className="px-6 py-4">{getFileIcon(doc.type)}</td>
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{doc.name}</td>
                            <td className="px-6 py-4">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4">{(doc.size / 1024).toFixed(2)} KB</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => onReExtract(doc)} title="Re-extract" className="font-medium text-indigo-600 dark:text-indigo-500 hover:underline"><RefreshIcon className="w-5 h-5"/></button>
                                    <button onClick={() => onDelete(doc.id)} title="Delete" className="font-medium text-red-600 dark:text-red-500 hover:underline"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


const DocumentsView: React.FC<DocumentsViewProps> = (props) => {
  return (
    <>
      <InputArea onExtract={props.onExtract} isLoading={props.isLoading} />
      <ResultsDisplay
        results={props.extractionResults}
        isLoading={props.isLoading}
        onAddToCalendar={props.onAddToCalendar}
        onBulkAddToCalendar={props.onBulkAddToCalendar}
        onBulkExportToICS={props.onBulkExportToICS}
        isGoogleCalendarConnected={props.isGoogleCalendarConnected}
        onAddToGoogleCalendar={props.onAddToGoogleCalendar}
        onBulkAddToGoogleCalendar={props.onBulkAddToGoogleCalendar}
        allCategories={props.allCategories}
        onAddCategory={props.onAddCategory}
        onUpdateCategory={props.onUpdateCategory}
      />
       <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Documents</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Previously uploaded files for extraction.</p>
            </div>
            <StoredDocumentsList documents={props.storedDocuments} onDelete={props.onDeleteDocument} onReExtract={props.onReExtract} />
        </div>
    </>
  );
};

export default DocumentsView;