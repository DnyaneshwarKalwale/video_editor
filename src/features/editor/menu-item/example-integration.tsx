import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, message } from 'antd';
import { VideoCameraOutlined, FileTextOutlined, PictureOutlined, SoundOutlined, ExportOutlined } from '@ant-design/icons';
import VariationsManager from './variations-manager';

const { Sider, Content } = Layout;

// Example timeline elements - replace with your actual timeline data
const initialTimelineElements = [
  {
    id: 'video-1',
    type: 'video' as const,
    name: 'Main Product Video',
    content: 'https://example.com/video1.mp4',
    duration: 30,
    variations: []
  },
  {
    id: 'text-1',
    type: 'text' as const,
    name: 'Call to Action',
    content: 'Best summer sale! Don\'t miss out on amazing deals.',
    variations: []
  },
  {
    id: 'image-1',
    type: 'image' as const,
    name: 'Product Image',
    content: 'https://example.com/product.jpg',
    variations: []
  },
  {
    id: 'audio-1',
    type: 'audio' as const,
    name: 'Background Music',
    content: 'https://example.com/music.mp3',
    variations: []
  }
];

const ExampleEditor: React.FC = () => {
  const [timelineElements, setTimelineElements] = useState(initialTimelineElements);
  const [selectedMenu, setSelectedMenu] = useState('variations');

  // Example function to add new timeline element
  const addTimelineElement = (type: 'video' | 'text' | 'image' | 'audio') => {
    const newElement = {
      id: `new-${type}-${Date.now()}`,
      type,
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      content: `https://example.com/new-${type}.${type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'jpg'}`,
      duration: type === 'video' ? 30 : undefined,
      variations: []
    };

    setTimelineElements(prev => [...prev, newElement] as any);
    message.success(`Added new ${type} element to timeline`);
  };

  // Example function to handle timeline element changes
  const handleTimelineElementsChange = (updatedElements: any[]) => {
    setTimelineElements(updatedElements);
    console.log('Timeline elements updated:', updatedElements);
  };

  // Calculate total combinations for display
  const totalCombinations = timelineElements.reduce((total, element) => {
    const variationCount = element.variations?.length || 1;
    return total * variationCount;
  }, 1);

  return (
    <Layout style={{ height: '100vh' }}>
      {/* Main Content Area */}
      <Content style={{ padding: '20px', background: '#f0f2f5' }}>
        <div style={{ 
          background: '#fff', 
          padding: '20px', 
          borderRadius: '8px',
          minHeight: 'calc(100vh - 40px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h1>Video Editor</h1>
          <p>This is your main video editing area. Add elements to the timeline and create variations!</p>
          
          {/* Example timeline visualization */}
          <div style={{ 
            width: '100%', 
            maxWidth: '800px', 
            marginTop: '20px',
            padding: '20px',
            background: '#fafafa',
            borderRadius: '8px',
            border: '2px dashed #d9d9d9'
          }}>
            <h3>Timeline Elements ({timelineElements.length})</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {timelineElements.map((element, index) => (
                <div key={element.id} style={{
                  padding: '8px 12px',
                  background: '#fff',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px'
                }}>
                  {element.type === 'video' && <VideoCameraOutlined style={{ color: '#52c41a' }} />}
                  {element.type === 'text' && <FileTextOutlined style={{ color: '#1890ff' }} />}
                  {element.type === 'image' && <PictureOutlined style={{ color: '#fa8c16' }} />}
                  {element.type === 'audio' && <SoundOutlined style={{ color: '#722ed1' }} />}
                  {element.name}
                  <span style={{ color: '#666' }}>
                    ({element.variations?.length || 1})
                  </span>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <strong>Total Video Combinations: {totalCombinations}</strong>
            </div>
          </div>

          {/* Quick add buttons */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <Button 
              icon={<VideoCameraOutlined />} 
              onClick={() => addTimelineElement('video')}
            >
              Add Video
            </Button>
            <Button 
              icon={<FileTextOutlined />} 
              onClick={() => addTimelineElement('text')}
            >
              Add Text
            </Button>
            <Button 
              icon={<PictureOutlined />} 
              onClick={() => addTimelineElement('image')}
            >
              Add Image
            </Button>
            <Button 
              icon={<SoundOutlined />} 
              onClick={() => addTimelineElement('audio')}
            >
              Add Audio
            </Button>
          </div>
        </div>
      </Content>

      {/* Sidebar */}
      <Sider 
        width={400} 
        style={{ 
          background: '#fff',
          borderLeft: '1px solid #f0f0f0'
        }}
      >
        {/* Sidebar Menu */}
        <Menu
          mode="inline"
          selectedKeys={[selectedMenu]}
          style={{ height: '100%', borderRight: 0 }}
          onSelect={({ key }) => setSelectedMenu(key)}
        >
          <Menu.Item key="variations" icon={<ExportOutlined />}>
            Variations Manager
          </Menu.Item>
        </Menu>

        {/* Variations Manager Content */}
        <div style={{ padding: '0 16px', height: 'calc(100vh - 64px)', overflow: 'auto' }}>
          <VariationsManager
            timelineElements={timelineElements}
            onTimelineElementsChange={handleTimelineElementsChange}
          />
        </div>
      </Sider>
    </Layout>
  );
};

export default ExampleEditor;
