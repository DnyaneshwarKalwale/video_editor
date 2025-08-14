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
  id: string;
  name: string;
  label: string;
  description: string;
  width: number;
  height: number;
  aspectRatio: string;
  icon: string;
  overlay?: string;
}

export const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    id: "instagram-reel",
    name: "Instagram Reel",
    label: "9:16",
    description: "Instagram Reels, TikTok",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    icon: "instagram",
    overlay: '/overlay/instagram-reels.png',
  },
  {
    id: "instagram-story",
    name: "Instagram Story",
    label: "9:16",
    description: "Instagram Stories",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    icon: "instagram",
    overlay: '/overlay/instagram-story.png',
  },
  {
    id: "instagram-post",
    name: "Instagram Post",
    label: "1:1",
    description: "Instagram Posts",
    width: 1080,
    height: 1080,
    aspectRatio: "1:1",
    icon: "monitor",
  },
  {
    id: "facebook-feed",
    name: "Facebook Feed",
    label: "1.91:1",
    description: "Facebook Feed Posts",
    width: 1200,
    height: 628,
    aspectRatio: "1.91:1",
    icon: "facebook",
  },
  {
    id: "facebook-post",
    name: "Facebook Post",
    label: "1:1",
    description: "Facebook Square Posts",
    width: 1080,
    height: 1080,
    aspectRatio: "1:1",
    icon: "monitor",
  },
  {
    id: "youtube-landscape",
    name: "YouTube Landscape",
    label: "16:9",
    description: "YouTube Videos",
    width: 1920,
    height: 1080,
    aspectRatio: "16:9",
    icon: "youtube",
  },
  {
    id: "youtube-portrait",
    name: "YouTube Shorts",
    label: "9:16",
    description: "YouTube Shorts",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    icon: "smartphone",
  },
  {
    id: "tiktok",
    name: "TikTok",
    label: "9:16",
    description: "TikTok Videos",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    icon: "smartphone",
    overlay: '/overlay/tiktok-overlay.png',
  },
];

export const DEFAULT_PLATFORM = PLATFORM_CONFIGS[0]; // Instagram Reel as default

export function getPlatformById(id: string): PlatformConfig | undefined {
  return PLATFORM_CONFIGS.find(platform => platform.id === id);
}

export function getPlatformByAspectRatio(aspectRatio: string): PlatformConfig | undefined {
  return PLATFORM_CONFIGS.find(platform => platform.aspectRatio === aspectRatio);
}

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
            key={platform.id}
            variant={currentPlatform.id === platform.id ? "default" : "outline"}
            size="sm"
            onClick={() => onPlatformChange(platform)}
            className="h-auto p-3 flex flex-col items-center gap-2 text-xs"
          >
            <div className="flex items-center gap-2">
              {getPlatformIcon(platform.icon)}
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