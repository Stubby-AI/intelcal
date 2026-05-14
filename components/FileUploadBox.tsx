
import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon, XCircleIcon, DocumentTextIcon } from './Icons';

interface FileUploadBoxProps {
    title: string;
    onFileSelect: (file: File | null) => void;
    selectedFile: File | null;
}

const ACCEPTED_FILE_TYPES = [
    'image/png', 'image/jpeg', 'image/webp', 'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel', 'text/csv', 'text/plain'
];

const FileUploadBox: React.FC<FileUploadBoxProps> = ({ title, onFileSelect, selectedFile }) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback((fileList: FileList | null) => {
        const file = fileList?.[0];
        if (file) {
            const fileType = file.type || 'application/octet-stream';
            const isAccepted = ACCEPTED_FILE_TYPES.some(type => fileType === type || file.name.endsWith('.docx'));
            if (!isAccepted) {
                alert(`Unsupported file type: ${file.name}. Please upload a supported document.`);
                return;
            }
            onFileSelect(file);
        }
    }, [onFileSelect]);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(false);
        handleFile(e.dataTransfer.files);
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFile(e.target.files);
        e.target.value = '';
    };

    const handleClearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFileSelect(null);
    };

    const openFileDialog = () => fileInputRef.current?.click();

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg h-full flex flex-col">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">{title}</h3>
            <div 
                className="flex-grow flex flex-col items-center justify-center"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept={ACCEPTED_FILE_TYPES.join(',')}
                />
                {selectedFile ? (
                    <div className="w-full text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg relative">
                        <button onClick={handleClearFile} className="absolute top-2 right-2 text-slate-400 hover:text-red-500">
                            <XCircleIcon className="w-5 h-5"/>
                        </button>
                        <DocumentTextIcon className="w-12 h-12 mx-auto text-indigo-500 dark:text-indigo-400" />
                        <p className="font-semibold text-slate-700 dark:text-slate-200 mt-2 break-all">{selectedFile.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                    </div>
                ) : (
                    <div
                        onClick={openFileDialog}
                        className={`w-full h-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors flex flex-col items-center justify-center ${isDraggingOver ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300 dark:border-slate-600'}`}
                    >
                         <div className="flex flex-col items-center text-slate-500 dark:text-slate-400">
                            <UploadIcon className="w-12 h-12 mb-2" />
                            <p className="font-semibold text-slate-700 dark:text-slate-300">Drag & drop or click</p>
                            <p className="text-sm">Upload a single document</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUploadBox;
