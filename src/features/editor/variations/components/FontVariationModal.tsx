import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Select, message, List, Card, Space, Typography, Divider, Tag } from 'antd';
import { 
  FontSizeOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  StarOutlined,
  CloseOutlined,
  CheckOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { TimelineElement, FontVariation } from '../types/variation-types';

const { Text, Title } = Typography;
const { Option } = Select;

interface FontVariationModalProps {
  isOpen: boolean;
  onClose: () => void;
  element: {
    id: string;
    elementType: 'font';
    elementName: string;
    currentVariationCount: number;
    variations: FontVariation[];
    originalContent: string;
  };
  onAddVariations: (variations: FontVariation[]) => void;
}

export const FontVariationModal: React.FC<FontVariationModalProps> = ({
  isOpen,
  onClose,
  element,
  onAddVariations,
}) => {
  const [fontVariations, setFontVariations] = useState<FontVariation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingVariation, setEditingVariation] = useState<string | null>(null);
  const [customFonts, setCustomFonts] = useState<any[]>([]);
  const [isLoadingCustomFonts, setIsLoadingCustomFonts] = useState(false);
  const [editForm, setEditForm] = useState({
    fontFamily: '',
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center' as 'left' | 'center' | 'right' | 'justify',
    opacity: 100
  });

  // Common font families for selection
  const commonFonts = [
    'Arial, sans-serif',
    'Helvetica, sans-serif',
    'Times New Roman, serif',
    'Georgia, serif',
    'Verdana, sans-serif',
    'Tahoma, sans-serif',
    'Trebuchet MS, sans-serif',
    'Impact, sans-serif',
    'Comic Sans MS, cursive',
    'Courier New, monospace',
    'Lucida Console, monospace',
    'Palatino, serif',
    'Garamond, serif',
    'Bookman, serif',
    'Avant Garde, sans-serif',
    'Helvetica Neue, sans-serif',
    'Roboto, sans-serif',
    'Open Sans, sans-serif',
    'Lato, sans-serif',
    'Montserrat, sans-serif',
    'Poppins, sans-serif',
    'Source Sans Pro, sans-serif',
    'Raleway, sans-serif',
    'Ubuntu, sans-serif',
    'Nunito, sans-serif'
  ];

  const fontWeightOptions = [
    { value: '100', label: 'Thin' },
    { value: '200', label: 'Extra Light' },
    { value: '300', label: 'Light' },
    { value: '400', label: 'Normal' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' },
    { value: '800', label: 'Extra Bold' },
    { value: '900', label: 'Black' }
  ];

  const textAlignOptions = [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right' },
    { value: 'justify', label: 'Justify' }
  ];

  // Load existing font variations when modal opens
  useEffect(() => {
    if (isOpen) {
      loadExistingVariations();
      loadCustomFonts();
    }
  }, [isOpen, element.id]);

  // Load custom fonts from backend
  const loadCustomFonts = async () => {
    setIsLoadingCustomFonts(true);
    try {
      const response = await fetch('/api/fonts/upload');
      if (response.ok) {
        const data = await response.json();
        setCustomFonts(data.fonts || []);
      } else {
        console.error('Failed to load custom fonts');
        setCustomFonts([]);
      }
    } catch (error) {
      console.error('Error loading custom fonts:', error);
      setCustomFonts([]);
    } finally {
      setIsLoadingCustomFonts(false);
    }
  };

  // Combine system fonts with custom fonts (custom fonts first)
  const getAllAvailableFonts = () => {
    const systemFonts = commonFonts.map(font => ({
      value: font,
      label: font,
      isCustom: false,
      fontUrl: null as string | null,
      fontData: null as any
    }));

    const customFontOptions = customFonts.map(font => ({
      value: font.family,
      label: `${font.full_name || font.family} (Custom)`,
      isCustom: true,
      fontUrl: font.url,
      fontData: font
    }));

    // Return custom fonts first, then system fonts
    return [...customFontOptions, ...systemFonts];
  };

  const loadExistingVariations = async () => {
    setIsLoading(true);
    try {
      // Get project ID from URL
      const projectId = window.location.pathname.split('/')[2];
      
      // Load font variations from backend
      const response = await fetch(`/api/projects/${projectId}/font-variations`);
      if (response.ok) {
        const data = await response.json();
        
        // Find variations for this specific element
        const elementVariations = data.fontVariations?.find((v: any) => v.elementId === element.id);
        if (elementVariations && elementVariations.variations) {
          setFontVariations(elementVariations.variations);
        } else {
          setFontVariations([]);
        }
      } else {
        setFontVariations([]);
      }
    } catch (error) {
      console.error('Error loading font variations:', error);
      setFontVariations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVariation = () => {
    // Create a new variation with default values and set it to editing mode
    const newVariation: FontVariation = {
      id: `font-variation-${Date.now()}`,
      content: 'New Font Style',
      type: 'manual',
      metadata: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        opacity: 100,
        fontStyle: 'normal',
        textDecoration: 'none',
        lineHeight: 1.2,
        letterSpacing: 'normal',
        textShadow: 'none'
      }
    };
    
    setFontVariations([...fontVariations, newVariation]);
    setEditingVariation(newVariation.id);
    setEditForm({
      fontFamily: 'Arial, sans-serif',
      fontSize: 48,
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: 'center',
      opacity: 100
    });
  };

  const handleSaveVariation = (variationId: string) => {
    // Check if a variation with the same font properties already exists (excluding current variation)
    const isDuplicate = fontVariations.some(variation => 
      variation.id !== variationId &&
      variation.metadata.fontFamily === editForm.fontFamily &&
      variation.metadata.fontSize === editForm.fontSize &&
      variation.metadata.fontWeight === editForm.fontWeight &&
      variation.metadata.color === editForm.color &&
      variation.metadata.textAlign === editForm.textAlign &&
      variation.metadata.opacity === editForm.opacity
    );

    if (isDuplicate) {
      message.warning('A font variation with these exact properties already exists!');
      return;
    }

    // Find the selected font data to check if it's custom
    const selectedFont = getAllAvailableFonts().find(font => font.value === editForm.fontFamily);
    
    const updatedVariations = fontVariations.map(variation => {
      if (variation.id === variationId) {
        return {
          ...variation,
          content: `${editForm.fontFamily} - ${editForm.fontSize}px - ${editForm.fontWeight}`,
          metadata: {
            ...variation.metadata,
            ...editForm,
            // Add custom font information if it's a custom font
            isCustomFont: selectedFont?.isCustom || false,
            customFontUrl: selectedFont?.fontUrl || null,
            customFontData: selectedFont?.fontData || null
          }
        };
      }
      return variation;
    });
    
    setFontVariations(updatedVariations);
    setEditingVariation(null);
    message.success('Font variation saved successfully!');
  };

  const handleDeleteVariation = async (variationId: string) => {
    setIsDeleting(variationId);
    try {
      // Get project ID from URL
      const projectId = window.location.pathname.split('/')[2];
      
      const response = await fetch(`/api/projects/${projectId}/font-variations`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variationId
        }),
      });

      if (response.ok) {
        const updatedVariations = fontVariations.filter(v => v.id !== variationId);
        setFontVariations(updatedVariations);
        message.success('Font variation deleted successfully!');
      } else {
        message.error('Failed to delete font variation');
      }
    } catch (error) {
      console.error('Error deleting font variation:', error);
      message.error('Error deleting font variation');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSaveAll = async () => {
    if (fontVariations.length === 0) {
      message.warning('No font variations to save!');
      return;
    }

    try {
      // Get project ID from URL
      const projectId = window.location.pathname.split('/')[2];
      
      // Save to backend
      const response = await fetch(`/api/projects/${projectId}/font-variations`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elementId: element.id,
          originalFont: element.originalContent,
          variations: fontVariations
        }),
      });

      if (response.ok) {
        message.success(`Added ${fontVariations.length} font variations successfully!`);
        onAddVariations(fontVariations);
        onClose();
      } else {
        message.error('Failed to save font variations');
      }
    } catch (error) {
      console.error('Error saving font variations:', error);
      message.error('Error saving font variations');
    }
  };

  const renderFontPreview = (variation: FontVariation) => {
    const style = {
      fontFamily: variation.metadata.fontFamily,
      fontSize: `${variation.metadata.fontSize}px`,
      fontWeight: variation.metadata.fontWeight,
      color: variation.metadata.color,
      textAlign: variation.metadata.textAlign,
      opacity: variation.metadata.opacity / 100,
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #e9ecef',
      minHeight: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: variation.metadata.textAlign === 'center' ? 'center' : 
                   variation.metadata.textAlign === 'right' ? 'flex-end' : 'flex-start'
    };

    // If it's a custom font, we need to load it dynamically
    const isCustomFont = (variation.metadata as any).isCustomFont;
    const customFontUrl = (variation.metadata as any).customFontUrl;

    return (
      <div>
        {/* Load custom font if it's a custom font */}
        {isCustomFont && customFontUrl && (
          <style>
            {`
              @font-face {
                font-family: '${variation.metadata.fontFamily}';
                src: url('${customFontUrl}') format('truetype');
                font-display: swap;
              }
            `}
          </style>
        )}
        
        <div style={style}>
          <Text style={{ 
            fontFamily: variation.metadata.fontFamily,
            fontSize: `${variation.metadata.fontSize}px`,
            fontWeight: variation.metadata.fontWeight,
            color: '#000000',
            opacity: variation.metadata.opacity / 100
          }}>
            Sample Text Preview
          </Text>
        </div>
        
        {/* Show custom font indicator */}
        {isCustomFont && (
          <Tag style={{ marginTop: '8px' }} color="blue">
            Custom Font
          </Tag>
        )}
      </div>
    );
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FontSizeOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
          <span style={{ fontSize: '16px', fontWeight: 600 }}>Font Variations - {element.elementName}</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      width={900}
      style={{ top: 20 }}
      destroyOnHidden={false}
      maskClosable={false}
      footer={[
        <Button key="cancel" onClick={onClose} size="large">
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={handleSaveAll} size="large">
          Save All Variations ({fontVariations.length})
        </Button>
      ]}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Header Info */}
        <div style={{ 
          backgroundColor: '#f0f2f5', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #d9d9d9'
        }}>
          <Text type="secondary">
            Create different font styles for your text element. Each variation will be applied to generate multiple versions of your video.
          </Text>
        </div>

        {/* Add New Variation Button */}
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleAddVariation}
          style={{ 
            width: '100%', 
            height: '56px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: 500
          }}
          loading={isLoadingCustomFonts}
        >
          {isLoadingCustomFonts ? 'Loading Fonts...' : 'Add New Font Variation'}
        </Button>

        {/* Variations List */}
        <div>
          {fontVariations.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              backgroundColor: '#fafafa',
              borderRadius: '8px',
              border: '2px dashed #d9d9d9'
            }}>
              <FontSizeOutlined style={{ fontSize: '48px', color: '#bfbfbf', marginBottom: '16px' }} />
              <div style={{ fontSize: '16px', color: '#8c8c8c', marginBottom: '8px' }}>No font variations yet</div>
              <div style={{ fontSize: '14px', color: '#bfbfbf' }}>Click "Add New Font Variation" to get started</div>
            </div>
          ) : (
            fontVariations.map((variation, index) => (
              <Card
                key={variation.id}
                style={{ 
                  marginBottom: '16px',
                  border: '1px solid #e8e8e8',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
                bodyStyle={{ padding: '20px' }}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Text strong style={{ fontSize: '14px' }}>Variation {index + 1}</Text>
                      {(variation.metadata as any).isCustomFont && (
                        <Tag color="blue">Custom Font</Tag>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {editingVariation === variation.id ? (
                        <>
                          <Button
                            type="primary"
                            size="small"
                            icon={<CheckOutlined />}
                            onClick={() => handleSaveVariation(variation.id)}
                          >
                            Save
                          </Button>
                          <Button
                            size="small"
                            icon={<CloseOutlined />}
                            onClick={() => {
                              setEditingVariation(null);
                              // If this is a new variation (content is "New Font Style"), remove it
                              if (variation.content === 'New Font Style') {
                                setFontVariations(fontVariations.filter(v => v.id !== variation.id));
                              }
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                              setEditingVariation(variation.id);
                              setEditForm({
                                fontFamily: variation.metadata.fontFamily,
                                fontSize: variation.metadata.fontSize,
                                fontWeight: variation.metadata.fontWeight,
                                color: variation.metadata.color,
                                textAlign: variation.metadata.textAlign,
                                opacity: variation.metadata.opacity
                              });
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            loading={isDeleting === variation.id}
                            onClick={() => handleDeleteVariation(variation.id)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                }
              >
                {editingVariation === variation.id ? (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '13px' }}>Font Family</label>
                        <Select
                          value={editForm.fontFamily}
                          onChange={(value) => setEditForm({...editForm, fontFamily: value})}
                          style={{ width: '100%' }}
                          showSearch
                          placeholder="Select font family"
                          loading={isLoadingCustomFonts}
                          size="middle"
                        >
                          {getAllAvailableFonts().map(font => (
                            <Option key={font.value} value={font.value}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ 
                                  fontFamily: font.value,
                                  color: font.isCustom ? '#1890ff' : '#000'
                                }}>
                                  {font.label}
                                </span>
                                {font.isCustom && (
                                  <Tag color="blue">Custom</Tag>
                                )}
                              </div>
                            </Option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '13px' }}>Font Size</label>
                        <Input
                          type="number"
                          value={editForm.fontSize}
                          onChange={(e) => setEditForm({...editForm, fontSize: parseInt(e.target.value) || 48})}
                          min={8}
                          max={200}
                          suffix="px"
                          size="middle"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '13px' }}>Font Weight</label>
                        <Select
                          value={editForm.fontWeight}
                          onChange={(value) => setEditForm({...editForm, fontWeight: value})}
                          style={{ width: '100%' }}
                          size="middle"
                        >
                          {fontWeightOptions.map(option => (
                            <Option key={option.value} value={option.value}>
                              {option.label}
                            </Option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '13px' }}>Text Alignment</label>
                        <Select
                          value={editForm.textAlign}
                          onChange={(value) => setEditForm({...editForm, textAlign: value})}
                          style={{ width: '100%' }}
                          size="middle"
                        >
                          {textAlignOptions.map(option => (
                            <Option key={option.value} value={option.value}>
                              {option.label}
                            </Option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '13px' }}>Text Color</label>
                        <Input
                          type="color"
                          value={editForm.color}
                          onChange={(e) => setEditForm({...editForm, color: e.target.value})}
                          style={{ width: '100%', height: '32px' }}
                          size="middle"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '13px' }}>Opacity</label>
                        <Input
                          type="number"
                          value={editForm.opacity}
                          onChange={(e) => setEditForm({...editForm, opacity: parseInt(e.target.value) || 100})}
                          min={0}
                          max={100}
                          suffix="%"
                          size="middle"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <EyeOutlined style={{ color: '#666' }} />
                        <Text strong style={{ fontSize: '13px' }}>Preview:</Text>
                      </div>
                      {renderFontPreview(variation)}
                    </div>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                      gap: '8px',
                      fontSize: '12px',
                      color: '#666',
                      backgroundColor: '#f8f9fa',
                      padding: '12px',
                      borderRadius: '6px'
                    }}>
                      <div><strong>Font:</strong> {variation.metadata.fontFamily}</div>
                      <div><strong>Size:</strong> {variation.metadata.fontSize}px</div>
                      <div><strong>Weight:</strong> {variation.metadata.fontWeight}</div>
                      <div><strong>Align:</strong> {variation.metadata.textAlign}</div>
                      <div><strong>Opacity:</strong> {variation.metadata.opacity}%</div>
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

export default FontVariationModal;