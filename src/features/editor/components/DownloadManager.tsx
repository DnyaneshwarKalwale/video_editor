import React from 'react';
import { Download, X, Check, AlertCircle, Play, Pause } from 'lucide-react';
import { useDownloadManager } from '../store/use-download-manager';

export const DownloadManager: React.FC = () => {
  const {
    downloads,
    isOpen,
    maxConcurrent,
    removeDownload,
    pauseDownload,
    resumeDownload,
    clearCompleted,
    setOpen,
  } = useDownloadManager();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse" />;
      case 'downloading':
        return <div className="w-4 h-4 bg-blue-500 rounded-full animate-spin" />;
      case 'completed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Waiting...';
      case 'downloading':
        return 'Downloading...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'paused':
        return 'Paused';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  const completedCount = downloads.filter(d => d.status === 'completed').length;
  const failedCount = downloads.filter(d => d.status === 'failed').length;
  const activeCount = downloads.filter(d => d.status === 'downloading').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Download Manager</h2>
            <span className="text-sm text-gray-500">
              ({activeCount} active, {completedCount} completed, {failedCount} failed)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearCompleted}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Clear Completed
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Download List */}
        <div className="flex-1 overflow-y-auto p-4">
          {downloads.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Download className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No downloads yet</p>
              <p className="text-sm">Your downloads will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {downloads.map((download) => (
                <div
                  key={download.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(download.status)}
                      <div>
                        <h3 className="font-medium">{download.name}</h3>
                        <p className="text-sm text-gray-500">
                          {getStatusText(download.status)}
                          {download.status === 'downloading' && ` • ${download.progress.toFixed(1)}%`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {download.status === 'downloading' && (
                        <button
                          onClick={() => pauseDownload(download.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                      {download.status === 'paused' && (
                        <button
                          onClick={() => resumeDownload(download.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => removeDownload(download.id)}
                        className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        download.status === 'completed'
                          ? 'bg-green-500'
                          : download.status === 'failed'
                          ? 'bg-red-500'
                          : download.status === 'paused'
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${download.progress}%` }}
                    />
                  </div>
                  
                  {download.error && (
                    <p className="text-sm text-red-500 mt-2">{download.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              Total: {downloads.length} • 
              Active: {activeCount} • 
              Completed: {completedCount} • 
              Failed: {failedCount}
            </div>
            <div>
              Max concurrent: {maxConcurrent}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
