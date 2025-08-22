import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Input, Upload } from 'antd';
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
  const [existingVariations, setExistingVariations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
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

  // Load existing variations when modal opens
  useEffect(() => {
    if (isOpen) {
      loadExistingVariations();
    }
  }, [isOpen, element.id]);

  const loadExistingVariations = async () => {
    setIsLoading(true);
    try {
      const projectId = window.location.pathname.split('/')[2];
      const response = await fetch(`/api/projects/${projectId}/media-variations`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded media variations data:', data);
        
        // Handle the nested structure according to the schema
        let allVariations = [];
        if (data.mediaVariations && Array.isArray(data.mediaVariations)) {
          // Find the entry for this element
          const elementEntry = data.mediaVariations.find((item: any) => item.elementId === element.id);
          if (elementEntry && elementEntry.variations && Array.isArray(elementEntry.variations)) {
            allVariations = elementEntry.variations;
          }
        }
        
        // No need to filter since we already got the right element's variations
        const elementVariations = allVariations;
        console.log('Filtered variations for element', element.id, ':', elementVariations);
        console.log('First variation videoUrl:', elementVariations[0]?.videoUrl);
        console.log('First variation metadata:', elementVariations[0]?.metadata);
        
        if (elementVariations && elementVariations.length > 0) {
          setExistingVariations(elementVariations);
        } else {
          setExistingVariations([]);
        }
      } else {
        setExistingVariations([]);
      }
    } catch (error) {
      console.error('Error loading existing variations:', error);
      setExistingVariations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVariation = async (variationId: string) => {
    setIsDeleting(variationId);
    try {
      const projectId = window.location.pathname.split('/')[2];
      const response = await fetch(`/api/projects/${projectId}/media-variations`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elementId: element.id,
          variationId: variationId
        }),
      });

      if (response.ok) {
        // Reload variations
        await loadExistingVariations();
      }
    } catch (error) {
      console.error('Error deleting variation:', error);
    } finally {
      setIsDeleting(null);
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
      
      // Upload each file using the upload API
      for (let index = 0; index < selectedFiles.length; index++) {
        const file = selectedFiles[index];
        
        try {
          // Get project ID from URL
          const projectId = window.location.pathname.split('/')[2];
          
          // Create form data for upload
          const formData = new FormData();
          formData.append('file', file);
          formData.append('projectId', projectId);
          formData.append('isVariation', 'true'); // Mark as variation upload
          
          // Upload to the upload API
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            
            // Create variation with the uploaded URL
            const variation: MediaVariation = {
              id: `variation-${Date.now()}-${index}`,
              content: uploadData.asset.cloudinaryUrl,
              type: 'manual',
              metadata: {
                fileName: variationNames[index] || file.name,
                fileSize: file.size,
                fileType: file.type,
                uploadedUrl: uploadData.asset.cloudinaryUrl,
                cloudinaryPublicId: uploadData.asset.cloudinaryPublicId,
                ...uploadData.asset.metadata
              } as any
            };
            
            variations.push(variation);
            console.log(`Successfully uploaded ${file.name}`);
          } else {
            const errorData = await uploadResponse.json();
            console.error(`Failed to upload ${file.name}:`, errorData);
          }
        } catch (uploadError) {
          console.error(`Failed to upload ${file.name}:`, uploadError);
        }
      }

      if (variations.length > 0) {
        console.log('Calling onAddVariations with:', variations);
        onAddVariations(variations);
        
        // Wait a bit for the backend save to complete, then reload
        setTimeout(async () => {
          await loadExistingVariations();
        }, 500);
        
        // Clear selected files
        setSelectedFiles([]);
        setVariationNames({});
        
        // Refresh the uploads list to show new assets
        window.dispatchEvent(new CustomEvent('refreshUploads'));
      }
    } catch (error) {
      console.error('Upload error:', error);
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

  const renderMediaPreview = (src: string | undefined, type: string, fileName?: string, isFile?: boolean) => {
    const baseClasses = "w-full h-full object-cover rounded-lg";
    
    if (element.elementType === 'video') {
      if (!src) {
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
            <VideoCameraOutlined style={{ fontSize: '32px', color: '#9ca3af' }} />
          </div>
        );
      }
      
      return (
        <div className="relative w-full h-full">
          <video 
            src={isFile ? URL.createObjectURL(src as any) : src} 
            className={baseClasses}
            style={{ backgroundColor: '#f3f4f6', zIndex: 1 }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity" style={{ zIndex: 2 }}>
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
          style={{ zIndex: 1 }}
        />
      );
    }
    
    if (element.elementType === 'audio') {
      return (
        			<div className="w-full h-full flex flex-col items-center justify-center rounded-lg relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, rgb(80, 118, 178), rgb(80, 118, 178))' }}>
				<div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, rgba(80, 118, 178, 0.2), rgba(80, 118, 178, 0.4))' }}></div>
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
          				<div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(80, 118, 178)' }}>
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
      destroyOnHidden={true}
      maskClosable={false}
      className="media-variation-modal"
    >
      <div className="flex-1 py-6 overflow-y-auto">
        <div 
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center px-2 ${
            				dragOver ? 'rounded-lg' : ''
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
              				<div className="absolute top-2 left-2 text-white text-xs px-2 py-1 rounded-md font-medium" style={{ backgroundColor: 'rgb(80, 118, 178)' }}>
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
          {selectedFiles.length < (4 - existingVariations.length) && (
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

          {/* Existing Variations */}
          {existingVariations.map((variation, index) => (
            <div key={variation.id} className="flex flex-col items-center space-y-3">
              <div 
                className="relative bg-gray-100 rounded-xl overflow-hidden shadow-lg border border-gray-200 group"
                style={{
                  width: `${mediaSize.width}px`,
                  height: `${mediaSize.height}px`
                }}
              >
                {renderMediaPreview(variation.videoUrl, element.elementType, variation.metadata?.fileName || `Variation ${index + 1}`)}
                
                {/* Delete Button */}
                <div className="absolute top-2 right-2 z-[9999] pointer-events-auto">
                  <Button
                    type="primary"
                    danger
                    size="small"
                    loading={isDeleting === variation.id}
                    onClick={() => handleDeleteVariation(variation.id)}
                    className="h-7 w-7 p-0 opacity-100 transition-opacity shadow-lg rounded-full"
                    icon={<DeleteOutlined />}
                    title="Delete variation"
                  />
                </div>

                {/* File info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-xs">
                    <div className="truncate font-medium">{variation.metadata?.fileName || `Variation ${index + 1}`}</div>
                    <div className="text-white/70">
                      {variation.metadata?.fileSize ? formatFileSize(variation.metadata.fileSize) : ''} • {element.elementType.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center space-y-2 w-full">
                <div className="text-sm font-medium text-gray-900">
                  {variation.metadata?.fileName || `Variation ${index + 1}`}
                </div>
              </div>
            </div>
          ))}

          {/* File Preview Cards for New Uploads */}
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
                <div className="absolute top-2 right-2 z-[9999] pointer-events-auto">
                  <Button
                    type="primary"
                    danger
                    size="small"
                    onClick={() => handleRemoveFile(index)}
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg rounded-full"
                    icon={<DeleteOutlined />}
                  />
                </div>

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
                  placeholder={`Variant ${existingVariations.length + index + 1}`}
                  value={variationNames[index] || ''}
                  onChange={(e) => handleVariationNameChange(index, e.target.value)}
                  					className="text-sm font-medium text-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition-colors w-full max-w-[180px]"
                />
              </div>
            </div>
          ))}
          
          {/* Empty Placeholder Slots */}
          {Array.from({ length: Math.max(0, 4 - selectedFiles.length - existingVariations.length) }).map((_, index) => (
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
            {selectedFiles.length > 0 || existingVariations.length > 0 ? (
              <span className="flex items-center gap-2">
                				<div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'rgb(80, 118, 178)' }}></div>
                {selectedFiles.length + existingVariations.length + 1} variants total (including original)
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
              				className="text-white min-w-[140px]"
				style={{ backgroundColor: 'rgb(80, 118, 178)' }}
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

          