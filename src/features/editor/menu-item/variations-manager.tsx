import React, { useState, useEffect } from 'react';
import { Button, Space, Typography, Input, List, Card, Modal, message } from 'antd';
import { VideoCameraOutlined, FileTextOutlined, PictureOutlined, SoundOutlined, PlusOutlined, InfoCircleOutlined, SearchOutlined } from '@ant-design/icons';
import Variations from './variations';
import { MediaVariationModal } from '../variations/components/MediaVariationModal';

import './variations-manager.css';

const { Text, Title } = Typography;
const { Search } = Input;

interface TimelineElement {
  id: string;
  type: 'video' | 'text' | 'image' | 'audio';
  name: string;
  content: string;
  duration?: number;
  variations: any[];
}

interface VariationsManagerProps {
  timelineElements: TimelineElement[];
  onTimelineElementsChange: (elements: TimelineElement[]) => void;
}

const VariationsManager: React.FC<VariationsManagerProps> = ({ 
  timelineElements, 
  onTimelineElementsChange 
}) => {
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [selectedElement, setSelectedElement] = useState<TimelineElement | null>(null);
  const [isVariationsModalVisible, setIsVariationsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCombinations, setTotalCombinations] = useState(1);

  useEffect(() => {
    // Calculate total combinations whenever timeline elements change
    const combinations = timelineElements.reduce((total, element) => {
      const variationCount = element.variations?.length || 1;
      return total * variationCount;
    }, 1);
    setTotalCombinations(combinations);
  }, [timelineElements]);

  const handleVariationsChange = (updatedElements: TimelineElement[]) => {
    onTimelineElementsChange(updatedElements);
    // Don't force re-render - let React handle it naturally
  };

  const openExportModal = () => {
    if (totalCombinations === 1) {
      message.warning('Add variations to your timeline elements first!');
      return;
    }
    setIsExportModalVisible(true);
  };

  const getElementTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <VideoCameraOutlined />;
      case 'text': return <FileTextOutlined />;
      case 'image': return <PictureOutlined />;
      case 'audio': return <SoundOutlined />;
      default: return <FileTextOutlined />;
    }
  };

  const getElementTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'green';
      case 'text': return 'blue';
      case 'image': return 'orange';
      case 'audio': return 'purple';
      default: return 'default';
    }
  };

  // Function to get accurate variation count for an element
  const getElementVariationCount = (elementId: string) => {
    const storageKey = `variations_${elementId}`;
    const savedVariations = localStorage.getItem(storageKey);
    if (savedVariations) {
      try {
        const parsedVariations = JSON.parse(savedVariations);
        return parsedVariations.length;
      } catch (error) {
        return 1;
      }
    }
    return 1;
  };

  const filteredElements = timelineElements.filter(element =>
    element.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    element.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleElementSelect = (element: TimelineElement) => {
    console.log('Selected element:', element.type, element);
    setSelectedElement(element);
    setIsVariationsModalVisible(true);
    console.log('Modal should now be visible');
  };

  // Reset modal state when no element is selected (but only if modal is not supposed to be open)
  useEffect(() => {
    if (!selectedElement && isVariationsModalVisible) {
      setIsVariationsModalVisible(false);
    }
  }, [selectedElement, isVariationsModalVisible]);

  // Remove the refreshKey effect that was causing infinite re-renders

  const handleCloseVariationsModal = () => {
    console.log('Closing variations modal');
    setIsVariationsModalVisible(false);
    // Don't immediately set selectedElement to null - let afterClose handle it
  };

  return (
    <div className="variations-manager">


      {/* Search and Element Selection */}
      <div className="element-selection">
        <Search
          placeholder="Search available properties..."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        
        <div className="elements-list">
          {filteredElements.length === 0 ? (
            <div className="empty-state">
              <Text type="secondary">No elements found. Add elements to timeline first.</Text>
            </div>
          ) : (
            filteredElements.map((element) => (
              <div 
                key={element.id} 
                className="element-item"
                onClick={() => handleElementSelect(element)}
              >
                <div className="element-icon">
                  {getElementTypeIcon(element.type)}
                </div>
                <div className="element-content">
                  <Text strong>{element.name}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {element.content.length > 50 
                      ? `${element.content.substring(0, 50)}...` 
                      : element.content
                    }
                  </Text>
                </div>
                <div className="element-variations">
                  <Text type="secondary">
                    ({getElementVariationCount(element.id)})
                  </Text>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Export Button */}
      {totalCombinations > 1 && (
        <div className="export-section">
          <Button 
            type="primary" 
            size="large"
            onClick={openExportModal}
            style={{ width: '100%', marginTop: 16 }}
          >
            Export Videos ({totalCombinations})
          </Button>
        </div>
      )}

      {/* Text Variations Modal */}
      {isVariationsModalVisible && selectedElement && selectedElement.type === 'text' && (() => {
        console.log('Opening TEXT modal for:', selectedElement.type);
        return true;
      })() && (
        <Modal
          title={`Add ${selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} Variants`}
          open={isVariationsModalVisible}
          onCancel={handleCloseVariationsModal}
          footer={null}
          width={1200}
          style={{ top: 20 }}
          destroyOnHidden={false}
          maskClosable={false}
          afterClose={() => {
            setSelectedElement(null);
          }}
        >
          <Variations 
            timelineElements={[selectedElement]}
            onVariationsChange={(updatedElements) => {
              // Update the specific element in the timeline
              const updatedTimeline = timelineElements.map(el => 
                el.id === selectedElement.id ? updatedElements[0] : el
              );
              handleVariationsChange(updatedTimeline);
              // Don't close modal immediately - let user manage variations
            }}
          />
        </Modal>
      )}

      {/* Media Variations Modal */}
      {isVariationsModalVisible && selectedElement && ['video', 'image', 'audio'].includes(selectedElement.type) && (() => {
        console.log('Opening MEDIA modal for:', selectedElement.type);
        return true;
      })() && (
        <MediaVariationModal
          isOpen={isVariationsModalVisible}
          onClose={handleCloseVariationsModal}
          element={{
            id: selectedElement.id,
            elementType: selectedElement.type as 'video' | 'image' | 'audio',
            elementName: selectedElement.name,
            currentVariationCount: getElementVariationCount(selectedElement.id),
            variations: [],
            originalContent: selectedElement.content
          }}
          onAddVariations={(variations) => {
            // Save media variations to localStorage in the same format as text variations
            if (selectedElement) {
              // Create variations array with original media + uploaded variations
              const allVariations = [
                {
                  id: 'original',
                  key: `${selectedElement.type.toUpperCase()}0`,
                  value: selectedElement.content,
                  type: selectedElement.type
                },
                ...variations.map((variation, index) => ({
                  id: variation.id,
                  key: `${selectedElement.type.toUpperCase()}${index + 1}`,
                  value: variation.content,
                  type: selectedElement.type,
                  metadata: variation.metadata
                }))
              ];

              // Save to localStorage using the same key format as text variations
              const storageKey = `variations_${selectedElement.id}`;
              localStorage.setItem(storageKey, JSON.stringify(allVariations));

              // Also save in simple format for sidebar display
              const simpleStorageKey = `simple_variations_${selectedElement.id}`;
              localStorage.setItem(simpleStorageKey, JSON.stringify(allVariations));

              // Update the element with new variations
              const updatedElement = {
                ...selectedElement,
                variations: allVariations
              };

              const updatedTimeline = timelineElements.map(el => 
                el.id === selectedElement.id ? updatedElement : el
              );
              
              handleVariationsChange(updatedTimeline);
            }
            
            message.success(`Added ${variations.length} ${selectedElement.type} variations successfully!`);
            handleCloseVariationsModal();
          }}
        />
      )}


    </div>
  );
};

export default VariationsManager;
