import React, { useState, useEffect } from 'react';
import { Button, Modal, Input, Select, message, Upload, List, Card, Space, Typography, Divider, Badge, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, StarOutlined, GlobalOutlined, VideoCameraOutlined, FileTextOutlined, PictureOutlined, SoundOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { AIVariationService } from '../variations/services/ai-variation-service';

const { Text, Title } = Typography;
const { Option } = Select;

interface TimelineElement {
  id: string;
  type: 'video' | 'text' | 'image' | 'audio';
  name: string;
  content: string;
  duration?: number;
  variations: any[];
}

interface Variation {
  id: string;
  key: string;
  value: string;
  type: 'text' | 'video' | 'image' | 'audio';
  file?: File;
  url?: string;
}

interface VariationsProps {
  timelineElements: TimelineElement[];
  onVariationsChange: (elements: TimelineElement[]) => void;
}

const Variations: React.FC<VariationsProps> = ({ 
  timelineElements, 
  onVariationsChange 
}) => {
  const [selectedElement, setSelectedElement] = useState<TimelineElement | null>(null);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [generatedTextVariations, setGeneratedTextVariations] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Don't auto-open modal - only open when explicitly triggered
  // The modal will be opened by the parent component when an element is selected

  // AI Text Generation Prompts
  const generateTextVariations = async (originalText: string, isLanguageVariation: boolean = false) => {
    setIsGenerating(true);
    
    try {
      // Clear any existing variations first
      setGeneratedTextVariations([]);
      
      const prompt = isLanguageVariation 
        ? `You are a translation and creative rewriting expert.
           Given the original text below, generate exactly 10 variations in ${targetLanguage}.
           Each variation must:
           - Maintain the original intent.
           - Use natural expressions for the target language.
           - Be under 10 words.
           - Avoid direct literal translation — make it engaging for a native audience.
           - Vary the tone (some urgent, some casual, some formal).

           Original text: "${originalText}"
           Output as a numbered list (1–10) in ${targetLanguage}.`
        : `You are a creative marketing assistant.
           Given the original text below, generate exactly 10 short variations.
           Each variation must:
           - Preserve the original message intent.
           - Use clear, persuasive, and engaging language.
           - Be under 10 words.
           - Avoid repetition.
           - Include stylistic diversity (some urgent, some casual, some formal).

           Original text: "${originalText}"
           Output as a numbered list (1–10).`;

      // Use the actual AI service
      const aiService = AIVariationService.getInstance();
      const response = await aiService.generateTextVariations({
        originalText: originalText,
        variationType: isLanguageVariation ? 'language' : 'auto',
        targetLanguage: isLanguageVariation ? targetLanguage : undefined,
        count: 10
      });

      setGeneratedTextVariations(response.variations);
      
      // Automatically save the variations to localStorage with proper format
      if (selectedElement) {
        // Get the original element data from the timeline
        const originalElementData = {
          id: selectedElement.id,
          text: selectedElement.content,
          position: { top: 652.922, left: 147.346 }, // Default position
          style: {
            fontSize: 120,
            fontFamily: "Roboto-Bold",
            color: "#000000",
            backgroundColor: "transparent",
            textAlign: "center",
            opacity: 100
          },
          timing: { from: 0, to: 5000 }, // Default timing
          width: 600,
          height: 434.4,
          editable: false
        };

        const allVariations = [
          {
            id: 'original-composition',
            text: selectedElement.content,
            originalTextId: selectedElement.id,
          isOriginal: true,
            allTextOverlays: [originalElementData]
          },
                  ...response.variations.map((text: string, index: number) => ({
          id: `variation-${index}`,
          text: text,
          originalTextId: selectedElement.id,
          isOriginal: false,
          allTextOverlays: [{
            ...originalElementData,
            text: text
          }]
        }))
        ];

        // Save to local storage in the format expected by navbar
        const storageKey = `variations_${selectedElement.id}`;
        localStorage.setItem(storageKey, JSON.stringify(allVariations));

        // Also save in the simple format for sidebar display
        const simpleVariations = [
          {
            id: 'original',
            key: 'TO',
            value: selectedElement.content,
            type: 'text'
          },
                  ...response.variations.map((text: string, index: number) => ({
          id: `variation-${index}`,
          key: `T${index + 1}`,
          value: text,
          type: 'text'
        }))
        ];

        const simpleStorageKey = `simple_variations_${selectedElement.id}`;
        localStorage.setItem(simpleStorageKey, JSON.stringify(simpleVariations));

        // Update the element with new variations
        const updatedElement = {
          ...selectedElement,
          variations: simpleVariations
        };

        const updatedElements = timelineElements.map(el => 
          el.id === selectedElement.id ? updatedElement : el
        );
        
        onVariationsChange(updatedElements);
      }
      
      message.success(`Generated ${response.variations.length} text variations! You can now edit, delete, or add more variations.`);
    } catch (error) {
      message.error('Failed to generate variations');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveVariations = () => {
    if (selectedElement) {
      // Create variations array with original text + generated variations
      const allVariations = [
        {
          id: 'original',
          key: 'TO',
          value: selectedElement.content,
          type: 'text'
        },
        ...generatedTextVariations.map((text, index) => ({
          id: `variation-${index}`,
          key: `T${index + 1}`,
          value: text,
          type: 'text'
        }))
      ];

      // Save to BOTH storage keys to keep them in sync
      const storageKey = `variations_${selectedElement.id}`;
      const simpleStorageKey = `simple_variations_${selectedElement.id}`;
      
      localStorage.setItem(storageKey, JSON.stringify(allVariations));
      localStorage.setItem(simpleStorageKey, JSON.stringify(allVariations));

      // Update the element with new variations
      const updatedElement = {
        ...selectedElement,
        variations: allVariations
      };

      const updatedElements = timelineElements.map(el => 
        el.id === selectedElement.id ? updatedElement : el
      );
      
      onVariationsChange(updatedElements);
      
      // Don't close modal - let user continue managing variations
      message.success(`Saved ${allVariations.length} variations successfully!`);
    }
  };

  const handleDeleteVariation = (index: number) => {
    const newVariations = generatedTextVariations.filter((_, i) => i !== index);
    setGeneratedTextVariations(newVariations);
    
    // Update local storage immediately
    if (selectedElement) {
      const allVariations = [
        {
          id: 'original',
          key: 'TO',
          value: selectedElement.content,
          type: 'text'
        },
        ...newVariations.map((text, idx) => ({
          id: `variation-${idx}`,
          key: `T${idx + 1}`,
          value: text,
          type: 'text'
        }))
      ];
      
      // Update BOTH storage keys to keep them in sync
      const storageKey = `variations_${selectedElement.id}`;
      const simpleStorageKey = `simple_variations_${selectedElement.id}`;
      
      localStorage.setItem(storageKey, JSON.stringify(allVariations));
      localStorage.setItem(simpleStorageKey, JSON.stringify(allVariations));
      
      // Update the element immediately
      const updatedElement = {
        ...selectedElement,
        variations: allVariations
      };
      
      const updatedElements = timelineElements.map(el => 
        el.id === selectedElement.id ? updatedElement : el
      );
      
      onVariationsChange(updatedElements);
    }
  };

  // Set the selected element when timeline elements change
  useEffect(() => {
    console.log('Timeline elements changed:', timelineElements);
    if (timelineElements.length > 0) {
      const element = timelineElements[0];
      console.log('Setting selected element:', element);
      setSelectedElement(element);
    }
  }, [timelineElements]);

  // Load existing variations when selected element changes
  useEffect(() => {
    console.log('Selected element changed:', selectedElement);
    if (selectedElement) {
      // Try both storage keys to be sure
      const storageKey = `variations_${selectedElement.id}`;
      const simpleStorageKey = `simple_variations_${selectedElement.id}`;
      console.log('Loading variations from storage keys:', storageKey, simpleStorageKey);
      
      let savedVariations = localStorage.getItem(storageKey);
      if (!savedVariations) {
        savedVariations = localStorage.getItem(simpleStorageKey);
      }
      
      if (savedVariations) {
        try {
          const parsedVariations = JSON.parse(savedVariations);
          console.log('Parsed variations:', parsedVariations);
          
          // Handle both formats - the new format and the simple format
          let textVariations: string[] = [];
          
          if (Array.isArray(parsedVariations)) {
            // Simple format: array of objects with 'value' property
            textVariations = parsedVariations
              .filter((v: any) => v.id !== 'original' && v.type === 'text')
              .map((v: any) => v.value);
          } else if (parsedVariations.variations) {
            // New format: object with variations array
            textVariations = parsedVariations.variations
              .filter((v: any) => v.id !== 'original' && v.type === 'text')
              .map((v: any) => v.value);
          }
          
          console.log('Setting generated text variations:', textVariations);
          setGeneratedTextVariations(textVariations);
        } catch (error) {
          console.error('Error parsing saved variations:', error);
          setGeneratedTextVariations([]);
        }
      } else {
        console.log('No saved variations found, clearing');
        setGeneratedTextVariations([]);
      }
    }
  }, [selectedElement]);

    console.log('Rendering variations modal with generatedTextVariations:', generatedTextVariations);
    
    return (
    <div className="variations-container">
      {selectedElement?.type === 'text' ? (
        /* Text Variations Modal */
        <div className="text-variations-content">
            {/* Variations Table */}
            <div className="variations-table">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #d9d9d9' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, width: '80px' }}>Key</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Value</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, width: '80px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Original text as first variation */}
                  <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <Input value="TO" style={{ width: '60px', textAlign: 'center' }} />
                    </td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <Input
                        value={selectedElement?.content || ''}
                        placeholder="Enter text content"
                        style={{ width: '100%' }}
                      />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />}
                      />
                    </td>
                  </tr>
                  
                  {/* Generated variations */}
                  {generatedTextVariations.map((text, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <Input value={`T${index + 1}`} style={{ width: '60px', textAlign: 'center' }} />
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <Input
                          value={text}
                          onChange={(e) => {
                            const newVariations = [...generatedTextVariations];
                            newVariations[index] = e.target.value;
                            setGeneratedTextVariations(newVariations);
                          }}
                          placeholder="Enter variation text"
                          style={{ width: '100%' }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteVariation(index)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <div className="add-variant-section">
            <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  style={{ 
                    width: '100%', 
                    backgroundColor: '#333', 
                    borderColor: '#333',
                    marginBottom: 16
                  }}
                  onClick={() => {
                    setGeneratedTextVariations([...generatedTextVariations, '']);
                  }}
                >
                  Add Variant
            </Button>
      </div>
              
              <div className="generate-buttons">
          <Button 
                  icon={<StarOutlined />}
                  loading={isGenerating}
                  onClick={() => generateTextVariations(selectedElement?.content || '')}
                  style={{ width: '100%', marginBottom: 8 }}
                >
                  Auto-generate Variants
          </Button>

      <Button
                  icon={<GlobalOutlined />}
                  loading={isGenerating}
                  onClick={() => generateTextVariations(selectedElement?.content || '', true)}
                  style={{ width: '100%', marginBottom: 8 }}
                >
                  Generate Language Variants
      </Button>
                
                          <Button
                  icon={<EditOutlined />}
                  style={{ width: '100%', marginBottom: 8 }}
                >
                  Bulk rename variants
                          </Button>

            <Button 
                  danger
                  icon={<DeleteOutlined />}
                  style={{ width: '100%' }}
                  onClick={() => {
                    setGeneratedTextVariations([]);
                    
                    // Update local storage to only keep original
                    if (selectedElement) {
                      const allVariations = [
                        {
                          id: 'original',
                          key: 'TO',
                          value: selectedElement.content,
                          type: 'text'
                        }
                      ];
                      
                      const storageKey = `variations_${selectedElement.id}`;
                      const simpleStorageKey = `simple_variations_${selectedElement.id}`;
                      
                      localStorage.setItem(storageKey, JSON.stringify(allVariations));
                      localStorage.setItem(simpleStorageKey, JSON.stringify(allVariations));
                      
                      // Update the element immediately
                      const updatedElement = {
                        ...selectedElement,
                        variations: allVariations
                      };
                      
                      const updatedElements = timelineElements.map(el => 
                        el.id === selectedElement.id ? updatedElement : el
                      );
                      
                      onVariationsChange(updatedElements);
                    }
                    
                    message.success('All variants deleted');
                  }}
                >
                  Delete All
            </Button>
          </div>
                    </div>
                  </div>
        ) : (
          /* Media Variations - Now handled by MediaVariationModal */
          <div className="media-variations-placeholder">
            <Text>Media variations are now handled by the new MediaVariationModal component.</Text>
            </div>
          )}
    </div>
  );
}; 

export default Variations; 