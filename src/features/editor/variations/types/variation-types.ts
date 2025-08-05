import { ITrackItem, IText } from '@designcombo/types';

export interface VideoVariation {
  id: string;
  text: string;
  originalTextId: string;
  isOriginal: boolean;
  editable: boolean;
  overlayChanges?: Record<string, any>;
  allTextOverlays?: TextOverlayData[]; // Store all text overlays for composition variations
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

export interface VariationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: VariationProject;
  onSave: (variations: VideoVariation[]) => void;
}