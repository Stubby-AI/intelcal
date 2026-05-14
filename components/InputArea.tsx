
import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon, LinkIcon, SparklesIcon, XCircleIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';

interface InputAreaProps {
  onExtract: (files: File[], text: string) => void;
  isLoading: boolean;
}

const ACCEPTED_FILE_TYPES = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
];


const InputArea: React.FC<InputAreaProps> = ({ onExtract, isLoading }) => {
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [text, setText] = useState<string>('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (files) {
        const newFiles = Array.from(files).filter(file => {
            if (stagedFiles.some(stagedFile => stagedFile.name === file.name && stagedFile.size === file.size)) {
                return false; // Prevent duplicates
            }
            if (!ACCEPTED_FILE_TYPES.some(type => file.type === type) && !file.name.endsWith('.docx')) {
                 alert(`Skipping unsupported file type: ${file.name}. Please upload images, PDFs, Word docs, or spreadsheets.`);
                 return false;
            }
            return true;
        });
        setStagedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    event.target.value = ''; // Allow selecting the same file again
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(true);
  };
  
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleRemoveFile = (index: number) => {
    setStagedFiles(prev => prev.filter((_, i) => i !== index));
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onExtract(stagedFiles, text);
  };

  const isImageFile = (file: File) => file.type.startsWith('image/');

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg mt-6">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div
            onClick={handleFileClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors ${isDraggingOver ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300 dark:border-slate-600'}`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept={ACCEPTED_FILE_TYPES.join(',')}
              multiple
            />
            {stagedFiles.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-left">
                {stagedFiles.map((file, index) => (
                    <div key={index} className="relative group/file">
                        {isImageFile(file) ? (
                            <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-24 object-cover rounded-md" />
                        ) : (
                            <div className="w-full h-24 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center p-2">
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 break-all">{file.name}</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover/file:opacity-100 transition-opacity">
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveFile(index); }} className="p-1 bg-red-600 text-white rounded-full">
                                <XCircleIcon className="w-5 h-5"/>
                            </button>
                        </div>
                        <p className="text-xs truncate mt-1">{file.name}</p>
                    </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-500 dark:text-slate-400">
                <UploadIcon className="w-12 h-12 mb-2" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">Drag & drop or click to upload</p>
                <p className="text-sm">Supports images, PDFs, DOCX, and spreadsheets.</p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="text-input" className="flex items-center mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <LinkIcon className="w-5 h-5 mr-2" />
              Or paste text/links (one per line)
            </label>
            <textarea
              id="text-input"
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="Paste text from a website, email, or document..."
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={isLoading || (stagedFiles.length === 0 && !text)}
            className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                Extracting...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Extract Information
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputArea;
