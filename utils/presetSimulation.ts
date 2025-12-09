
import { FoldDirection, SimulationEngine } from '../types';
import { hexToRgb } from './canvasUtils';

export class PresetSimulation implements SimulationEngine {
  private size: number;
  private folds: number; // The number of "points" (e.g., 5 for a star)
  private totalSegments: number; // 2 * folds (for mirroring symmetry)
  private anglePerSegment: number; // in radians
  private radius: number;

  constructor(size: number = 500, folds: number = 5) {
    this.size = size;
    this.folds = folds;
    // Standard paper cutting usually creates mirror symmetry.
    // A 5-fold pattern has 5 axes of symmetry, creating 10 wedges.
    this.totalSegments = folds * 2;
    this.anglePerSegment = (Math.PI * 2) / this.totalSegments;
    // Reduce radius to 80% to ensure there is empty space between paper edge and canvas container
    this.radius = (size / 2) * 0.8; 
  }

  // Preset mode doesn't support step-by-step folding
  public canFold(dir: FoldDirection): boolean { return false; }
  public fold(dir: FoldDirection): boolean { return false; }

  /**
   * Renders the single folded wedge onto the folding visualizer.
   * This shows the user the shape they will be working with.
   */
  public renderFoldedState(canvas: HTMLCanvasElement, color: string) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear transparent
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    // Ensure radius adapts if canvas size is different from sim size
    // Use 0.8 factor here too for consistency if canvas resizes
    const effectiveRadius = Math.min(cx, cy) * 0.8;

    ctx.save();
    ctx.translate(cx, cy);
    // Align wedge pointing UP.
    // The wedge spans from -angle/2 to +angle/2 relative to -90deg (Up).
    ctx.rotate(-Math.PI / 2);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    // We draw a wedge of 'anglePerSegment' size.
    // To make it symmetric for drawing, we center it.
    ctx.arc(0, 0, effectiveRadius, -this.anglePerSegment/2, this.anglePerSegment/2);
    ctx.lineTo(0, 0);
    ctx.closePath();
    
    // Style similar to the custom fold paper
    ctx.fillStyle = color; 
    ctx.fill();
    
    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Renders the active area mask for the cutting tool.
   * Only pixels inside this wedge can be cut.
   */
  public renderActiveCutState(ctx: CanvasRenderingContext2D, color: string) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Ensure we start clean
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    
    // Dynamically calculate radius based on actual context dimensions
    const effectiveRadius = Math.min(cx, cy) * 0.8;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 2);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    // Use the actual anglePerSegment from constructor, as it is consistent
    ctx.arc(0, 0, effectiveRadius, -this.anglePerSegment/2, this.anglePerSegment/2);
    ctx.lineTo(0, 0);
    ctx.closePath();
    
    // Draw solid color
    ctx.fillStyle = color;
    ctx.fill();
    
    ctx.restore();
  }

  /**
   * Internal helper to generate the unfolded result on a fresh canvas or target canvas.
   */
  private generateUnfoldedCanvas(userCutCanvas: HTMLCanvasElement, targetCanvas?: HTMLCanvasElement): HTMLCanvasElement {
    const outputCanvas = targetCanvas || document.createElement('canvas');
    // Ensure size matches if passed in, or set defaults
    outputCanvas.width = this.size;
    outputCanvas.height = this.size;
    
    const ctx = outputCanvas.getContext('2d');
    if (!ctx) return outputCanvas;

    // Clear it first
    ctx.clearRect(0, 0, this.size, this.size);

    const cx = this.size / 2;
    const cy = this.size / 2;

    // We will draw the source canvas N times with rotation and scale(-1, 1) for mirroring.
    for (let i = 0; i < this.totalSegments; i++) {
        ctx.save();
        ctx.translate(cx, cy);
        
        // Rotate to the correct segment position
        // Each segment is anglePerSegment.
        ctx.rotate(i * this.anglePerSegment);
        
        // If odd, we need to mirror.
        if (i % 2 !== 0) {
           ctx.scale(-1, 1); 
        }
        
        // Draw the source.
        // The source wedge is already centered at -PI/2 (Up) in the coordinate space.
        ctx.drawImage(userCutCanvas, -cx, -cy);
        
        ctx.restore();
    }
    return outputCanvas;
  }

  /**
   * Generates the unfolded pattern by rotating and mirroring the cut wedge.
   */
  public applyCutAndUnfold(userCutCanvas: HTMLCanvasElement, color: string, targetCanvas?: HTMLCanvasElement): string | void {
    if (targetCanvas) {
        this.generateUnfoldedCanvas(userCutCanvas, targetCanvas);
        return;
    } else {
        const canvas = this.generateUnfoldedCanvas(userCutCanvas);
        return canvas.toDataURL();
    }
  }

  /**
   * Generates the crease lines (the radial lines separating segments).
   * Uses the cutCanvas (unfolded) as a mask so creases don't appear in empty air.
   * Lines are SOLID and color-matched (slightly darker than paper).
   */
  public generateCreaseOverlay(cutCanvas?: HTMLCanvasElement, color: string = '#DC2626'): string {
    const canvas = document.createElement('canvas');
    canvas.width = this.size;
    canvas.height = this.size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // 1. If we have the cutCanvas, unfold it to create a mask
    if (cutCanvas) {
        const maskCanvas = this.generateUnfoldedCanvas(cutCanvas);
        ctx.drawImage(maskCanvas, 0, 0);
        // Keep only the opaque parts (paper), we will draw creases ON TOP of existing pixels
        ctx.globalCompositeOperation = 'source-in';
    }

    const cx = this.size / 2;
    const cy = this.size / 2;

    // Calculate crease color (darkened paper color)
    const { r, g, b } = hexToRgb(color);
    const darkenFactor = 0.7;
    const darkR = Math.floor(r * darkenFactor);
    const darkG = Math.floor(g * darkenFactor);
    const darkB = Math.floor(b * darkenFactor);

    ctx.strokeStyle = `rgba(${darkR}, ${darkG}, ${darkB}, 0.6)`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]); // Solid lines

    ctx.save();
    ctx.translate(cx, cy);
    
    // Draw radial lines
    for (let i = 0; i < this.totalSegments; i++) {
        // Calculate the angle for the boundary lines.
        const angle = -Math.PI/2 + this.anglePerSegment/2 + i * this.anglePerSegment;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(
            Math.cos(angle) * this.radius,
            Math.sin(angle) * this.radius
        );
        ctx.stroke();
    }
    
    ctx.restore();
    return canvas.toDataURL();
  }
}
