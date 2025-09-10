import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Select, message, Card, Typography, Tooltip, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, PlayCircleOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { TimelineElement, SpeedVariation } from '../types/variation-types';

const { Text } = Typography;
const { Option } = Select;

interface SpeedVariationModalProps {
  isOpen: boolean;
  onClose: () => void;
  element: TimelineElement;
  onAddVariations: (variations: SpeedVariation[]) => Promise<void>;
}

export const SpeedVariationModal: React.FC<SpeedVariationModalProps> = ({
  isOpen,
  onClose,
  element,
  onAddVariations,
}) => {
  const [speedVariations, setSpeedVariations] = useState<SpeedVariation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingVariation, setEditingVariation] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    speed: 1.0,
    label: 'Normal Speed'
  });

  // Common speed presets
  const speedPresets = [
    { value: 0.25, label: '0.25x', description: 'Very Slow', category: 'slow' },
    { value: 0.5, label: '0.5x', description: 'Slow', category: 'slow' },
    { value: 0.75, label: '0.75x', description: 'Slightly Slow', category: 'slow' },
    { value: 1.0, label: '1.0x', description: 'Normal Speed', category: 'normal' },
    { value: 1.25, label: '1.25x', description: 'Slightly Fast', category: 'fast' },
    { value: 1.5, label: '1.5x', description: 'Fast', category: 'fast' },
    { value: 2.0, label: '2.0x', description: 'Very Fast', category: 'fast' },
    { value: 3.0, label: '3.0x', description: 'Ultra Fast', category: 'fast' },
    { value: 4.0, label: '4.0x', description: 'Extreme Speed', category: 'fast' }
  ];

  // Load existing speed variations when modal opens
  useEffect(() => {
    if (isOpen) {
      loadExistingVariations();
    }
  }, [isOpen, element.id]);

  const loadExistingVariations = async () => {
    setIsLoading(true);
    try {
      // Get project ID from URL
      const pathParts = window.location.pathname.split('/');
      const projectId = pathParts[2]; // Assuming URL is /edit/[projectId]/...

      if (!projectId) {
        console.error('Project ID not found in URL');
        return;
      }

      const response = await fetch(`/api/projects/${projectId}/speed-variations`);
      if (response.ok) {
        const data = await response.json();
        const elementVariations = data.speedVariations?.find((v: any) => v.elementId === element.id);
        if (elementVariations && elementVariations.variations.length > 0) {
          setSpeedVariations(elementVariations.variations);
        } else {
          setSpeedVariations([]);
        }
      } else {
        console.error('Failed to load speed variations');
        setSpeedVariations([]);
      }
    } catch (error) {
      console.error('Error loading speed variations:', error);
      setSpeedVariations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVariation = () => {
    const newVariation: SpeedVariation = {
      id: `speed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: `1.0x - Normal Speed`,
      type: 'manual',
      metadata: {
        speed: 1.0,
        label: 'Normal Speed',
        duration: 0, // Will be calculated based on original duration
        description: 'Normal playback speed'
      }
    };

    setSpeedVariations([...speedVariations, newVariation]);
    setEditingVariation(newVariation.id);
    setEditForm({
      speed: 1.0,
      label: 'Normal Speed'
    });
  };

  const handleEditVariation = (variation: SpeedVariation) => {
    setEditingVariation(variation.id);
    setEditForm({
      speed: variation.metadata.speed,
      label: variation.metadata.label
    });
  };

  const handleSaveVariation = (variationId: string) => {
    // Check for duplicates
    const isDuplicate = speedVariations.some(v => 
      v.id !== variationId && v.metadata.speed === editForm.speed
    );

    if (isDuplicate) {
      message.warning('A speed variation with this speed already exists!');
      return;
    }

    const updatedVariations = speedVariations.map(variation => {
      if (variation.id === variationId) {
        return {
          ...variation,
          content: `${editForm.speed}x - ${editForm.label}`,
          metadata: {
            ...variation.metadata,
            speed: editForm.speed,
            label: editForm.label,
            description: speedPresets.find(p => p.value === editForm.speed)?.description || 'Custom speed'
          }
        };
      }
      return variation;
    });
    
    setSpeedVariations(updatedVariations);
    setEditingVariation(null);
    message.success('Speed variation saved successfully!');
  };

  const handleDeleteVariation = async (variationId: string) => {
    setIsDeleting(variationId);
    try {
      // Get project ID from URL
      const pathParts = window.location.pathname.split('/');
      const projectId = pathParts[2];

      if (!projectId) {
        console.error('Project ID not found in URL');
        return;
      }

      const response = await fetch(`/api/projects/${projectId}/speed-variations`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variationId })
      });

      if (response.ok) {
        setSpeedVariations(speedVariations.filter(v => v.id !== variationId));
        message.success('Speed variation deleted successfully');
      } else {
        message.error('Failed to delete speed variation');
      }
    } catch (error) {
      console.error('Error deleting speed variation:', error);
      message.error('Error deleting speed variation');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSaveAll = async () => {
    if (speedVariations.length === 0) {
      message.warning('No speed variations to save!');
      return;
    }

    try {
      await onAddVariations(speedVariations);
      message.success('Speed variations saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving speed variations:', error);
      message.error('Error saving speed variations');
    }
  };

  const getSpeedColor = (speed: number) => {
    if (speed < 1.0) return '#52c41a'; // Green for slow
    if (speed === 1.0) return '#1890ff'; // Blue for normal
    return '#ff4d4f'; // Red for fast
  };

  const getSpeedTag = (speed: number) => {
    if (speed < 1.0) return { color: 'green', text: 'SLOW' };
    if (speed === 1.0) return { color: 'blue', text: 'NORMAL' };
    return { color: 'red', text: 'FAST' };
  };

  const renderSpeedPreview = (variation: SpeedVariation) => {
    const speed = variation.metadata.speed;
    const speedTag = getSpeedTag(speed);
    
    return (
      <div style={{ 
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        textAlign: 'center'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <PlayCircleOutlined style={{ 
            color: getSpeedColor(speed),
            fontSize: '24px'
          }} />
          <Text strong style={{ 
            color: getSpeedColor(speed),
            fontSize: '20px'
          }}>
            {speed}x
          </Text>
          <Tag color={speedTag.color} style={{ margin: 0 }}>
            {speedTag.text}
          </Tag>
        </div>
        <Text type="secondary" style={{ fontSize: '14px' }}>
          {variation.metadata.label}
        </Text>
      </div>
    );
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PlayCircleOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
          <span style={{ fontSize: '16px', fontWeight: 600 }}>Speed Variations - {element.elementName}</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      width={800}
      style={{ top: 20 }}
      destroyOnHidden={false}
      maskClosable={false}
      footer={[
        <Button key="cancel" onClick={onClose} size="large">
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={handleSaveAll} loading={isLoading} size="large">
          Save All Variations ({speedVariations.length})
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
            Create different playback speeds for your video element. Each speed variation will multiply your total video combinations.
          </Text>
        </div>

        {/* Quick Speed Presets */}
        <div style={{ marginBottom: '20px' }}>
          <Text strong style={{ display: 'block', marginBottom: '12px', fontSize: '14px' }}>
            Quick Add Common Speeds:
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {speedPresets.slice(0, 6).map(preset => {
              const exists = speedVariations.some(v => v.metadata.speed === preset.value);
              return (
                <Button
                  key={preset.value}
                  size="small"
                  disabled={exists}
                  onClick={() => {
                    const newVariation: SpeedVariation = {
                      id: `speed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      content: `${preset.value}x - ${preset.description}`,
                      type: 'manual',
                      metadata: {
                        speed: preset.value,
                        label: preset.description,
                        duration: 0,
                        description: preset.description
                      }
                    };
                    setSpeedVariations([...speedVariations, newVariation]);
                    message.success(`Added ${preset.label} speed variation`);
                  }}
                  style={{ 
                    borderColor: getSpeedColor(preset.value),
                    color: exists ? '#bfbfbf' : getSpeedColor(preset.value)
                  }}
                >
                  {preset.label} {exists && '✓'}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Add Custom Variation Button */}
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
        >
          Add Custom Speed Variation
        </Button>

        {/* Variations List */}
        <div>
          {speedVariations.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              backgroundColor: '#fafafa',
              borderRadius: '8px',
              border: '2px dashed #d9d9d9'
            }}>
              <PlayCircleOutlined style={{ fontSize: '48px', color: '#bfbfbf', marginBottom: '16px' }} />
              <div style={{ fontSize: '16px', color: '#8c8c8c', marginBottom: '8px' }}>No speed variations yet</div>
              <div style={{ fontSize: '14px', color: '#bfbfbf' }}>Use quick presets above or add a custom variation</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {speedVariations.map((variation, index) => (
                <Card
                  key={variation.id}
                  style={{ 
                    border: '1px solid #e8e8e8',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}
                  bodyStyle={{ padding: '16px' }}
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text strong style={{ fontSize: '14px' }}>Variation {index + 1}</Text>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {editingVariation === variation.id ? (
                          <>
                            <Button
                              type="primary"
                              size="small"
                              icon={<CheckOutlined />}
                              onClick={() => handleSaveVariation(variation.id)}
                            />
                            <Button
                              size="small"
                              icon={<CloseOutlined />}
                              onClick={() => {
                                setEditingVariation(null);
                                // If this is a new variation, remove it
                                if (variation.content.includes('Normal Speed') && speedVariations.filter(v => v.content.includes('Normal Speed')).length > 1) {
                                  setSpeedVariations(speedVariations.filter(v => v.id !== variation.id));
                                }
                              }}
                            />
                          </>
                        ) : (
                          <>
                            <Tooltip title="Edit">
                              <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => handleEditVariation(variation)}
                              />
                            </Tooltip>
                            <Tooltip title="Delete">
                              <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                loading={isDeleting === variation.id}
                                onClick={() => handleDeleteVariation(variation.id)}
                              />
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </div>
                  }
                >
                  {editingVariation === variation.id ? (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '13px' }}>Speed Multiplier</label>
                          <Select
                            value={editForm.speed}
                            onChange={(value) => {
                              const preset = speedPresets.find(p => p.value === value);
                              setEditForm({
                                speed: value,
                                label: preset?.description || 'Custom Speed'
                              });
                            }}
                            style={{ width: '100%' }}
                            placeholder="Select speed"
                            size="middle"
                          >
                            {speedPresets.map(preset => (
                              <Option key={preset.value} value={preset.value}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ color: getSpeedColor(preset.value), fontWeight: 500 }}>
                                    {preset.label}
                                  </span>
                                  <span style={{ fontSize: '12px', color: '#666' }}>
                                    {preset.description}
                                  </span>
                                </div>
                              </Option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '13px' }}>Custom Label</label>
                          <Input
                            value={editForm.label}
                            onChange={(e) => setEditForm({...editForm, label: e.target.value})}
                            placeholder="Enter custom label"
                            size="middle"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ marginBottom: '12px' }}>
                        <Text strong style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>
                          {variation.content}
                        </Text>
                        {renderSpeedPreview(variation)}
                      </div>
                      <div style={{ 
                        fontSize: '12px',
                        color: '#666',
                        backgroundColor: '#f8f9fa',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        textAlign: 'center'
                      }}>
                        {variation.metadata.description}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Info Footer */}
        {speedVariations.length > 0 && (
          <div style={{ 
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#e6f7ff',
            borderRadius: '8px',
            border: '1px solid #91d5ff'
          }}>
            <Text style={{ fontSize: '13px' }}>
              <strong>Impact:</strong> You have {speedVariations.length} speed variation{speedVariations.length !== 1 ? 's' : ''}. 
              This will multiply your video combinations by {speedVariations.length}x.
            </Text>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SpeedVariationModal;