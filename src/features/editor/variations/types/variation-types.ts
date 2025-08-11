import { ITrackItem, IText } from '@designcombo/types';

export type ElementType = 'video' | 'image' | 'audio' | 'text';

export interface TextVariation {
  id: string;
  text: string;
  type: 'manual' | 'ai';
  language?: string;
}

export interface VideoVariation {
  id: string;
  text: string;
  originalTextId: string;
  isOriginal: boolean;
  editable: boolean;
  overlayChanges?: Record<string, any>;
  allTextOverlays?: TextOverlayData[]; // Store all text overlays for composition variations
  metadata?: {
    videoElements?: any[];
    imageElements?: any[];
    audioElements?: any[];
    combination?: any[];
  };
}

export interface TextOverlayData {
  id: string;
  text: string;
  position: {
    top: number;
    left: number;
  };
  style: {
    fontSize: number;
    fontFamily: string;
    color: string;
    backgroundColor?: string;
    borderWidth?: number;
    borderColor?: string;
    textAlign: string;
    fontWeight?: string;
    textDecoration?: string;
    opacity?: number;
  };
  timing: {
    from: number;
    to: number;
  };
  transform?: string;
  width?: number;
  height?: number;
}

export interface VideoTrackItem {
  id: string;
  src: string;
  timing: {
    from: number;
    to: number;
  };
  trim?: {
    from: number;
    to: number;
  };
  playbackRate?: number;
  volume?: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  width?: number;
  height?: number;
}

export interface AudioTrackItem {
  id: string;
  src: string;
  timing: {
    from: number;
    to: number;
  };
  volume?: number;
}

export interface VariationProject {
  id: string;
  originalVideo?: string;
  videoTrackItems: VideoTrackItem[];
  audioTrackItems: AudioTrackItem[];
  textOverlays: TextOverlayData[];
  variations: VideoVariation[];
  platformConfig: {
    name: string;
    width: number;
    height: number;
    aspectRatio: string;
  };
  duration: number;
}

export interface TimelineElement {
  id: string;
  elementType: 'video' | 'image' | 'audio' | 'text';
  elementName: string;
  currentVariationCount: number;
  variations: any[];
  originalContent: string | { src: string };
}

export interface MediaVariation {
  id: string;
  content: string;
  type: 'manual' | 'ai';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    originalFile?: File;
  };
}

export interface VariationState {
  elements: TimelineElement[];
  totalCombinations: number;
  generatedVideos: GeneratedVideo[];
}

export interface GeneratedVideo {
  id: string;
  combination: { elementId: string; variationId: string }[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  outputUrl?: string;
  metadata?: {
    duration: number;
    size: number;
    format: string;
  };
}

export interface AITextVariationRequest {
  originalText: string;
  variationType: 'auto' | 'language';
  targetLanguage?: string;
  count: number;
}

export interface VariationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: VariationProject;
  onSave: (variations: VideoVariation[]) => void;
}