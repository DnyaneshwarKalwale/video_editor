import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Type, 
  Video, 
  Image, 
  Music, 
  Plus,
  Sparkles,
  Globe,
  Upload
} from 'lucide-react';
import { TimelineElement, ElementType, TextVariation, MediaVariation } from '../types/variation-types';

import { MediaVariationModal } from './MediaVariationModal';
import useStore from '../../store/use-store';

interface VariationManagerProps {
  onVariationsChange: (elements: TimelineElement[]) => void;
}

export const VariationManager: React.FC<VariationManagerProps> = ({
  onVariationsChange,
}) => {
  const { trackItemsMap, trackItemIds } = useStore();
  const [elements, setElements] = useState<TimelineElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<TimelineElement | null>(null);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);

  // Extract elements from timeline
  useEffect(() => {
    const timelineElements: TimelineElement[] = trackItemIds
      .map(id => {
        const item = trackItemsMap[id];
        if (!item) return null;

        const elementType = item.type as ElementType;
        if (!['video', 'text', 'image', 'audio'].includes(elementType)) {
          return null;
        }

        return {
          id: item.id,
          elementType,
          elementName: getElementName(item, elementType),
          currentVariationCount: 1, // Start with 1 (original)
          variations: [],
          originalContent: item.details
        };
      })
      .filter(Boolean) as TimelineElement[];

    setElements(timelineElements);
    onVariationsChange(timelineElements);
  }, [trackItemsMap, trackItemIds, onVariationsChange]);

  const getElementName = (item: any, type: ElementType): string => {
    switch (type) {
      case 'text':
        return item.details.text || 'Text Element';
      case 'video':
        return item.details.src ? item.details.src.split('/').pop() || 'Video' : 'Video Element';
      case 'image':
        return item.details.src ? item.details.src.split('/').pop() || 'Image' : 'Image Element';
      case 'audio':
        return item.details.src ? item.details.src.split('/').pop() || 'Audio' : 'Audio Element';
      default:
        return 'Element';
    }
  };

  const getElementIcon = (type: ElementType) => {
    switch (type) {
      case 'text':
        return <Type className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'audio':
        return <Music className="w-4 h-4" />;
      default:
        return <Type className="w-4 h-4" />;
    }
  };

  const handleCreateVariations = (element: TimelineElement) => {
    setSelectedElement(element);
    
    if (element.elementType === 'text') {
      setShowTextModal(true);
    } else {
      setShowMediaModal(true);
    }
  };

  const handleAddTextVariations = (variations: TextVariation[]) => {
    if (!selectedElement) return;

    const updatedElements = elements.map(el => {
      if (el.id === selectedElement.id) {
        return {
          ...el,
          currentVariationCount: el.currentVariationCount + variations.length,
          variations: [...el.variations, ...variations]
        };
      }
      return el;
    });

    setElements(updatedElements);
    onVariationsChange(updatedElements);
  };

  const handleAddMediaVariations = (variations: MediaVariation[]) => {
    if (!selectedElement) return;

    const updatedElements = elements.map(el => {
      if (el.id === selectedElement.id) {
        return {
          ...el,
          currentVariationCount: el.currentVariationCount + variations.length,
          variations: [...el.variations, ...variations]
        };
      }
      return el;
    });

    setElements(updatedElements);
    onVariationsChange(updatedElements);
  };

  const calculateTotalCombinations = () => {
    return elements.reduce((total, element) => total * element.currentVariationCount, 1);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Timeline Elements</h3>
        <Badge variant="secondary">
          {calculateTotalCombinations()} total combinations
        </Badge>
      </div>

      {/* Elements List */}
      <div className="space-y-3">
        {elements.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No elements found in timeline</p>
              <p className="text-sm text-gray-400 mt-1">
                Add videos, text, images, or audio to create variations
              </p>
            </CardContent>
          </Card>
        ) : (
          elements.map((element) => (
            <Card key={element.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getElementIcon(element.elementType)}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {element.elementName}
                      </h4>
                      <p className="text-xs text-gray-500 capitalize">
                        {element.elementType} • {element.currentVariationCount} variation{element.currentVariationCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {element.elementType === 'text' ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreateVariations(element)}
                          className="h-8 px-3"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Generate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreateVariations(element)}
                          className="h-8 px-3"
                        >
                          <Globe className="w-3 h-3 mr-1" />
                          Language
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreateVariations(element)}
                        className="h-8"
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Add Variations
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      {elements.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-blue-900">
                  Variation Summary
                </h4>
                <p className="text-xs text-blue-700">
                  {elements.length} element{elements.length !== 1 ? 's' : ''} • {calculateTotalCombinations()} total video combinations
                </p>
              </div>
              <Badge variant="default" className="bg-blue-600">
                {calculateTotalCombinations()} videos
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {selectedElement && (
        <MediaVariationModal
          isOpen={showMediaModal}
          onClose={() => {
            setShowMediaModal(false);
            setSelectedElement(null);
          }}
          element={selectedElement}
          onAddVariations={handleAddMediaVariations}
        />
      )}
    </div>
  );
};
