import React from 'react';
import { VideoVariation } from '../types/variation-types';

interface VariationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onSave: (variations: VideoVariation[]) => void;
}

const VariationModal: React.FC<VariationModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Variation Modal</h2>
        <p className="text-gray-600 mb-4">Variation modal placeholder</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave([])}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariationModal;

