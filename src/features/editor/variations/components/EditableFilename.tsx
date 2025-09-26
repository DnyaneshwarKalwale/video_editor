import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit2, Check, X } from 'lucide-react';

interface EditableFilenameProps {
  variationId: string;
  currentName: string;
  onNameChange: (variationId: string, newName: string) => void;
  className?: string;
}

export const EditableFilename: React.FC<EditableFilenameProps> = ({
  variationId,
  currentName,
  onNameChange,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update edit value when current name changes
  useEffect(() => {
    setEditValue(currentName);
  }, [currentName]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditValue(currentName);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editValue.trim() && editValue.trim() !== currentName) {
      onNameChange(variationId, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(currentName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

      if (isEditing) {
        return (
          <div className={`flex items-center gap-1 min-w-0 ${className}`} style={{ maxWidth: '100%' }}>
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-xs h-6 min-w-0"
              placeholder="Enter custom name..."
              style={{ 
                maxWidth: 'calc(100% - 3rem)',
                fontSize: '0.75rem'
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              className="h-5 w-5 p-0 flex-shrink-0"
              style={{ minWidth: '1.25rem', minHeight: '1.25rem' }}
            >
              <Check className="h-3 w-3 text-green-600" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-5 w-5 p-0 flex-shrink-0"
              style={{ minWidth: '1.25rem', minHeight: '1.25rem' }}
            >
              <X className="h-3 w-3 text-red-600" />
            </Button>
          </div>
        );
      }

      return (
        <div className={`group flex items-center gap-1 min-w-0 ${className}`} style={{ maxWidth: '100%' }}>
          <span 
            className="text-xs font-medium cursor-pointer flex-1 min-w-0" 
            title={currentName}
            onClick={handleStartEdit}
            style={{ 
              maxWidth: 'calc(100% - 1.5rem)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block'
            }}
          >
            {currentName}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleStartEdit}
            className="h-5 w-5 p-0 opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
            title="Click to edit name"
            style={{ minWidth: '1.25rem', minHeight: '1.25rem' }}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        </div>
      );
};

export default EditableFilename;
