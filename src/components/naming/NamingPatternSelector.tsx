import React, { useState, useEffect } from 'react';
import { Modal, Button, Select, Input, Card, Typography, Space, Divider, Alert, Form } from 'antd';
import {
  SettingOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import {
  NamingPattern,
  DEFAULT_NAMING_PATTERNS,
  createCustomNamingPattern,
  getUserNamingPattern,
  saveUserNamingPattern,
  generateVariationIdentifier
} from '@/utils/naming-patterns';

const { Text, Title } = Typography;
const { Option } = Select;

interface NamingPatternSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onPatternChange?: (pattern: NamingPattern) => void;
}

export const NamingPatternSelector: React.FC<NamingPatternSelectorProps> = ({
  isOpen,
  onClose,
  onPatternChange
}) => {
  const [selectedPattern, setSelectedPattern] = useState<NamingPattern>(getUserNamingPattern());
  const [customPatterns, setCustomPatterns] = useState<NamingPattern[]>([]);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customForm, setCustomForm] = useState({
    name: '',
    originalLabel: '',
    variationLabels: ['', '', '']
  });

  useEffect(() => {
    if (isOpen) {
      // Load saved custom patterns
      loadCustomPatterns();
    }
  }, [isOpen]);

  const loadCustomPatterns = () => {
    try {
      const saved = localStorage.getItem('video-editor-custom-naming-patterns');
      if (saved) {
        setCustomPatterns(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading custom patterns:', error);
    }
  };

  const saveCustomPatterns = (patterns: NamingPattern[]) => {
    try {
      localStorage.setItem('video-editor-custom-naming-patterns', JSON.stringify(patterns));
    } catch (error) {
      console.error('Error saving custom patterns:', error);
    }
  };

  const handlePatternSelect = (patternId: string) => {
    const allPatterns = [...DEFAULT_NAMING_PATTERNS, ...customPatterns];
    const pattern = allPatterns.find(p => p.id === patternId);
    if (pattern) {
      setSelectedPattern(pattern);
    }
  };

  const handleSavePattern = () => {
    saveUserNamingPattern(selectedPattern);
    onPatternChange?.(selectedPattern);
    onClose();
  };

  const handleCreateCustomPattern = () => {
    if (!customForm.name || !customForm.originalLabel) {
      return;
    }

    const filteredLabels = customForm.variationLabels.filter(label => label.trim() !== '');
    if (filteredLabels.length === 0) {
      return;
    }

    const newPattern = createCustomNamingPattern(
      customForm.name,
      customForm.originalLabel,
      filteredLabels,
      `Custom pattern: ${customForm.originalLabel}, ${filteredLabels.join(', ')}`
    );

    const updatedCustomPatterns = [...customPatterns, newPattern];
    setCustomPatterns(updatedCustomPatterns);
    saveCustomPatterns(updatedCustomPatterns);

    // Reset form
    setCustomForm({
      name: '',
      originalLabel: '',
      variationLabels: ['', '', '']
    });
    setIsCreatingCustom(false);

    // Auto-select the new pattern
    setSelectedPattern(newPattern);
  };

  const handleDeleteCustomPattern = (patternId: string) => {
    const updatedCustomPatterns = customPatterns.filter(p => p.id !== patternId);
    setCustomPatterns(updatedCustomPatterns);
    saveCustomPatterns(updatedCustomPatterns);

    // If the deleted pattern was selected, switch to default
    if (selectedPattern.id === patternId) {
      setSelectedPattern(DEFAULT_NAMING_PATTERNS[0]);
    }
  };

  const renderPatternPreview = (pattern: NamingPattern) => {
    const previews = [];

    // Show original
    previews.push({
      label: 'Original',
      example: generateVariationIdentifier(pattern, 0, true)
    });

    // Show first few variations
    for (let i = 1; i <= Math.min(4, (pattern.customLabels?.length || 5)); i++) {
      previews.push({
        label: `Variation ${i}`,
        example: generateVariationIdentifier(pattern, i)
      });
    }

    return (
      <div style={{
        padding: '12px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        border: '1px solid #e9ecef'
      }}>
        <Text strong style={{ fontSize: '13px', marginBottom: '8px', display: 'block' }}>
          Preview for all elements:
        </Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', fontSize: '12px' }}>
          {previews.map(({ label, example }, index) => (
            <div key={index}>
              <div style={{ color: '#666', marginBottom: '2px' }}>{label}:</div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                <div>{example}-video</div>
                <div>{example}-text</div>
                <div>{example}-audio</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const allPatterns = [...DEFAULT_NAMING_PATTERNS, ...customPatterns];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingOutlined style={{ color: '#1890ff' }} />
          <span>Naming Pattern Settings</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      width={700}
      style={{ top: 20 }}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={handleSavePattern}>
          Apply Pattern
        </Button>
      ]}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <Alert
          message="Naming Pattern Configuration"
          description="Choose how your variations will be named. This affects all elements (video, audio, text, images, fonts, speed) across your entire project."
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />

        <div style={{ marginBottom: '20px' }}>
          <Text strong>Select Pattern:</Text>
          <Select
            value={selectedPattern.id}
            onChange={handlePatternSelect}
            style={{ width: '100%', marginTop: '8px' }}
            placeholder="Choose a naming pattern"
          >
            <Option disabled style={{ fontSize: '12px', color: '#999' }}>
              — Built-in Patterns —
            </Option>
            {DEFAULT_NAMING_PATTERNS.map(pattern => (
              <Option key={pattern.id} value={pattern.id}>
                {pattern.name}
              </Option>
            ))}
            {customPatterns.length > 0 && (
              <>
                <Option disabled style={{ fontSize: '12px', color: '#999' }}>
                  — Custom Patterns —
                </Option>
                {customPatterns.map(pattern => (
                  <Option key={pattern.id} value={pattern.id}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{pattern.name}</span>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomPattern(pattern.id);
                        }}
                        style={{ marginLeft: '8px' }}
                      />
                    </div>
                  </Option>
                ))}
              </>
            )}
          </Select>
        </div>

        <Card style={{ marginBottom: '20px' }}>
          <Title level={5}>Current Selection: {selectedPattern.name}</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: '12px' }}>
            {selectedPattern.description}
          </Text>
          {renderPatternPreview(selectedPattern)}
        </Card>

        <Divider />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <Text strong>Create Custom Pattern</Text>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => setIsCreatingCustom(true)}
              disabled={isCreatingCustom}
            >
              Add Custom
            </Button>
          </div>

          {isCreatingCustom && (
            <Card style={{ border: '1px solid #1890ff' }}>
              <Form layout="vertical">
                <Form.Item label="Pattern Name" required>
                  <Input
                    placeholder="e.g., Project Phases"
                    value={customForm.name}
                    onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                  />
                </Form.Item>

                <Form.Item label="Original/Main Label" required>
                  <Input
                    placeholder="e.g., Main, Original, Alpha"
                    value={customForm.originalLabel}
                    onChange={(e) => setCustomForm({ ...customForm, originalLabel: e.target.value })}
                  />
                </Form.Item>

                <Form.Item label="Variation Labels" required>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                    Enter labels for your variations (at least one required):
                  </Text>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {customForm.variationLabels.map((label, index) => (
                      <Input
                        key={index}
                        placeholder={`Variation ${index + 1} (e.g., ${['Beta', 'Gamma', 'Delta'][index]})`}
                        value={label}
                        onChange={(e) => {
                          const newLabels = [...customForm.variationLabels];
                          newLabels[index] = e.target.value;
                          setCustomForm({ ...customForm, variationLabels: newLabels });
                        }}
                      />
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => setCustomForm({
                        ...customForm,
                        variationLabels: [...customForm.variationLabels, '']
                      })}
                      style={{ width: '100%' }}
                    >
                      Add More Labels
                    </Button>
                  </Space>
                </Form.Item>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Button
                    icon={<CloseOutlined />}
                    onClick={() => {
                      setIsCreatingCustom(false);
                      setCustomForm({
                        name: '',
                        originalLabel: '',
                        variationLabels: ['', '', '']
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={handleCreateCustomPattern}
                    disabled={!customForm.name || !customForm.originalLabel || customForm.variationLabels.every(label => !label.trim())}
                  >
                    Create Pattern
                  </Button>
                </div>
              </Form>
            </Card>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default NamingPatternSelector;