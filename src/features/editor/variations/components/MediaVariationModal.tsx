import React, { useState, useRef } from 'react';
import { Modal, Button, Input, Upload, message } from 'antd';
import { 
  UploadOutlined, 
  VideoCameraOutlined, 
  PictureOutlined, 
  SoundOutlined, 
  CloseOutlined, 
  FileOutlined,
  LoadingOutlined,
  DeleteOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { TimelineElement, MediaVariation } from '../types/variation-types';
import { processFileUpload } from '../../../../utils/upload-service';

interface MediaVariationModalProps {
  isOpen: boolean;
  onClose: () => void;
  element: TimelineElement;
  onAddVariations: (variations: MediaVariation[]) => void;
}

export const MediaVariationModal: React.FC<MediaVariationModalProps> = ({
  isOpen,
  onClose,
  element,
  onAddVariations,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [variationNames, setVariationNames] = useState<{[key: number]: string}>({});
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Platform configuration
  const platformConfig = {
    name: 'Instagram Story',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16'
  };

  const getElementIcon = () => {
    switch (element.elementType) {
      case 'video':
        return <VideoCameraOutlined style={{ color: '#1890ff' }} />;
      case 'image':
        return <PictureOutlined style={{ color: '#1890ff' }} />;
      case 'audio':
        return <SoundOutlined style={{ color: '#1890ff' }} />;
      default:
        return <FileOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getElementTypeLabel = () => {
    switch (element.elementType) {
      case 'video':
        return 'Video';
      case 'image':
        return 'Image';
      case 'audio':
        return 'Audio';
      default:
        return 'Media';
    }
  };

  const getAcceptedFileTypes = () => {
    switch (element.elementType) {
      case 'video':
        return '.mp4,.mov,.avi,.mkv,.webm';
      case 'image':
        return '.jpg,.jpeg,.png,.gif,.webp';
      case 'audio':
        return '.mp3,.wav,.aac,.ogg,.m4a';
      default:
        return '*';
    }
  };

  // Improved responsive sizing calculation
  const calculateMediaSize = () => {
    const containerWidth = Math.min(280, window.innerWidth * 0.2);
    const aspectRatio = platformConfig.width / platformConfig.height;
    
    let mediaWidth = containerWidth;
    let mediaHeight = containerWidth / aspectRatio;
    
    // Ensure minimum height for better visibility
    if (mediaHeight < 160) {
      mediaHeight = 160;
      mediaWidth = mediaHeight * aspectRatio;
    }
    
    return { width: mediaWidth, height: mediaHeight };
  };

  const mediaSize = calculateMediaSize();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    handleNewFiles(files);
  };

  const handleNewFiles = (files: File[]) => {
    const remainingSlots = 4 - selectedFiles.length;
    const filesToAdd = files.slice(0, Math.max(0, remainingSlots));
    setSelectedFiles(prev => [...prev, ...filesToAdd]);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    handleNewFiles(files);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setVariationNames(prev => {
      const newNames = { ...prev };
      delete newNames[index];
      return newNames;
    });
  };

  const handleVariationNameChange = (index: number, name: string) => {
    setVariationNames(prev => ({ ...prev, [index]: name }));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      const variations: MediaVariation[] = [];
      
      // Upload each file to the proper storage
      for (let index = 0; index < selectedFiles.length; index++) {
        const file = selectedFiles[index];
        const uploadId = `upload-${Date.now()}-${index}`;
        
        try {
          // Use the same upload service as the main app
          const uploadData = await processFileUpload(uploadId, file, {
            onProgress: (id: string, percent: number) => {
              console.log(`Upload progress for ${file.name}: ${percent}%`);
            },
            onStatus: (id: string, status: string, error?: string) => {
              console.log(`Upload status for ${file.name}: ${status}`, error);
            }
          });

          // Create variation with the proper uploaded URL
          const variation: MediaVariation = {
            id: `variation-${Date.now()}-${index}`,
            content: uploadData.metadata.uploadedUrl, // Use the actual uploaded URL
            type: 'manual',
            metadata: {
              fileName: variationNames[index] || file.name,
              fileSize: file.size,
              fileType: file.type,
              uploadedUrl: uploadData.metadata.uploadedUrl,
              filePath: uploadData.filePath
            } as any
          };
          
          variations.push(variation);
        } catch (uploadError) {
          console.error(`Failed to upload ${file.name}:`, uploadError);
          message.error(`Failed to upload ${file.name}`);
        }
      }

      if (variations.length > 0) {
      onAddVariations(variations);
        message.success(`Successfully uploaded ${variations.length} file(s)`);
      handleClose();
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      onClose();
      setSelectedFiles([]);
      setVariationNames({});
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderMediaPreview = (src: string, type: string, fileName?: string, isFile?: boolean) => {
    const baseClasses = "w-full h-full object-cover rounded-lg";
    
    if (element.elementType === 'video') {
      return (
        <div className="relative w-full h-full">
          <video 
            src={isFile ? URL.createObjectURL(src as any) : src} 
            className={baseClasses}
            style={{ backgroundColor: '#f3f4f6' }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
            <PlayCircleOutlined style={{ fontSize: '32px', color: 'white' }} />
          </div>
        </div>
      );
    }
    
    if (element.elementType === 'image') {
      return (
        <img 
          src={src} 
          alt={fileName || 'Media preview'}
          className={baseClasses}
        />
      );
    }
    
    if (element.elementType === 'audio') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-600/40"></div>
          <SoundOutlined style={{ fontSize: '48px', color: 'white', marginBottom: '8px' }} />
          <span className="text-white text-xs text-center px-2 truncate max-w-full">
            {fileName}
          </span>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <FileOutlined style={{ fontSize: '48px', color: '#9ca3af' }} />
      </div>
    );
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            {getElementIcon()}
          </div>
          <div>
            <div className="text-xl font-semibold text-gray-900">
              Add {getElementTypeLabel()} Variants
            </div>
            <div className="text-sm text-gray-500">
              Platform: {platformConfig.name} • {platformConfig.aspectRatio} • Max 5 variants
            </div>
          </div>
        </div>
      }
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width="95vw"
      style={{ top: 20 }}
      destroyOnClose={true}
      maskClosable={false}
      className="media-variation-modal"
    >
      <div className="flex-1 py-6 overflow-y-auto">
        <div 
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center px-2 ${
            dragOver ? 'bg-blue-50 rounded-lg' : ''
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          
          {/* Original Media Card */}
          <div className="flex flex-col items-center space-y-3">
            <div 
              className="relative bg-gray-100 rounded-xl overflow-hidden shadow-lg border border-gray-200 group"
              style={{
                width: `${mediaSize.width}px`,
                height: `${mediaSize.height}px`
              }}
            >
              {renderMediaPreview(
                typeof element.originalContent === 'string' 
                  ? element.originalContent 
                  : element.originalContent?.src || '',
                element.elementType,
                'Original'
              )}
              
              {/* Original badge */}
              <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md font-medium">
                Original
              </div>
            </div>
            
            <div className="text-center space-y-1">
              <span className="text-sm font-medium text-gray-900">Original {getElementTypeLabel()}</span>
              <div className="text-xs text-gray-500">
                {platformConfig.width} × {platformConfig.height}
              </div>
            </div>
          </div>

          {/* Upload Card */}
          {selectedFiles.length < 4 && (
            <div className="flex flex-col items-center space-y-3">
              <Button
                type="dashed"
                className="flex flex-col items-center justify-center gap-3 rounded-xl p-4 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
                style={{
                  width: `${mediaSize.width}px`,
                  height: `${mediaSize.height}px`
                }}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                icon={<UploadOutlined style={{ fontSize: '32px', color: '#1890ff' }} />}
              >
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">Add Variant</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Click or drag files
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={getAcceptedFileTypes()}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </Button>
              
              <div className="text-center">
                <span className="text-sm font-medium text-gray-500">Upload {getElementTypeLabel()}</span>
              </div>
            </div>
          )}

          {/* File Preview Cards */}
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex flex-col items-center space-y-3">
              <div 
                className="relative bg-gray-100 rounded-xl overflow-hidden shadow-lg border border-gray-200 group"
                style={{
                  width: `${mediaSize.width}px`,
                  height: `${mediaSize.height}px`
                }}
              >
                {renderMediaPreview(URL.createObjectURL(file), file.type, file.name, false)}
                
                {/* Remove Button */}
                <Button
                  type="primary"
                  danger
                  size="small"
                  onClick={() => handleRemoveFile(index)}
                  className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg rounded-full"
                  icon={<DeleteOutlined />}
                />

                {/* File info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-xs">
                    <div className="truncate font-medium">{file.name}</div>
                    <div className="text-white/70">
                      {formatFileSize(file.size)} • {file.type.split('/')[1]?.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center space-y-2 w-full">
                <Input
                  placeholder={`Variant ${index + 1}`}
                  value={variationNames[index] || ''}
                  onChange={(e) => handleVariationNameChange(index, e.target.value)}
                  className="text-sm font-medium text-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors w-full max-w-[180px]"
                />
              </div>
            </div>
          ))}
          
          {/* Empty Placeholder Slots */}
          {Array.from({ length: Math.max(0, 4 - selectedFiles.length) }).map((_, index) => (
            <div 
              key={`placeholder-${index}`}
              className="flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl opacity-40"
              style={{ 
                width: `${mediaSize.width}px`,
                height: `${mediaSize.height}px` 
              }}
            >
              <FileOutlined style={{ fontSize: '24px', color: '#9ca3af', marginBottom: '8px' }} />
              <p className="text-gray-500 text-xs">Empty slot</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex-shrink-0 rounded-b-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="text-sm text-gray-600">
            {selectedFiles.length > 0 ? (
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                {selectedFiles.length + 1} variants total (including original)
              </span>
            ) : (
              <span>Add up to 4 additional variants</span>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleUpload}
              disabled={isUploading || selectedFiles.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
              icon={isUploading ? <LoadingOutlined /> : <UploadOutlined />}
            >
              {isUploading ? (
                'Processing...'
              ) : (
                `Add ${selectedFiles.length} Variant${selectedFiles.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

          