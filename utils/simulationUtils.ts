
import { FoldDirection, SimulationEngine } from '../types';
import { hexToRgb } from './canvasUtils';

type CreaseType = 'H' | 'V' | 'D1' | 'D2'; // D1: x+y=c (TL/BR), D2: x-y=c (TR/BL)

export class PaperSimulation implements SimulationEngine {
  private size: number;
  // Key: Current Pixel Index (y * size + x)
  // Value: List of Original Pixel Indices
  private pixelMap: Map<number, number[]>;
  private originalPixelsState: Int8Array; // 0 = Removed/Cut, 1 = Existing
  private creasePixels: Map<number, CreaseType>; // Indices of original pixels that lie on a fold line
  
  // Bounds (still useful for internal logic, though less for display now)
  public minX: number;
  public maxX: number;
  public minY: number;
  public maxY: number;

  constructor(size: number = 512) {
    this.size = size;
    this.pixelMap = new Map();
    this.originalPixelsState = new Int8Array(size * size).fill(1);
    this.creasePixels = new Map();
    
    // Initialize: Every pixel maps to itself
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = y * size + x;
        this.pixelMap.set(idx, [idx]);
      }
    }

    this.minX = 0;
    this.maxX = size;
    this.minY = 0;
    this.maxY = size;
    this.updateBounds();
  }

  // Helper to get coordinates from index
  private getXY(idx: number) {
    return { x: idx % this.size, y: Math.floor(idx / this.size) };
  }

  // Helper to get index from coordinates
  private getIdx(x: number, y: number) {
    return y * this.size + x;
  }

  private updateBounds() {
    if (this.pixelMap.size === 0) {
      this.minX = 0; this.maxX = 0; this.minY = 0; this.maxY = 0;
      return;
    }
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const idx of this.pixelMap.keys()) {
      const { x, y } = this.getXY(idx);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    this.minX = minX;
    this.maxX = maxX;
    this.minY = minY;
    this.maxY = maxY;
  }

  private getAxisAndLogic(dir: FoldDirection) {
    // Current actual geometric bounds
    const minX = this.minX;
    const maxX = this.maxX; // Inclusive
    const minY = this.minY;
    const maxY = this.maxY; // Inclusive

    // Center points (can be .5)
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    let getVal: (x: number, y: number) => number;
    let axisVal: number;
    let reflect: (x: number, y: number) => { x: number, y: number };
    let isKeep: (val: number, axis: number) => boolean;

    switch (dir) {
      case 'UP': // Fold Bottom UP. Keep Top (y < axis)
        getVal = (x, y) => y;
        axisVal = cy;
        isKeep = (v, a) => v < a; // Keep smaller Y
        reflect = (x, y) => ({ x, y: 2 * axisVal - y });
        break;
      case 'DOWN': // Fold Top DOWN. Keep Bottom (y > axis)
        getVal = (x, y) => y;
        axisVal = cy;
        isKeep = (v, a) => v > a; // Keep larger Y
        reflect = (x, y) => ({ x, y: 2 * axisVal - y });
        break;
      case 'LEFT': // Fold Right LEFT. Keep Left (x < axis)
        getVal = (x, y) => x;
        axisVal = cx;
        isKeep = (v, a) => v < a;
        reflect = (x, y) => ({ x: 2 * axisVal - x, y });
        break;
      case 'RIGHT': // Fold Left RIGHT. Keep Right (x > axis)
        getVal = (x, y) => x;
        axisVal = cx;
        isKeep = (v, a) => v > a;
        reflect = (x, y) => ({ x: 2 * axisVal - x, y });
        break;
      case 'TL': // Keep Top-Left (x + y < C)
        getVal = (x, y) => x + y;
        axisVal = cx + cy;
        isKeep = (v, a) => v < a;
        reflect = (x, y) => ({ x: axisVal - y, y: axisVal - x });
        break;
      case 'BR': // Keep Bottom-Right (x + y > C)
        getVal = (x, y) => x + y;
        axisVal = cx + cy;
        isKeep = (v, a) => v > a;
        reflect = (x, y) => ({ x: axisVal - y, y: axisVal - x });
        break;
      case 'TR': // Keep Top-Right. (x - y > C). (Large x, small y)
        getVal = (x, y) => x - y;
        axisVal = cx - cy;
        isKeep = (v, a) => v > a;
        reflect = (x, y) => ({ x: axisVal + y, y: x - axisVal });
        break;
      case 'BL': // Keep Bottom-Left. (x - y < C). (Small x, large y)
        getVal = (x, y) => x - y;
        axisVal = cx - cy;
        isKeep = (v, a) => v < a;
        reflect = (x, y) => ({ x: axisVal + y, y: x - axisVal });
        break;
      default:
        throw new Error("Unknown Direction");
    }

    return { getVal, axisVal, isKeep, reflect };
  }

  public canFold(dir: FoldDirection): boolean {
    if (this.pixelMap.size === 0) return false;

    const { getVal, axisVal, isKeep, reflect } = this.getAxisAndLogic(dir);

    // Collect logic groups
    let keepCount = 0;
    let foldCount = 0;

    for (const idx of this.pixelMap.keys()) {
      const { x, y } = this.getXY(idx);
      const val = getVal(x, y);

      if (val === axisVal) continue; // On Axis, neutral

      if (isKeep(val, axisVal)) {
        // This point is in Keep Region
        // Check if its reflection exists in Fold Region
        const r = reflect(x, y);
        const rIdx = this.getIdx(Math.round(r.x), Math.round(r.y)); // Round for float axis logic safety
        
        if (!this.pixelMap.has(rIdx)) {
            // Asymmetric!
            return false; 
        }
        keepCount++;
      } else {
        // This point is in Fold Region
        // Check if its reflection exists in Keep Region
        const r = reflect(x, y);
        const rIdx = this.getIdx(Math.round(r.x), Math.round(r.y));

        if (!this.pixelMap.has(rIdx)) {
            return false;
        }
        foldCount++;
      }
    }

    // Must be non-empty fold
    return foldCount > 0 && keepCount > 0;
  }

  public fold(dir: FoldDirection): boolean {
    if (!this.canFold(dir)) return false;

    const { getVal, axisVal, isKeep, reflect } = this.getAxisAndLogic(dir);
    const newMap = new Map<number, number[]>();

    // Determine Crease Type
    let creaseType: CreaseType = 'H';
    if (dir === 'UP' || dir === 'DOWN') creaseType = 'H';
    else if (dir === 'LEFT' || dir === 'RIGHT') creaseType = 'V';
    else if (dir === 'TL' || dir === 'BR') creaseType = 'D1'; // x+y
    else if (dir === 'TR' || dir === 'BL') creaseType = 'D2'; // x-y

    // Mark creases - stricter threshold to keep lines crisp (approx 1.5px)
    const threshold = 0.8; 
    for (const [idx, layers] of this.pixelMap) {
        const { x, y } = this.getXY(idx);
        const val = getVal(x, y);
        if (Math.abs(val - axisVal) <= threshold) {
            for (const oid of layers) {
                this.creasePixels.set(oid, creaseType);
            }
        }
    }

    for (const [idx, layers] of this.pixelMap) {
      const { x, y } = this.getXY(idx);
      const val = getVal(x, y);

      if (Math.abs(val - axisVal) < 0.001) {
          // ON AXIS: Keep as is.
          newMap.set(idx, layers);
      } else if (isKeep(val, axisVal)) {
          // KEEP REGION: 
          // 1. Keep own layers
          // 2. Add layers from symmetric partner
          
          const r = reflect(x, y);
          const rIdx = this.getIdx(Math.round(r.x), Math.round(r.y));
          
          const partnerLayers = this.pixelMap.get(rIdx) || [];
          
          // Merge
          newMap.set(idx, [...layers, ...partnerLayers]);
      }
      // Folded region is dropped (merged into keep region)
    }

    this.pixelMap = newMap;
    this.updateBounds();
    return true;
  }

  public renderFoldedState(canvas: HTMLCanvasElement, color: string) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create temp buffer at simulation resolution
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.size;
    tempCanvas.height = this.size;
    const tempCtx = tempCanvas.getContext('2d');
    if(!tempCtx) return;

    const imgData = tempCtx.createImageData(this.size, this.size);
    const data = imgData.data;
    const { r, g, b } = hexToRgb(color);
    
    for (const idx of this.pixelMap.keys()) {
      const i = idx * 4;
      data[i] = r;     
      data[i+1] = g;   
      data[i+2] = b;   
      data[i+3] = 255; 
    }
    
    tempCtx.putImageData(imgData, 0, 0);
    
    // Draw scaled to display
    ctx.imageSmoothingEnabled = false; // Pixel art style to see exact pixels
    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
  }

  /**
   * Renders the current active shape onto a FULL SIZE canvas.
   * This leaves the "empty" areas transparent.
   */
  public renderActiveCutState(ctx: CanvasRenderingContext2D, color: string) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Ensure canvas is cleared first (transparent)
    ctx.clearRect(0, 0, width, height);

    // Create new image data
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;
    const { r, g, b } = hexToRgb(color);
    
    for (const idx of this.pixelMap.keys()) {
      const { x, y } = this.getXY(idx);
      // Direct absolute mapping
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const i = (y * width + x) * 4;
        data[i] = r; 
        data[i+1] = g; 
        data[i+2] = b; 
        data[i+3] = 255; 
      }
    }
    
    ctx.putImageData(imgData, 0, 0);
  }

  public applyCutAndUnfold(userCutCanvas: HTMLCanvasElement, color: string, targetCanvas?: HTMLCanvasElement): string | void {
    // Reset cut state because this is a fresh application of the current canvas state.
    // This allows undo operations (restoring pixels) to be correctly processed.
    this.originalPixelsState.fill(1);

    const ctx = userCutCanvas.getContext('2d');
    if (!ctx) return targetCanvas ? undefined : '';
    
    // The cutCanvas should be full size
    const cutW = userCutCanvas.width;
    const cutH = userCutCanvas.height;
    
    const cutData = ctx.getImageData(0, 0, cutW, cutH).data;
    
    // Map Simulation Pixels to Cut Canvas
    for (const [idx, originalList] of this.pixelMap) {
       const { x, y } = this.getXY(idx);
       
       if (x < cutW && y < cutH) {
           const cutIdx = (y * cutW + x) * 4;
           const alpha = cutData[cutIdx + 3]; // Alpha channel
           
           // If Cut (Eraser -> low alpha), mark original pixels as removed
           if (alpha < 100) {
               for (const origIdx of originalList) {
                   this.originalPixelsState[origIdx] = 0;
               }
           }
       }
    }
    
    if (targetCanvas) {
        this.renderToCanvas(targetCanvas, color);
    } else {
        return this.generateFinalImage(color);
    }
  }

  private renderToCanvas(canvas: HTMLCanvasElement, color: string) {
      canvas.width = this.size;
      canvas.height = this.size;
      const ctx = canvas.getContext('2d');
      if(!ctx) return;
      
      const imgData = ctx.createImageData(this.size, this.size);
      const data = imgData.data;
      const { r, g, b } = hexToRgb(color);
      
      for(let i=0; i<this.originalPixelsState.length; i++) {
          if (this.originalPixelsState[i] === 1) {
              const p = i * 4;
              data[p] = r; 
              data[p+1] = g; 
              data[p+2] = b; 
              data[p+3] = 255; 
          }
      }
      
      ctx.putImageData(imgData, 0, 0);
  }

  private generateFinalImage(color: string): string {
      const canvas = document.createElement('canvas');
      this.renderToCanvas(canvas, color);
      return canvas.toDataURL();
  }

  /**
   * Generates a transparent overlay image with SOLID lines representing creases.
   * Color is slightly darker than the paper color to simulate a crease shadow.
   */
  public generateCreaseOverlay(cutCanvas?: HTMLCanvasElement, color: string = '#DC2626'): string {
    const canvas = document.createElement('canvas');
    canvas.width = this.size;
    canvas.height = this.size;
    const ctx = canvas.getContext('2d');
    if(!ctx) return '';
    
    const imgData = ctx.createImageData(this.size, this.size);
    const data = imgData.data;

    // Calculate crease color (darkened paper color)
    const { r, g, b } = hexToRgb(color);
    const darkenFactor = 0.7; // 30% darker
    const darkR = Math.floor(r * darkenFactor);
    const darkG = Math.floor(g * darkenFactor);
    const darkB = Math.floor(b * darkenFactor);
    
    for (const [idx, type] of this.creasePixels) {
        // Only draw crease if the paper at this point hasn't been cut away
        if (this.originalPixelsState[idx] === 0) continue; 
        
        // Solid line - no dashing check needed
        const i = idx * 4;
        data[i] = darkR;   
        data[i+1] = darkG; 
        data[i+2] = darkB; 
        data[i+3] = 160; // Alpha
    }
    
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL();
  }
}
