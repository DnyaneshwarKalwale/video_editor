import React, { useState, useEffect, useMemo } from 'react';
import { Button, Space, Typography, Input, List, Card, Modal, message } from 'antd';
import { VideoCameraOutlined, FileTextOutlined, PictureOutlined, SoundOutlined, PlusOutlined, InfoCircleOutlined, SearchOutlined, FontSizeOutlined, PlayCircleOutlined } from '@ant-design/icons';
import Variations from './variations';
import { MediaVariationModal } from '../variations/components/MediaVariationModal';
import { FontVariationModal } from '../variations/components/FontVariationModal';
import { SpeedVariationModal } from '../variations/components/SpeedVariationModal';
import { TimelineElement as VariationTimelineElement } from '../variations/types/variation-types';

interface TimelineElement {
  id: string;
  type: 'video' | 'text' | 'image' | 'audio' | 'font' | 'speed';
  name: string;
  content: string;
  duration?: number;
  variations: any[];
}

import './variations-manager.css';

const { Text, Title } = Typography;
const { Search } = Input;


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
  const [variationCounts, setVariationCounts] = useState<Record<string, number>>({});

  // Create font elements from existing text elements
  const createFontElementsFromText = useMemo(() => {
    const textElements = timelineElements.filter(el => el.type === 'text');
    return textElements.map(textEl => ({
      id: `font-${textEl.id}`,
      type: 'font' as const,
      name: `Font Style - ${textEl.name}`,
      content: 'Arial, sans-serif', // Default font
      duration: textEl.duration,
      variations: []
    }));
  }, [timelineElements]);

  // Create speed elements (global for the entire project)
  const createSpeedElements = useMemo(() => {
    return [{
      id: 'speed-global',
      type: 'speed' as const,
      name: 'Video Speed',
      content: '1.0x',
      duration: 0,
      variations: []
    }];
  }, []);

  const allElements = useMemo(() => {
    const elements = [...timelineElements, ...createFontElementsFromText, ...createSpeedElements];
    console.log(`🔍 All elements created:`, elements.map(el => ({ id: el.id, type: el.type, name: el.name })));
    return elements;
  }, [timelineElements, createFontElementsFromText, createSpeedElements]);

  // Load variation counts for all elements
  useEffect(() => {
    const loadVariationCounts = async () => {
      console.log(`🔍 Loading variation counts for ${allElements.length} elements`);
      const counts: Record<string, number> = {};
      
      for (const element of allElements) {
        console.log(`🔍 Processing element: ${element.id} (${element.type})`);
        try {
          // Get project ID from URL
          const projectId = window.location.pathname.split('/')[2];
          
          if (element.type === 'text') {
            // Load text variations
            const response = await fetch(`/api/projects/${projectId}/text-variations`);
            if (response.ok) {
              const data = await response.json();
              const elementVariations = data.textVariations.find((v: any) => v.elementId === element.id);
              if (elementVariations) {
                counts[element.id] = elementVariations.variations.length + 1; // +1 for original
              } else {
                counts[element.id] = 1;
              }
            } else {
              counts[element.id] = 1;
            }
          } else if (['video', 'image', 'audio'].includes(element.type)) {
            // Load media variations
            const response = await fetch(`/api/projects/${projectId}/media-variations`);
            if (response.ok) {
              const data = await response.json();
              
              // Handle the nested structure according to the schema
              let elementVariations = [];
              if (data.mediaVariations && Array.isArray(data.mediaVariations)) {
                // Find the entry for this element
                const elementEntry = data.mediaVariations.find((item: any) => item.elementId === element.id);
                if (elementEntry && elementEntry.variations && Array.isArray(elementEntry.variations)) {
                  elementVariations = elementEntry.variations;
                }
              }
              if (elementVariations && elementVariations.length > 0) {
                counts[element.id] = elementVariations.length + 1; // +1 for original
              } else {
                counts[element.id] = 1;
              }
            } else {
              counts[element.id] = 1;
            }
          } else if (element.type === 'font') {
            // Load font variations
            const response = await fetch(`/api/projects/${projectId}/font-variations`);
            if (response.ok) {
              const data = await response.json();
              const elementVariations = data.fontVariations?.find((v: any) => v.elementId === element.id);
              if (elementVariations && elementVariations.variations.length > 0) {
                counts[element.id] = elementVariations.variations.length + 1; // +1 for original
              } else {
                counts[element.id] = 1;
              }
            } else {
              counts[element.id] = 1;
            }
          } else {
            counts[element.id] = 1;
          }
        } catch (error) {
          console.error('Error loading variation count for element:', element.id, error);
          counts[element.id] = 1;
        }
      }
      
      console.log(`🔍 Setting variation counts from loadVariationCounts:`, counts);
      setVariationCounts(counts);
    };

    if (allElements.length > 0) {
      loadVariationCounts();
    }
  }, [allElements]);

  // Listen for project loaded event
  useEffect(() => {
    const handleProjectLoaded = (event: CustomEvent) => {
      console.log('Project loaded event received:', event.detail);
      // Reload variation counts when project is loaded
      if (allElements.length > 0) {
        const loadVariationCounts = async () => {
          const counts: Record<string, number> = {};
          
          for (const element of allElements) {
            try {
              const projectId = event.detail.projectId;
              
              if (element.type === 'text') {
                // Load text variations
                const response = await fetch(`/api/projects/${projectId}/text-variations`);
                if (response.ok) {
                  const data = await response.json();
                  const elementVariations = data.textVariations.find((v: any) => v.elementId === element.id);
                  if (elementVariations) {
                    counts[element.id] = elementVariations.variations.length + 1;
                  } else {
                    counts[element.id] = 1;
                  }
                } else {
                  counts[element.id] = 1;
                }
              } else if (['video', 'image', 'audio'].includes(element.type)) {
                // Load media variations
                const response = await fetch(`/api/projects/${projectId}/media-variations`);
                if (response.ok) {
                  const data = await response.json();
                  
                                // Handle the nested structure according to the schema
              let elementVariations = [];
              if (data.mediaVariations && Array.isArray(data.mediaVariations)) {
                // Find the entry for this element
                const elementEntry = data.mediaVariations.find((item: any) => item.elementId === element.id);
                if (elementEntry && elementEntry.variations && Array.isArray(elementEntry.variations)) {
                  elementVariations = elementEntry.variations;
                }
              }
                  if (elementVariations && elementVariations.length > 0) {
                    counts[element.id] = elementVariations.length + 1;
                  } else {
                    counts[element.id] = 1;
                  }
                } else {
                  counts[element.id] = 1;
                }
              } else if (element.type === 'font') {
                // Load font variations
                const response = await fetch(`/api/projects/${projectId}/font-variations`);
                if (response.ok) {
                  const data = await response.json();
                  const elementVariations = data.fontVariations?.find((v: any) => v.elementId === element.id);
                  if (elementVariations && elementVariations.variations.length > 0) {
                    counts[element.id] = elementVariations.variations.length + 1; // +1 for original
                  } else {
                    counts[element.id] = 1;
                  }
                } else {
                  counts[element.id] = 1;
                }
              } else if (element.type === 'speed') {
                // Load speed variations
                const response = await fetch(`/api/projects/${projectId}/speed-variations`);
                if (response.ok) {
                  const data = await response.json();
                  console.log(`🔍 Loading speed variations for element ${element.id}:`, data);
                  const elementVariations = data.speedVariations?.find((v: any) => v.elementId === element.id);
                  console.log(`🔍 Found speed variations for ${element.id}:`, elementVariations);
                  if (elementVariations && elementVariations.variations.length > 0) {
                    counts[element.id] = elementVariations.variations.length + 1; // +1 for original
                    console.log(`🔍 Set speed count for ${element.id}: ${counts[element.id]}`);
                  } else {
                    counts[element.id] = 1;
                    console.log(`🔍 No speed variations found for ${element.id}, using count: 1`);
                  }
                } else {
                  counts[element.id] = 1;
                  console.log(`🔍 Failed to load speed variations for ${element.id}, using count: 1`);
                }
              } else {
                counts[element.id] = 1;
              }
            } catch (error) {
              console.error('Error loading variation count for element:', element.id, error);
              counts[element.id] = 1;
            }
          }
          
          setVariationCounts(counts);
        };
        
        loadVariationCounts();
      }
    };

    window.addEventListener('projectLoaded', handleProjectLoaded as EventListener);
    
    return () => {
      window.removeEventListener('projectLoaded', handleProjectLoaded as EventListener);
    };
  }, [allElements]);

  const handleVariationsChange = (updatedElements: TimelineElement[]) => {
    onTimelineElementsChange(updatedElements);
    // Don't force re-render - let React handle it naturally
  };

  const openExportModal = () => {
    if (Object.values(variationCounts).reduce((sum, count) => sum + count, 0) === 1) {
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
      case 'font': return <FontSizeOutlined />;
      case 'speed': return <PlayCircleOutlined />;
      default: return <FileTextOutlined />;
    }
  };

  const getElementTypeColor = (type: string) => {
    switch (type) {
      			case 'video': return 'blue';
      case 'text': return 'blue';
      case 'image': return 'orange';
      case 'audio': return 'purple';
      case 'font': return 'green';
      case 'speed': return 'red';
      default: return 'default';
    }
  };



  const filteredElements = allElements.filter(element =>
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
                    ({variationCounts[element.id] || 1})
                  </Text>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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
            currentVariationCount: variationCounts[selectedElement.id] || 1,
            variations: [],
            originalContent: selectedElement.content
          }}
          onAddVariations={async (variations) => {
            // Save media variations to backend
            if (selectedElement) {
              try {
                // Get project ID from URL
                const projectId = window.location.pathname.split('/')[2];
                
                // Save to backend
                const response = await fetch(`/api/projects/${projectId}/media-variations`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    elementId: selectedElement.id,
                    originalMedia: selectedElement.content,
                    variations: variations
                  }),
                });

                if (response.ok) {
                  console.log('Media variations saved to backend for element:', selectedElement.id);
                  message.success(`Added ${variations.length} ${selectedElement.type} variations successfully!`);
                  
                  // Update variation counts immediately and permanently
                  const newCount = variations.length + 1; // +1 for original
                  setVariationCounts(prev => ({
                    ...prev,
                    [selectedElement.id]: newCount
                  }));
                  
                  handleCloseVariationsModal();
                } else {
                  console.error('Failed to save media variations to backend');
                  message.error('Failed to save variations');
                }
              } catch (error) {
                console.error('Error saving media variations:', error);
                message.error('Error saving variations');
              }
            }
          }}
        />
      )}

      {/* Font Variations Modal */}
      {isVariationsModalVisible && selectedElement && selectedElement.type === 'font' && (() => {
        console.log('Opening FONT modal for:', selectedElement.type);
        return true;
      })() && (
        <FontVariationModal
          isOpen={isVariationsModalVisible}
          onClose={handleCloseVariationsModal}
          element={{
            id: selectedElement.id,
            elementType: 'font' as const,
            elementName: selectedElement.name,
            currentVariationCount: variationCounts[selectedElement.id] || 1,
            variations: [],
            originalContent: selectedElement.content
          }}
          onAddVariations={async (variations) => {
            // Save font variations to backend
            if (selectedElement) {
              try {
                // Get project ID from URL
                const projectId = window.location.pathname.split('/')[2];
                
                // For font elements, we need to map back to the original text element ID
                const originalTextElementId = selectedElement.id.startsWith('font-') 
                  ? selectedElement.id.replace('font-', '') 
                  : selectedElement.id;
                
                // Save to backend
                const response = await fetch(`/api/projects/${projectId}/font-variations`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    elementId: originalTextElementId,
                    originalFont: selectedElement.content,
                    variations: variations
                  }),
                });

                if (response.ok) {
                  console.log('Font variations saved to backend for element:', selectedElement.id);
                  message.success(`Added ${variations.length} font variations successfully!`);
                  
                  // Update variation counts immediately and permanently
                  const newCount = variations.length + 1; // +1 for original
                  setVariationCounts(prev => ({
                    ...prev,
                    [selectedElement.id]: newCount
                  }));
                  
                  handleCloseVariationsModal();
                } else {
                  console.error('Failed to save font variations to backend');
                  message.error('Failed to save variations');
                }
              } catch (error) {
                console.error('Error saving font variations:', error);
                message.error('Error saving variations');
              }
            }
          }}
        />
      )}

      {/* Speed Variations Modal */}
      {isVariationsModalVisible && selectedElement && selectedElement.type === 'speed' && (
        <SpeedVariationModal
          isOpen={isVariationsModalVisible}
          onClose={handleCloseVariationsModal}
          element={{
            id: selectedElement.id,
            elementType: 'speed' as const,
            elementName: selectedElement.name,
            currentVariationCount: variationCounts[selectedElement.id] || 1,
            variations: [],
            originalContent: selectedElement.content
          }}
          onAddVariations={async (variations) => {
            if (selectedElement) {
              const projectId = window.location.pathname.split('/')[2];
              const response = await fetch(`/api/projects/${projectId}/speed-variations`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  elementId: selectedElement.id,
                  originalSpeed: 1.0,
                  variations: variations
                }),
              });

              if (response.ok) {
                console.log('Speed variations saved to backend for element:', selectedElement.id);
                message.success(`Added ${variations.length} speed variations successfully!`);
                
                // Update variation counts immediately and permanently
                const newCount = variations.length + 1; // +1 for original
                console.log(`🔍 Updating speed variation count for ${selectedElement.id}: ${newCount}`);
                setVariationCounts(prev => {
                  const updated = {
                    ...prev,
                    [selectedElement.id]: newCount
                  };
                  console.log(`🔍 Updated variation counts:`, updated);
                  return updated;
                });
                
                handleCloseVariationsModal();
              } else {
                console.error('Failed to save speed variations to backend');
                message.error('Failed to save variations');
              }
            }
          }}
        />
      )}

    </div>
  );
};

export default VariationsManager;
