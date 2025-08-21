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
      
      // Automatically save the variations to backend
      if (selectedElement) {
        // Save to backend
        await saveTextVariations(selectedElement.id, selectedElement.content, response.variations);

        // Update the element with new variations
        const allVariations = [
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

        const updatedElement = {
          ...selectedElement,
          variations: allVariations
        };

        const updatedElements = timelineElements.map(el => 
          el.id === selectedElement.id ? updatedElement : el
        );
        
        onVariationsChange(updatedElements);
        
        message.success(`Generated and saved ${response.variations.length} variations!`);
      }
      
    } catch (error) {
      message.error('Failed to generate variations');
    } finally {
      setIsGenerating(false);
    }
  };

  // Load variations from backend when element is selected
  useEffect(() => {
    if (selectedElement) {
      loadTextVariations(selectedElement.id);
    }
  }, [selectedElement]);

  const saveTextVariations = async (elementId: string, originalText: string, variations: string[]) => {
    if (!selectedElement) return;

    try {
      // Get project ID from URL
      const projectId = window.location.pathname.split('/')[2];
      
      // Save to backend
      const response = await fetch(`/api/projects/${projectId}/text-variations`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elementId,
          originalText,
          variations: variations.map((text, index) => ({
            id: `variation-${index}`,
            text,
            language: 'English',
            style: {}
          }))
        }),
      });

      if (response.ok) {
        console.log('Text variations saved to backend for element:', elementId);
        message.success('Variations saved successfully!');
      } else {
        console.error('Failed to save text variations to backend');
        message.error('Failed to save variations');
      }
    } catch (error) {
      console.error('Error saving text variations:', error);
      message.error('Error saving variations');
    }
  };

  const loadTextVariations = async (elementId: string) => {
    if (!selectedElement) return [];

    try {
      // Get project ID from URL
      const projectId = window.location.pathname.split('/')[2];
      
      const response = await fetch(`/api/projects/${projectId}/text-variations`);
      if (response.ok) {
        const data = await response.json();
        const elementVariations = data.textVariations.find((v: any) => v.elementId === elementId);
        if (elementVariations) {
          const loadedVariations = elementVariations.variations.map((v: any) => v.text);
          setGeneratedTextVariations(loadedVariations);
          return loadedVariations;
        }
      }
    } catch (error) {
      console.error('Error loading text variations:', error);
    }
    return [];
  };

  const saveVariations = async () => {
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

      // Save to backend
      await saveTextVariations(selectedElement.id, selectedElement.content, generatedTextVariations);

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

  const handleDeleteVariation = async (index: number) => {
    const newVariations = generatedTextVariations.filter((_, i) => i !== index);
    setGeneratedTextVariations(newVariations);
    
    // Save updated variations to backend
    if (selectedElement) {
      await saveTextVariations(selectedElement.id, selectedElement.content, newVariations);
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
                        readOnly
                      />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                      {/* No delete button for original text */}
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