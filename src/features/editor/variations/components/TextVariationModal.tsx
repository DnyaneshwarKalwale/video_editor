import React, { useState, useEffect } from 'react';
import { Button, Modal, Input, message } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, StarOutlined, GlobalOutlined } from '@ant-design/icons';
import { TimelineElement } from '../types/variation-types';
import { AIVariationService } from '../services/ai-variation-service';

interface TextVariationModalProps {
  isOpen: boolean;
  onClose: () => void;
  element: TimelineElement;
  onAddVariations: (variations: any[]) => void;
}

const { Text } = require('antd');

export const TextVariationModal: React.FC<TextVariationModalProps> = ({
  isOpen,
  onClose,
  element,
  onAddVariations,
}) => {
  const [generatedTextVariations, setGeneratedTextVariations] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('Spanish');

  const aiService = AIVariationService.getInstance();

  // AI Text Generation Prompts
  const generateTextVariations = async (originalText: string, isLanguageVariation: boolean = false) => {
    setIsGenerating(true);
    
    try {
      // Clear any existing variations first
      setGeneratedTextVariations([]);
      
      const response = await aiService.generateTextVariations({
        originalText: originalText,
        variationType: isLanguageVariation ? 'language' : 'auto',
        targetLanguage: isLanguageVariation ? targetLanguage : undefined,
        count: 10
      });

      setGeneratedTextVariations(response.variations);
      
      // Automatically save the variations to localStorage with proper format
      const allVariations = [
        {
          id: 'original',
          key: 'TO',
          value: originalText,
          type: 'text'
        },
        ...response.variations.map((text, index) => ({
          id: `variation-${index}`,
          key: `T${index + 1}`,
          value: text,
          type: 'text'
        }))
      ];

      // Save to local storage in the simple format for sidebar display
      const simpleStorageKey = `simple_variations_${element.id}`;
      localStorage.setItem(simpleStorageKey, JSON.stringify(allVariations));

      // Call the callback to update parent component
      onAddVariations(allVariations);
      
      message.success(`Generated and saved ${response.variations.length} text variations successfully!`);
    } catch (error) {
      message.error('Failed to generate variations');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteVariation = (index: number) => {
    const newVariations = generatedTextVariations.filter((_, i) => i !== index);
    setGeneratedTextVariations(newVariations);
    
    // Update local storage immediately
    const allVariations = [
      {
        id: 'original',
        key: 'TO',
        value: element.originalContent as string,
        type: 'text'
      },
      ...newVariations.map((text, idx) => ({
        id: `variation-${idx}`,
        key: `T${idx + 1}`,
        value: text,
        type: 'text'
      }))
    ];
    
    const simpleStorageKey = `simple_variations_${element.id}`;
    localStorage.setItem(simpleStorageKey, JSON.stringify(allVariations));
    
    // Call the callback to update parent component
    onAddVariations(allVariations);
  };

  const handleClose = () => {
    setGeneratedTextVariations([]);
    setIsGenerating(false);
    onClose();
  };

  return (
    <Modal
      title="Add Text Variants"
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={1200}
      style={{ top: 20 }}
      destroyOnHidden={true}
      maskClosable={false}
    >
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
                    value={element.originalContent as string || ''}
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
              onClick={() => generateTextVariations(element.originalContent as string || '')}
              style={{ width: '100%', marginBottom: 8 }}
            >
              Auto-generate Variants
            </Button>

            <Button
              icon={<GlobalOutlined />}
              loading={isGenerating}
              onClick={() => generateTextVariations(element.originalContent as string || '', true)}
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
                const allVariations = [
                  {
                    id: 'original',
                    key: 'TO',
                    value: element.originalContent as string,
                    type: 'text'
                  }
                ];
                
                const simpleStorageKey = `simple_variations_${element.id}`;
                localStorage.setItem(simpleStorageKey, JSON.stringify(allVariations));
                
                // Call the callback to update parent component
                onAddVariations(allVariations);
                
                message.success('All variants deleted');
              }}
            >
              Delete All
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
