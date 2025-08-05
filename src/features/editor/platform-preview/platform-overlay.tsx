import React from 'react';
import { PlatformConfig } from './platform-preview';

interface PlatformOverlayProps {
  platform: PlatformConfig;
  size: { width: number; height: number };
}

const PlatformOverlay: React.FC<PlatformOverlayProps> = ({ platform, size }) => {
  if (!platform.overlay) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: size.width,
        height: size.height,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <img
        src={platform.overlay}
        alt={`${platform.name} overlay`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
};

export default PlatformOverlay; 