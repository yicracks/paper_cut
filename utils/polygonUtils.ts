
import { Fold, FoldDirection, Point } from '../types';

/**
 * Calculates the polygon vertices of the folded paper in the original coordinate space.
 * This simulates the physical reduction of the paper area.
 */
export const getFoldedPolygon = (baseSize: number, folds: Fold[]): Point[] => {
  // Start with full square
  let minX = 0;
  let maxX = baseSize;
  let minY = 0;
  let maxY = baseSize;
  
  // Track diagonal state
  // We simplify diagonal handling: logic allows max 1 active diagonal state that clips the rect
  let diagonal: 'NONE' | 'TL' | 'TR' | 'BL' | 'BR' = 'NONE';

  for (const fold of folds) {
    const { direction } = fold;

    switch (direction) {
      case 'UP': // Keep Top
        maxY = (minY + maxY) / 2;
        break;
      case 'DOWN': // Keep Bottom
        minY = (minY + maxY) / 2;
        break;
      case 'LEFT': // Keep Left
        maxX = (minX + maxX) / 2;
        break;
      case 'RIGHT': // Keep Right
        minX = (minX + maxX) / 2;
        break;
      // Diagonals - can only happen if current shape is effectively square
      // We assume the button availability logic handles the square constraint
      case 'TL': // Keep Top-Left Triangle
        diagonal = 'TL';
        break;
      case 'TR': // Keep Top-Right Triangle
        diagonal = 'TR';
        break;
      case 'BL': // Keep Bottom-Left Triangle
        diagonal = 'BL';
        break;
      case 'BR': // Keep Bottom-Right Triangle
        diagonal = 'BR';
        break;
    }
  }

  // Construct polygon based on Bounding Box + Diagonal constraint
  const p1 = { x: minX, y: minY }; // TL
  const p2 = { x: maxX, y: minY }; // TR
  const p3 = { x: maxX, y: maxY }; // BR
  const p4 = { x: minX, y: maxY }; // BL

  if (diagonal === 'NONE') {
    return [p1, p2, p3, p4];
  }

  // If diagonal, we clip the square to a triangle
  switch (diagonal) {
    case 'TL': return [p1, p2, p4]; // Top-Left, Top-Right, Bottom-Left ?? No. TL Triangle means points (minX, minY), (maxX, minY), (minX, maxY)
               // Wait, standard TL diagonal fold (folding BR up to TL) results in the triangle with vertices: TL, TR, BL. 
               // Line is y = -x + C.
               return [ {x: minX, y: minY}, {x: maxX, y: minY}, {x: minX, y: maxY} ];
    case 'TR': return [ {x: minX, y: minY}, {x: maxX, y: minY}, {x: maxX, y: maxY} ];
    case 'BR': return [ {x: maxX, y: minY}, {x: maxX, y: maxY}, {x: minX, y: maxY} ];
    case 'BL': return [ {x: minX, y: minY}, {x: minX, y: maxY}, {x: maxX, y: maxY} ];
  }

  return [p1, p2, p3, p4];
};

/**
 * Gets the CSS Clip Path string for the active drawing area.
 * This is relative to the Bounding Box of the paper, not the original sheet.
 */
export const getRelativeClipPath = (folds: Fold[]): string => {
  // Check for the *last* diagonal fold.
  // Since we limit logic to essentially Rectangular reduction + optional final diagonal.
  const diag = folds.find(f => ['TL', 'TR', 'BL', 'BR'].includes(f.direction))?.direction;

  if (!diag) return 'none';

  switch (diag) {
    case 'TL': return 'polygon(0% 0%, 100% 0%, 0% 100%)';
    case 'TR': return 'polygon(0% 0%, 100% 0%, 100% 100%)';
    case 'BL': return 'polygon(0% 0%, 0% 100%, 100% 100%)';
    case 'BR': return 'polygon(100% 0%, 100% 100%, 0% 100%)';
  }
  return 'none';
};

export const getPaperActiveBounds = (baseSize: number, folds: Fold[]) => {
  let minX = 0, maxX = baseSize, minY = 0, maxY = baseSize;
  
  for (const fold of folds) {
     if (fold.direction === 'UP') maxY = (minY + maxY) / 2;
     else if (fold.direction === 'DOWN') minY = (minY + maxY) / 2;
     else if (fold.direction === 'LEFT') maxX = (minX + maxX) / 2;
     else if (fold.direction === 'RIGHT') minX = (minX + maxX) / 2;
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};
