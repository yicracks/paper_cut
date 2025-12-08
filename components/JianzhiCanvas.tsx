
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { fillCanvas, getCoordinates, removeDisconnectedParts } from '../utils/canvasUtils';
import { DrawingTool, Point } from '../types';

interface JianzhiCanvasProps {
  width: number;
  height: number;
  displaySize?: number; // Visual size in pixels
  tool: DrawingTool;
  brushSize: number;
  onInteractStart?: () => void;
  onInteractEnd?: () => void;
  onInit?: (ctx: CanvasRenderingContext2D) => void;
}

export interface JianzhiCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
  clear: () => void;
  undo: () => void;
  redo: () => void;
  saveState: () => void;
}

const JianzhiCanvas = forwardRef<JianzhiCanvasHandle, JianzhiCanvasProps>(
  ({ width, height, displaySize, tool, brushSize, onInteractStart, onInteractEnd, onInit }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
    // Points for dragging shapes
    const startPoint = useRef<Point | null>(null);
    const lastPoint = useRef<Point | null>(null);
    
    // History stacks
    const historyStack = useRef<ImageData[]>([]);
    const redoStack = useRef<ImageData[]>([]);

    // Use displaySize if provided, otherwise default to width
    const currentDisplayWidth = displaySize || width;
    const currentDisplayHeight = displaySize || height;

    const saveToHistory = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        if (historyStack.current.length > 20) {
          historyStack.current.shift(); // Keep max 20 steps
        }
        historyStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        // New action clears redo stack
        redoStack.current = [];
      }
    };

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      clear: () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
          saveToHistory();
          // IMPORTANT: Reset composite operation to source-over so we can draw the fresh paper shape
          // If we are in 'destination-out' (eraser) mode, drawing a new shape on a cleared (transparent) canvas does nothing.
          ctx.globalCompositeOperation = 'source-over';
          
          if (onInit) {
             onInit(ctx);
          } else {
             fillCanvas(ctx, canvas.width, canvas.height, '#DC2626');
          }
        }
      },
      undo: () => {
         const canvas = canvasRef.current;
         const ctx = canvas?.getContext('2d');
         if (canvas && ctx && historyStack.current.length > 0) {
            // Save current state to redo stack before undoing
            const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
            redoStack.current.push(currentState);

            // Restore previous state
            const previousState = historyStack.current.pop();
            if (previousState) {
                ctx.putImageData(previousState, 0, 0);
            }
         }
      },
      redo: () => {
         const canvas = canvasRef.current;
         const ctx = canvas?.getContext('2d');
         if (canvas && ctx && redoStack.current.length > 0) {
            // Save current state to history stack before redoing
            const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
            historyStack.current.push(currentState);

            // Restore next state
            const nextState = redoStack.current.pop();
            if (nextState) {
                ctx.putImageData(nextState, 0, 0);
            }
         }
      },
      saveState: () => saveToHistory()
    }));

    // Initialize Canvas
    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        if (historyStack.current.length === 0) {
           ctx.globalCompositeOperation = 'source-over';
           if (onInit) {
             onInit(ctx);
           } else {
             fillCanvas(ctx, width, height, '#DC2626');
           }
           historyStack.current.push(ctx.getImageData(0, 0, width, height));
        }
      }
    }, [width, height, onInit]);

    const drawShape = (ctx: CanvasRenderingContext2D, start: Point, end: Point, isPreview: boolean) => {
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = brushSize;
      
      // For main canvas cut: eraser. For preview: visual indicator
      if (isPreview) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      } else {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.strokeStyle = 'rgba(0,0,0,1)';
      }

      const w = end.x - start.x;
      const h = end.y - start.y;

      switch (tool) {
        case 'brush':
        case 'line':
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            break;
            
        case 'arc':
            {
                // Simple Quadratic curve
                const midX = (start.x + end.x) / 2;
                const midY = (start.y + end.y) / 2;
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const controlX = midX - dy * 0.3;
                const controlY = midY + dx * 0.3;
                
                ctx.moveTo(start.x, start.y);
                ctx.quadraticCurveTo(controlX, controlY, end.x, end.y);
            }
            break;

        case 'rect':
            ctx.rect(start.x, start.y, w, h);
            break;

        case 'square':
            {
                const size = Math.max(Math.abs(w), Math.abs(h));
                const signX = Math.sign(w) || 1;
                const signY = Math.sign(h) || 1;
                ctx.rect(start.x, start.y, size * signX, size * signY);
            }
            break;
            
        case 'circle':
            {
                const radius = Math.sqrt(w*w + h*h);
                ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
            }
            break;

        case 'ellipse':
            {
                const cx = start.x + w / 2;
                const cy = start.y + h / 2;
                const rx = Math.abs(w) / 2;
                const ry = Math.abs(h) / 2;
                ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            }
            break;

        case 'triangle':
            {
                const bottomY = end.y;
                const topY = start.y;
                const centerX = start.x + w / 2;
                
                ctx.moveTo(centerX, topY); 
                ctx.lineTo(end.x, bottomY);
                ctx.lineTo(start.x, bottomY);
                ctx.closePath();
            }
            break;

        case 'trapezoid':
            {
                const x1 = Math.min(start.x, end.x);
                const x2 = Math.max(start.x, end.x);
                const y1 = Math.min(start.y, end.y);
                const y2 = Math.max(start.y, end.y);
                const width = x2 - x1;
                const indent = width * 0.2;
                
                ctx.moveTo(x1 + indent, y1);
                ctx.lineTo(x2 - indent, y1);
                ctx.lineTo(x2, y2);
                ctx.lineTo(x1, y2);
                ctx.closePath();
            }
            break;
            
        case 'star':
            {
                const cx = start.x + w / 2;
                const cy = start.y + h / 2;
                const outerRadius = Math.min(Math.abs(w), Math.abs(h)) / 2;
                const innerRadius = outerRadius * 0.4;
                const spikes = 5;
                
                let rot = Math.PI / 2 * 3;
                let x = cx;
                let y = cy;
                const step = Math.PI / spikes;

                ctx.moveTo(cx, cy - outerRadius);
                for (let i = 0; i < spikes; i++) {
                    x = cx + Math.cos(rot) * outerRadius;
                    y = cy + Math.sin(rot) * outerRadius;
                    ctx.lineTo(x, y);
                    rot += step;

                    x = cx + Math.cos(rot) * innerRadius;
                    y = cy + Math.sin(rot) * innerRadius;
                    ctx.lineTo(x, y);
                    rot += step;
                }
                ctx.lineTo(cx, cy - outerRadius);
                ctx.closePath();
            }
            break;
      }

      ctx.stroke();
    };

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault(); 
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const coords = getCoordinates(e, canvas);
      if (!coords) return;

      saveToHistory();
      if (onInteractStart) onInteractStart();

      setIsDrawing(true);
      startPoint.current = coords;
      lastPoint.current = coords;

      if (tool === 'brush') {
        const ctx = canvas.getContext('2d');
        if(ctx) {
             ctx.beginPath();
             ctx.lineCap = 'round';
             ctx.lineJoin = 'round';
             ctx.lineWidth = brushSize;
             ctx.globalCompositeOperation = 'destination-out';
             ctx.fillStyle = 'black'; // Color doesn't matter for destination-out, but needed for fill
             
             // Draw a single dot
             ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
             ctx.fill();
        }
      }
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing || !startPoint.current) return;
      
      const canvas = canvasRef.current;
      const previewCanvas = previewCanvasRef.current;
      if (!canvas || !previewCanvas) return;

      const coords = getCoordinates(e, canvas);
      if (!coords) return;

      if (tool === 'brush') {
         // Direct Draw
         if (lastPoint.current) {
             const ctx = canvas.getContext('2d');
             if (ctx) {
                 drawShape(ctx, lastPoint.current, coords, false);
                 lastPoint.current = coords;
             }
         }
      } else {
          // Preview Draw
          const pCtx = previewCanvas.getContext('2d');
          if (pCtx) {
              pCtx.clearRect(0, 0, width, height);
              drawShape(pCtx, startPoint.current, coords, true);
          }
      }
    };

    const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      
      setIsDrawing(false);
      startPoint.current = null;
      lastPoint.current = null;
      
      const previewCanvas = previewCanvasRef.current;
      if (previewCanvas) {
          const pCtx = previewCanvas.getContext('2d');
          pCtx?.clearRect(0, 0, width, height);
      }
      
      if (onInteractEnd) onInteractEnd();
    };

    const handleShapeCommit = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        
        let endCoords = getCoordinates(e, canvasRef.current!);
        
        // If touch end, fallback logic
        if (!endCoords && (e as React.TouchEvent).changedTouches && (e as React.TouchEvent).changedTouches.length > 0) {
             const touch = (e as React.TouchEvent).changedTouches[0];
             const rect = canvasRef.current!.getBoundingClientRect();
             endCoords = {
                x: (touch.clientX - rect.left) * (width / rect.width),
                y: (touch.clientY - rect.top) * (height / rect.height),
             };
        }
        
        if (canvasRef.current && tool !== 'brush' && startPoint.current && endCoords) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                drawShape(ctx, startPoint.current, endCoords, false);
                removeDisconnectedParts(canvasRef.current);
            }
        } else if (tool === 'brush' && canvasRef.current) {
            removeDisconnectedParts(canvasRef.current);
        }

        handleEnd(e);
    };

    return (
      <div 
        className="relative shadow-xl shadow-red-900/20 rounded-sm bg-white border-2 border-zinc-200 overflow-hidden"
        style={{ width: `${currentDisplayWidth}px`, height: `${currentDisplayHeight}px` }}
      >
        {/* Main Canvas */}
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="block touch-none"
            style={{ width: `${currentDisplayWidth}px`, height: `${currentDisplayHeight}px` }}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
        />
        
        {/* Interaction/Preview Layer (Transparent, on top) */}
        <canvas
            ref={previewCanvasRef}
            width={width}
            height={height}
            className="absolute inset-0 touch-none cursor-crosshair"
            style={{ width: `${currentDisplayWidth}px`, height: `${currentDisplayHeight}px` }}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleShapeCommit}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleShapeCommit}
        />
      </div>
    );
  }
);

JianzhiCanvas.displayName = 'JianzhiCanvas';
export default JianzhiCanvas;
