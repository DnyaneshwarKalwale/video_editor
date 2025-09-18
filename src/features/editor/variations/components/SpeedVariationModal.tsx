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
  const [customSpeed, setCustomSpeed] = useState('1.0');


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
    const speedValue = parseFloat(customSpeed);
    if (isNaN(speedValue) || speedValue < 0.1 || speedValue > 2.0) {
      message.error('Please enter a valid speed between 0.1 and 2.0');
      return;
    }
    
    const exists = speedVariations.some(v => Math.abs(v.metadata.speed - speedValue) < 0.01);
    if (exists) {
      message.error('This speed already exists');
      return;
    }

    const newVariation: SpeedVariation = {
      id: `speed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: `${speedValue}x - ${editForm.label || 'Custom Speed'}`,
      type: 'manual',
      metadata: {
        speed: speedValue,
        label: editForm.label || 'Custom Speed',
        duration: 0,
        description: editForm.label || 'Custom Speed'
      }
    };

    setSpeedVariations([...speedVariations, newVariation]);
    setEditingVariation(newVariation.id);
    setEditForm({
      speed: speedValue,
      label: editForm.label || 'Custom Speed'
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
            description: editForm.label || 'Custom speed'
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
            Create different playback speeds for your video element. Enter any speed value between 0.1x (very slow) and 2.0x (very fast). Each speed variation will multiply your total video combinations.
          </Text>
        </div>

        {/* Custom Speed Input */}
        <div style={{ marginBottom: '20px' }}>
          <Text strong style={{ display: 'block', marginBottom: '12px', fontSize: '14px' }}>
            Add Custom Speed:
          </Text>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '13px' }}>
                Speed Value (0.1 to 2.0)
              </label>
              <Input
                type="number"
                value={customSpeed}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomSpeed(value);
                }}
                placeholder="Enter speed (e.g., 1.1, 0.9, 1.5)"
                min="0.1"
                max="2.0"
                step="0.1"
                style={{ width: '100%' }}
                size="middle"
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Range: 0.1x (very slow) to 2.0x (very fast)
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '13px' }}>
                Label (Optional)
              </label>
              <Input
                value={editForm.label}
                onChange={(e) => setEditForm({...editForm, label: e.target.value})}
                placeholder="Enter custom label"
                size="middle"
              />
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                const speedValue = parseFloat(customSpeed);
                if (isNaN(speedValue) || speedValue < 0.1 || speedValue > 2.0) {
                  message.error('Please enter a valid speed between 0.1 and 2.0');
                  return;
                }
                
                const exists = speedVariations.some(v => Math.abs(v.metadata.speed - speedValue) < 0.01);
                if (exists) {
                  message.error('This speed already exists');
                  return;
                }

                const newVariation: SpeedVariation = {
                  id: `speed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  content: `${speedValue}x - ${editForm.label || 'Custom Speed'}`,
                  type: 'manual',
                  metadata: {
                    speed: speedValue,
                    label: editForm.label || 'Custom Speed',
                    duration: 0,
                    description: editForm.label || 'Custom Speed'
                  }
                };
                setSpeedVariations([...speedVariations, newVariation]);
                message.success(`Added ${speedValue}x speed variation`);
                setCustomSpeed('1.0');
                setEditForm({ speed: 1.0, label: 'Normal Speed' });
              }}
              size="middle"
              style={{ height: '32px' }}
            >
              Add Speed
            </Button>
          </div>
        </div>


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
              <div style={{ fontSize: '14px', color: '#bfbfbf' }}>Enter a custom speed value above to get started</div>
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
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '13px' }}>Speed Value (0.1 to 2.0)</label>
                          <Input
                            type="number"
                            value={editForm.speed}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              if (!isNaN(value) && value >= 0.1 && value <= 2.0) {
                                setEditForm({
                                  speed: value,
                                  label: editForm.label
                                });
                              }
                            }}
                            placeholder="Enter speed (e.g., 1.1, 0.9, 1.5)"
                            min="0.1"
                            max="2.0"
                            step="0.1"
                            style={{ width: '100%' }}
                            size="middle"
                          />
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