
import React from 'react';
import { Fold, FoldDirection } from '../types';

export const fillCanvas = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string
) => {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
};

export const hexToRgb = (hex: string): { r: number, g: number, b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 220, g: 38, b: 38 }; // Default red fallback
};

export const getCoordinates = (
  event: React.MouseEvent | React.TouchEvent,
  canvas: HTMLCanvasElement
): { x: number; y: number } | null => {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;

  if ((event as React.TouchEvent).touches) {
    const touch = (event as React.TouchEvent).touches[0];
    if (!touch) return null;
    clientX = touch.clientX;
    clientY = touch.clientY;
  } else {
    clientX = (event as React.MouseEvent).clientX;
    clientY = (event as React.MouseEvent).clientY;
  }

  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height),
  };
};

/**
 * Pixel-perfect unfolding using reverse mapping simulation.
 */
export const generateUnfoldedTexture = (
  sourceCanvas: HTMLCanvasElement,
  folds: Fold[],
  baseSize: number = 1000 // Output resolution
): string => {
  // ... (keeping existing unused function if needed for legacy compatibility, though App uses Simulation classes now)
  return '';
};


export const removeDisconnectedParts = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  const width = canvas.width;
  const height = canvas.height;
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const totalPixels = width * height;
  
  const labels = new Int32Array(totalPixels);
  let currentLabel = 1;
  const sizes = new Map<number, number>();

  // Check alpha > 20 as "paper"
  const isPaper = (index: number) => data[index * 4 + 3] > 20;

  for (let i = 0; i < totalPixels; i++) {
    if (labels[i] === 0 && isPaper(i)) {
      const label = currentLabel++;
      let count = 0;
      const queue = [i];
      labels[i] = label;
      count++;
      
      let head = 0;
      while (head < queue.length) {
        const idx = queue[head++];
        const cx = idx % width;
        
        if (cx < width - 1) {
          const n = idx + 1;
          if (labels[n] === 0 && isPaper(n)) { labels[n] = label; queue.push(n); count++; }
        }
        if (cx > 0) {
          const n = idx - 1;
          if (labels[n] === 0 && isPaper(n)) { labels[n] = label; queue.push(n); count++; }
        }
        if (idx + width < totalPixels) {
          const n = idx + width;
          if (labels[n] === 0 && isPaper(n)) { labels[n] = label; queue.push(n); count++; }
        }
        if (idx - width >= 0) {
          const n = idx - width;
          if (labels[n] === 0 && isPaper(n)) { labels[n] = label; queue.push(n); count++; }
        }
      }
      sizes.set(label, count);
    }
  }

  if (sizes.size > 1) {
    let maxLabel = -1;
    let maxSize = -1;
    for (const [lbl, size] of sizes) {
      if (size > maxSize) {
        maxSize = size;
        maxLabel = lbl;
      }
    }

    let hasChanges = false;
    for (let i = 0; i < totalPixels; i++) {
      if (labels[i] !== 0 && labels[i] !== maxLabel) {
        data[i * 4 + 3] = 0; 
        hasChanges = true;
      }
    }

    if (hasChanges) {
      ctx.putImageData(imageData, 0, 0);
    }
  }
};
