
export type Point = {
  x: number;
  y: number;
};

export type DrawingTool = 
  | 'brush' 
  | 'line' 
  | 'arc'
  | 'rect' 
  | 'square' 
  | 'circle' 
  | 'ellipse'
  | 'triangle'
  | 'trapezoid'
  | 'star';

export interface CanvasState {
  history: ImageData[];
  currentIndex: number;
}

export type FoldDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'TL' | 'TR' | 'BL' | 'BR';

export interface Fold {
  direction: FoldDirection;
  // The dimensions of the paper *after* this fold
  width: number;
  height: number;
}

export type FoldingMode = 'custom' | 'preset';

export interface SimulationEngine {
    canFold(dir: FoldDirection): boolean;
    fold(dir: FoldDirection): boolean;
    renderFoldedState(canvas: HTMLCanvasElement, color: string): void;
    renderActiveCutState(ctx: CanvasRenderingContext2D, color: string): void;
    applyCutAndUnfold(cutCanvas: HTMLCanvasElement, color: string): string;
    generateCreaseOverlay(cutCanvas?: HTMLCanvasElement, color?: string): string;
}

export interface GalleryItem {
  id: string;
  timestamp: number;
  resultImage: string;
  cutImage?: string; // Optional based on settings
  name: string;
  foldMode: string;
}

export interface AppSettings {
  saveCutPattern: boolean;
  dynamicTheme: boolean;
}