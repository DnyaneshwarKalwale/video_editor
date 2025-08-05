
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

const VideoComposition = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{
      backgroundColor: 'black',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '48px',
      fontFamily: 'Arial, sans-serif',
      opacity
    }}>
      <div style={{ 
        textAlign: 'center',
        padding: '40px',
        borderRadius: '20px',
        background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ 
          margin: '0 0 20px 0',
          fontSize: '36px',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
          Make and some Your Reality
        </h1>
        <p style={{ 
          margin: '10px 0',
          fontSize: '18px',
          opacity: 0.8
        }}>
          Platform: Instagram Reels
        </p>
        <p style={{ 
          margin: '10px 0',
          fontSize: '16px',
          opacity: 0.7
        }}>
          Duration: 5s
        </p>
        <p style={{ 
          margin: '10px 0',
          fontSize: '14px',
          opacity: 0.6
        }}>
          Text Elements: 1
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default VideoComposition;
