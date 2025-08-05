import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Facebook, 
  Instagram, 
  Youtube, 
  Smartphone, 
  Monitor, 
  Tablet
} from 'lucide-react';

export interface PlatformConfig {
  name: string;
  iconName: string;
  width: number;
  height: number;
  overlay?: string;
  description: string;
}

export const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    name: 'Instagram Reels',
    iconName: 'instagram',
    width: 1080,
    height: 1920,
    overlay: '/overlay/instagram-reels.png',
    description: '9:16 aspect ratio'
  },
  {
    name: 'Instagram Story',
    iconName: 'instagram',
    width: 1080,
    height: 1920,
    overlay: '/overlay/instagram-story.png',
    description: '9:16 aspect ratio'
  },
  {
    name: 'TikTok',
    iconName: 'smartphone',
    width: 1080,
    height: 1920,
    overlay: '/overlay/tiktok-overlay.png',
    description: '9:16 aspect ratio'
  },
  {
    name: 'Facebook Feed',
    iconName: 'facebook',
    width: 1200,
    height: 628,
    description: '1.91:1 aspect ratio'
  },
  {
    name: 'Facebook Stories',
    iconName: 'facebook',
    width: 1080,
    height: 1920,
    description: '9:16 aspect ratio'
  },
  {
    name: 'YouTube Shorts',
    iconName: 'youtube',
    width: 1080,
    height: 1920,
    description: '9:16 aspect ratio'
  },
  {
    name: 'YouTube Video',
    iconName: 'youtube',
    width: 1920,
    height: 1080,
    description: '16:9 aspect ratio'
  },
  {
    name: 'Square',
    iconName: 'monitor',
    width: 1080,
    height: 1080,
    description: '1:1 aspect ratio'
  },
  {
    name: 'Landscape',
    iconName: 'tablet',
    width: 1920,
    height: 1080,
    description: '16:9 aspect ratio'
  },
  {
    name: 'Portrait',
    iconName: 'smartphone',
    width: 1080,
    height: 1920,
    description: '9:16 aspect ratio'
  }
];

// Icon mapping function
export const getPlatformIcon = (iconName: string) => {
  switch (iconName) {
    case 'instagram':
      return <Instagram className="w-4 h-4" />;
    case 'facebook':
      return <Facebook className="w-4 h-4" />;
    case 'youtube':
      return <Youtube className="w-4 h-4" />;
    case 'smartphone':
      return <Smartphone className="w-4 h-4" />;
    case 'monitor':
      return <Monitor className="w-4 h-4" />;
    case 'tablet':
      return <Tablet className="w-4 h-4" />;
    default:
      return <Monitor className="w-4 h-4" />;
  }
};

interface PlatformPreviewProps {
  onPlatformChange: (platform: PlatformConfig) => void;
  currentPlatform: PlatformConfig;
}

const PlatformPreview: React.FC<PlatformPreviewProps> = ({
  onPlatformChange,
  currentPlatform
}) => {
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  const popularPlatforms = PLATFORM_CONFIGS.slice(0, 4);
  const allPlatforms = PLATFORM_CONFIGS;

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Platform Preview</h3>
            <Button
          variant="ghost"
              size="sm"
          onClick={() => setShowAllPlatforms(!showAllPlatforms)}
          className="text-xs text-gray-600 hover:text-gray-900"
        >
          {showAllPlatforms ? 'Show Popular' : 'Show All'}
            </Button>
          </div>
      
      <div className="grid grid-cols-2 gap-2">
        {(showAllPlatforms ? allPlatforms : popularPlatforms).map((platform) => (
          <Button
            key={platform.name}
            variant={currentPlatform.name === platform.name ? "default" : "outline"}
            size="sm"
            onClick={() => onPlatformChange(platform)}
            className="h-auto p-3 flex flex-col items-center gap-2 text-xs"
          >
            <div className="flex items-center gap-2">
              {getPlatformIcon(platform.iconName)}
              <span className="font-medium">{platform.name}</span>
            </div>
            <span className="text-xs text-gray-500">{platform.description}</span>
          </Button>
        ))}
              </div>
            </div>
  );
};

export default PlatformPreview; 