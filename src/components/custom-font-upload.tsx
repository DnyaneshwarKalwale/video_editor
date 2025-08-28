'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Upload, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CustomFontUploadProps {
  onFontUploaded: () => void;
}

export default function CustomFontUpload({ onFontUploaded }: CustomFontUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fontName, setFontName] = useState('');
  const [fontFamily, setFontFamily] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Get file extension
      const fileExtension = file.name.toLowerCase().split('.').pop();
      
             // Validate file extension
       const allowedExtensions = ['ttf', 'otf', 'woff', 'woff2', 'atf'];

      if (!allowedExtensions.includes(fileExtension || '')) {
        toast.error('Invalid file type. Please upload a valid font file (TTF, OTF, WOFF, WOFF2)');
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error('File too large. Maximum size is 10MB');
        return;
      }

      setSelectedFile(file);
      
      // Auto-fill font family name from filename if not already set
      if (!fontFamily) {
        const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        setFontFamily(fileName);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !fontName || !fontFamily) {
      toast.error('Please fill in all fields and select a font file');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('font', selectedFile);
      formData.append('fontName', fontName);
      formData.append('fontFamily', fontFamily);

      const response = await fetch('/api/fonts/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Custom font uploaded successfully!');
        setIsOpen(false);
        resetForm();
        onFontUploaded(); // Refresh font list
      } else {
        toast.error(result.error || 'Failed to upload font');
      }
    } catch (error) {
      console.error('Error uploading font:', error);
      toast.error('Failed to upload font. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFontName('');
    setFontFamily('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (open: boolean) => {
    // Only allow closing if not uploading
    if (!isUploading) {
      setIsOpen(open);
      if (!open) {
        resetForm();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange} modal={true}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 text-xs"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="h-3 w-3" />
          Add Custom Font
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-md z-[1000]" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Custom Font
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
          {/* Font File Upload */}
          <div className="space-y-2">
            <Label htmlFor="font-file">Font File</Label>
            <div className="flex items-center gap-2">
                             <Input
                 id="font-file"
                 type="file"
                 accept=".ttf,.otf,.woff,.woff2,.atf"
                 onChange={handleFileSelect}
                 ref={fileInputRef}
                 className="flex-1"
               />
              {selectedFile && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs">{selectedFile.name}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Supported formats: TTF, OTF, WOFF, WOFF2 (max 10MB)
            </p>
          </div>

          {/* Font Family Name */}
          <div className="space-y-2">
            <Label htmlFor="font-family">Font Family Name</Label>
            <Input
              id="font-family"
              type="text"
              placeholder="e.g., My Custom Font"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              This is the name that will appear in the font list
            </p>
          </div>

          {/* Font Display Name */}
          <div className="space-y-2">
            <Label htmlFor="font-name">Display Name</Label>
            <Input
              id="font-name"
              type="text"
              placeholder="e.g., My Custom Font Regular"
              value={fontName}
              onChange={(e) => setFontName(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Optional: Specific style name for this font
            </p>
          </div>

          {/* Upload Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || !selectedFile || !fontFamily}
              className="flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Font
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
