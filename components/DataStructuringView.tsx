
import React, { useState, useCallback } from 'react';
import FileUploadBox from './FileUploadBox';
import { structureDataFromTemplate } from '../services/geminiService';
import { SparklesIcon, DownloadIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';

interface DataStructuringViewProps {
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const DataStructuringView: React.FC<DataStructuringViewProps> = ({ showToast }) => {
    const [templateFile, setTemplateFile] = useState<File | null>(null);
    const [dataFile, setDataFile] = useState<File | null>(null);
    const [organizedData, setOrganizedData] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const handleProcess = useCallback(async () => {
        if (!templateFile || !dataFile) {
            showToast('Please upload both a template and a data file.', 'error');
            return;
        }
        setIsLoading(true);
        setOrganizedData('');
        try {
            const result = await structureDataFromTemplate(templateFile, dataFile);
            setOrganizedData(result);
            showToast('Data structured successfully!', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to structure data. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [templateFile, dataFile, showToast]);

    const handleDownload = () => {
        if (!organizedData) return;
        const blob = new Blob([organizedData], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const outputFilename = `organized_${dataFile?.name.split('.')[0] || 'output'}.txt`;
        link.setAttribute('download', outputFilename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('File downloaded successfully!', 'success');
    };

    return (
        <div className="mt-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Data Structuring</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Use a template document to automatically format your unstructured data.</p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-6">
                <FileUploadBox title="1. Upload Template Document" onFileSelect={setTemplateFile} selectedFile={templateFile} />
                <FileUploadBox title="2. Upload Data Document" onFileSelect={setDataFile} selectedFile={dataFile} />
            </div>

            <div className="mt-6">
                 <button
                    type="button"
                    onClick={handleProcess}
                    disabled={!templateFile || !dataFile || isLoading}
                    className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all"
                >
                    {isLoading ? (
                    <>
                        <LoadingSpinner />
                        Structuring...
                    </>
                    ) : (
                    <>
                        <SparklesIcon className="w-5 h-5" />
                        Structure Data
                    </>
                    )}
                </button>
            </div>

            {(organizedData || isLoading) && (
                <div className="mt-6 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Organized Output</h3>
                        {organizedData && !isLoading && (
                            <button onClick={handleDownload} className="flex items-center gap-2 text-sm bg-slate-600 text-white font-semibold py-2 px-3 rounded-lg shadow-sm hover:bg-slate-700">
                                <DownloadIcon className="w-4 h-4"/> Download (.txt)
                            </button>
                        )}
                    </div>
                     {isLoading && !organizedData ? (
                        <div className="text-center text-slate-500 dark:text-slate-400 py-10">
                            <p>Analyzing documents and structuring data...</p>
                            <p className="text-sm">This may take a moment for large files.</p>
                        </div>
                     ) : (
                        <textarea
                            value={organizedData}
                            readOnly
                            rows={15}
                            className="w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md font-mono text-sm"
                            placeholder="Organized data will appear here..."
                        />
                     )}
                </div>
            )}
        </div>
    );
};

export default DataStructuringView;
