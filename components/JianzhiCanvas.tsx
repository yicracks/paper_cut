
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { fillCanvas, getCoordinates, removeDisconnectedParts } from '../utils/canvasUtils';
import { DrawingTool, Point } from '../types';
import { DEFAULT_BRUSH_SIZE } from '../utils/constants';
import { X, Check } from 'lucide-react';
import { StencilPattern } from '../patterns';

interface JianzhiCanvasProps {
  width: number;
  height: number;
  displaySize?: number; // Visual size in pixels
  tool: DrawingTool;
  brushSize: number;
  onInteractStart?: () => void;
  onInteractEnd?: () => void;
  onInit?: (ctx: CanvasRenderingContext2D) => void;
  autoRemoveDisconnected?: boolean;
}

export interface JianzhiCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
  clear: () => void;
  hardReset: () => void; // Clears canvas AND history
  undo: () => void;
  redo: () => void;
  saveState: () => void;
  addStencil: (stencil: StencilPattern) => void;
}

const JianzhiCanvas = forwardRef<JianzhiCanvasHandle, JianzhiCanvasProps>(
  ({ width, height, displaySize, tool, brushSize, onInteractStart, onInteractEnd, onInit, autoRemoveDisconnected = true }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
    // Active Stencil State (Sticker/Pattern placement overlay)
    const [activeStencil, setActiveStencil] = useState<{
      id: string;
      nameZh: string;
      nameEn: string;
      svgContent: string;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
    } | null>(null);

    // Refs for lag-free performance (avoiding React re-renders on mousemove)
    const activeStencilRef = useRef<typeof activeStencil>(null);
    useEffect(() => {
      activeStencilRef.current = activeStencil;
    }, [activeStencil]);

    const stencilOverlayRef = useRef<HTMLDivElement>(null);

    // Save of the clean canvas before a stencil cut is processed
    const preStencilStateRef = useRef<ImageData | null>(null);

    // Dismiss active stencil bound boundaries when drawing tool changes
    useEffect(() => {
      if (activeStencil) {
        setActiveStencil(null);
        preStencilStateRef.current = null;
      }
    }, [tool]);

    // Stencil drag math tracker refs
    const stencilDragRef = useRef<{
      type: 'move' | 'scale' | 'rotate' | null;
      startX: number;
      startY: number;
      originalX: number;
      originalY: number;
      originalWidth: number;
      originalHeight: number;
      originalRotation: number;
    }>({
      type: null,
      startX: 0,
      startY: 0,
      originalX: 0,
      originalY: 0,
      originalWidth: 0,
      originalHeight: 0,
      originalRotation: 0
    });

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

    const initializeCanvas = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
        ctx.globalCompositeOperation = 'source-over';
        if (onInit) {
             onInit(ctx);
        } else {
             fillCanvas(ctx, canvasWidth, canvasHeight, '#DC2626');
        }
    };

    // Stencil Pointer Gesture Handlers
    const handleStencilDragStart = (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const st = activeStencilRef.current;
      if (!st) return;
      
      stencilDragRef.current = {
        type: 'move',
        startX: e.clientX,
        startY: e.clientY,
        originalX: st.x,
        originalY: st.y,
        originalWidth: st.width,
        originalHeight: st.height,
        originalRotation: st.rotation
      };
      document.addEventListener('pointermove', handleStencilPointerMove);
      document.addEventListener('pointerup', handleStencilPointerUp);
    };

    const handleStencilScaleStart = (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const st = activeStencilRef.current;
      if (!st) return;

      stencilDragRef.current = {
        type: 'scale',
        startX: e.clientX,
        startY: e.clientY,
        originalX: st.x,
        originalY: st.y,
        originalWidth: st.width,
        originalHeight: st.height,
        originalRotation: st.rotation
      };
      document.addEventListener('pointermove', handleStencilPointerMove);
      document.addEventListener('pointerup', handleStencilPointerUp);
    };

    const handleStencilRotateStart = (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const st = activeStencilRef.current;
      if (!st) return;

      stencilDragRef.current = {
        type: 'rotate',
        startX: e.clientX,
        startY: e.clientY,
        originalX: st.x,
        originalY: st.y,
        originalWidth: st.width,
        originalHeight: st.height,
        originalRotation: st.rotation
      };
      document.addEventListener('pointermove', handleStencilPointerMove);
      document.addEventListener('pointerup', handleStencilPointerUp);
    };

    const handleStencilPointerMove = (e: PointerEvent) => {
      const drag = stencilDragRef.current;
      const st = activeStencilRef.current;
      if (!drag.type || !st) return;

      const deltaX = e.clientX - drag.startX;
      const deltaY = e.clientY - drag.startY;

      let nextX = st.x;
      let nextY = st.y;
      let nextWidth = st.width;
      let nextHeight = st.height;
      let nextRotation = st.rotation;

      if (drag.type === 'move') {
        nextX = drag.originalX + deltaX;
        nextY = drag.originalY + deltaY;
      } else if (drag.type === 'scale') {
        const canvasContainer = canvasRef.current?.parentElement;
        if (canvasContainer) {
          const rect = canvasContainer.getBoundingClientRect();
          const cx = rect.left + drag.originalX + drag.originalWidth / 2;
          const cy = rect.top + drag.originalY + drag.originalHeight / 2;
          
          const origCornerDist = Math.hypot(drag.originalWidth / 2, drag.originalHeight / 2);
          const currDist = Math.hypot(e.clientX - cx, e.clientY - cy);
          
          const scaleFactor = currDist / origCornerDist;
          const newSize = Math.max(40, Math.min(currentDisplayWidth * 1.5, drag.originalWidth * scaleFactor));
          
          nextWidth = newSize;
          nextHeight = newSize;
          nextX = (drag.originalX + drag.originalWidth / 2) - newSize / 2;
          nextY = (drag.originalY + drag.originalHeight / 2) - newSize / 2;
        }
      } else if (drag.type === 'rotate') {
        const canvasContainer = canvasRef.current?.parentElement;
        if (canvasContainer) {
          const rect = canvasContainer.getBoundingClientRect();
          const cx = rect.left + drag.originalX + drag.originalWidth / 2;
          const cy = rect.top + drag.originalY + drag.originalHeight / 2;
          
          const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
          nextRotation = angle + Math.PI / 2;
        }
      }

      // Buffer in ref for real-time calculation
      activeStencilRef.current = {
        ...st,
        x: nextX,
        y: nextY,
        width: nextWidth,
        height: nextHeight,
        rotation: nextRotation
      };

      // Perform extremely light-weight and direct DOM styling manipulation (Avoiding 60fps React state lag)
      if (stencilOverlayRef.current) {
        stencilOverlayRef.current.style.left = `${nextX}px`;
        stencilOverlayRef.current.style.top = `${nextY}px`;
        stencilOverlayRef.current.style.width = `${nextWidth}px`;
        stencilOverlayRef.current.style.height = `${nextHeight}px`;
        stencilOverlayRef.current.style.transform = `rotate(${nextRotation}rad)`;
      }
    };

    const handleStencilPointerUp = () => {
      const dragType = stencilDragRef.current.type;

      stencilDragRef.current.type = null;
      document.removeEventListener('pointermove', handleStencilPointerMove);
      document.removeEventListener('pointerup', handleStencilPointerUp);
      
      // Sync final calculation values back to standard React State
      if (activeStencilRef.current) {
        const updatedSt = { ...activeStencilRef.current };
        setActiveStencil(updatedSt);

        // If they dragged, scaled, or rotated, restore back to pre-stencil snapshot and re-cut at the new position
        if (dragType !== null) {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (canvas && ctx && preStencilStateRef.current) {
            ctx.putImageData(preStencilStateRef.current, 0, 0);
            applyStencilCut(updatedSt);
          }
        }
      }
    };

    // Stencil Action: Apply/Carve Cut
    const applyStencilCut = (st: {
      id: string;
      nameZh: string;
      nameEn: string;
      svgContent: string;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
    }) => {
      const canvas = canvasRef.current;
      if (!canvas || !st) return;

      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';

          const scaleX = width / currentDisplayWidth;
          const scaleY = height / currentDisplayHeight;

          const logicalWidth = st.width * scaleX;
          const logicalHeight = st.height * scaleY;
          const logicalCX = (st.x + st.width / 2) * scaleX;
          const logicalCY = (st.y + st.height / 2) * scaleY;

          ctx.translate(logicalCX, logicalCY);
          ctx.rotate(st.rotation);
          ctx.drawImage(img, -logicalWidth / 2, -logicalHeight / 2, logicalWidth, logicalHeight);
          ctx.restore();

          if (autoRemoveDisconnected) {
            removeDisconnectedParts(canvas);
          }

          if (onInteractEnd) onInteractEnd();
        }
      };
      
      const svgWithSolidFill = st.svgContent.replace(/currentColor/g, '#000000');
      const encodedSvg = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgWithSolidFill);
      img.src = encodedSvg;
    };

    const handleStencilCancel = (e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveStencil(null);
      preStencilStateRef.current = null;
    };

    // Auto cleanup of pointers on unmount
    useEffect(() => {
      return () => {
        document.removeEventListener('pointermove', handleStencilPointerMove);
        document.removeEventListener('pointerup', handleStencilPointerUp);
      };
    }, [activeStencil]);

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      clear: () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        setActiveStencil(null);
        preStencilStateRef.current = null;
        if (canvas && ctx) {
          saveToHistory();
          initializeCanvas(ctx, canvas.width, canvas.height);
        }
      },
      hardReset: () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        setActiveStencil(null);
        preStencilStateRef.current = null;
        if (canvas && ctx) {
            historyStack.current = [];
            redoStack.current = [];
            initializeCanvas(ctx, canvas.width, canvas.height);
            historyStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        }
      },
      undo: () => {
         const canvas = canvasRef.current;
         const ctx = canvas?.getContext('2d');
         setActiveStencil(null);
         preStencilStateRef.current = null;
         if (canvas && ctx && historyStack.current.length > 0) {
            const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
            redoStack.current.push(currentState);
            const previousState = historyStack.current.pop();
            if (previousState) {
                ctx.putImageData(previousState, 0, 0);
            }
         }
      },
      redo: () => {
         const canvas = canvasRef.current;
         const ctx = canvas?.getContext('2d');
         setActiveStencil(null);
         preStencilStateRef.current = null;
         if (canvas && ctx && redoStack.current.length > 0) {
            const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
            historyStack.current.push(currentState);
            const nextState = redoStack.current.pop();
            if (nextState) {
                ctx.putImageData(nextState, 0, 0);
            }
         }
      },
      saveState: () => saveToHistory(),
      addStencil: (stencil: StencilPattern) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
          // Commit previous stencil session if user selects a new one while one was active
          if (activeStencilRef.current) {
            saveToHistory();
          }

          // Save fresh clean snapshot before applying this stencil
          preStencilStateRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Save the state to history for standard undo functionality
          saveToHistory();

          const defaultSize = Math.min(currentDisplayWidth * 0.4, 150);
          const newSt = {
            id: stencil.id,
            nameZh: stencil.nameZh,
            nameEn: stencil.nameEn,
            svgContent: stencil.svgContent,
            x: (currentDisplayWidth - defaultSize) / 2,
            y: (currentDisplayHeight - defaultSize) / 2,
            width: defaultSize,
            height: defaultSize,
            rotation: 0
          };

          setActiveStencil(newSt);

          // Apply target stencil cut instantly at default position
          applyStencilCut(newSt);
        }
      }
    }));

    // Initialize Canvas
    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        if (historyStack.current.length === 0) {
           initializeCanvas(ctx, width, height);
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

    const handleStart = (e: React.PointerEvent) => {
      e.preventDefault(); 
      
      // If we are currently placing / positioning a stencil, intercept normal drawings!
      if (activeStencil) return;

      // Capture the pointer so we keep receiving events even if dragged outside
      e.currentTarget.setPointerCapture(e.pointerId);

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

    const handleMove = (e: React.PointerEvent) => {
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

    const handleShapeCommit = (e: React.PointerEvent) => {
        if (!isDrawing) return;
        
        // Release capture
        e.currentTarget.releasePointerCapture(e.pointerId);
        
        let endCoords = getCoordinates(e, canvasRef.current!);
        
        if (canvasRef.current && tool !== 'brush' && startPoint.current && endCoords) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                drawShape(ctx, startPoint.current, endCoords, false);
                if (autoRemoveDisconnected) {
                    removeDisconnectedParts(canvasRef.current);
                }
            }
        } else if (tool === 'brush' && canvasRef.current) {
            if (autoRemoveDisconnected) {
                removeDisconnectedParts(canvasRef.current);
            }
        }

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
        {/* Switched to Pointer Events for better tracking off-canvas */}
        <canvas
            ref={previewCanvasRef}
            width={width}
            height={height}
            className="absolute inset-0 touch-none cursor-crosshair"
            style={{ width: `${currentDisplayWidth}px`, height: `${currentDisplayHeight}px` }}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={handleStart}
            onPointerMove={handleMove}
            onPointerUp={handleShapeCommit}
            onPointerCancel={handleShapeCommit}
        />

        {/* Interactive Stencil Placement Overlay */}
        {activeStencil && (
          <div 
            ref={stencilOverlayRef}
            style={{
              position: 'absolute',
              left: `${activeStencil.x}px`,
              top: `${activeStencil.y}px`,
              width: `${activeStencil.width}px`,
              height: `${activeStencil.height}px`,
              transform: `rotate(${activeStencil.rotation}rad)`,
              transformOrigin: 'center center',
              border: '2px dashed #C23531',
              cursor: 'move',
              zIndex: 40,
              userSelect: 'none'
            }}
            onPointerDown={handleStencilDragStart}
          >
            {/* SVG Content filled with red-orange semi-transparent */}
            <div 
              className="w-full h-full opacity-60 text-[#C23531]"
              dangerouslySetInnerHTML={{ __html: activeStencil.svgContent }}
            />

            {/* Float Action buttons on Stencil box controls */}
            {/* Top-Left: Discard current stencil placement (Aborts cut and restores snapshot) */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                const canvas = canvasRef.current;
                const ctx = canvas?.getContext('2d');
                if (canvas && ctx && preStencilStateRef.current) {
                  ctx.putImageData(preStencilStateRef.current, 0, 0);
                }
                setActiveStencil(null);
                preStencilStateRef.current = null;
                if (onInteractEnd) onInteractEnd();
              }}
              className="absolute -top-3 -left-3 w-6 h-6 bg-white border border-[#d4c4b0] hover:border-[#C23531] text-[#8c7b6c] hover:text-[#C23531] rounded-full flex items-center justify-center shadow-md cursor-pointer transition-colors z-50 transform scale-90"
              title="撤销设计 / Discard placement"
            >
              <X size={12} />
            </button>

            {/* Top-Right: Finish / Confirm (Dismiss boundaries, lock the cut) */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleStencilCancel}
              className="absolute -top-3 -right-3 w-6 h-6 bg-[#C23531] text-white hover:bg-[#a02622] rounded-full flex items-center justify-center shadow-md cursor-pointer transition-colors z-50"
              title="完成 / Finish adjustment"
            >
              <Check size={14} className="stroke-[3px]" />
            </button>

            {/* Bottom-Right: Resize / Diagonal drag scale */}
            <div
              className="absolute -bottom-3 -right-3 w-6 h-6 bg-white border-2 border-[#C23531] rounded-full flex items-center justify-center cursor-se-resize shadow-md z-50 animate-pulse"
              onPointerDown={handleStencilScaleStart}
              title="拖拽缩放 / Diagonal Scale"
            >
              {/* Optional tiny design dot in the center */}
              <div className="w-1.5 h-1.5 bg-[#C23531] rounded-full" />
            </div>

            {/* Top-Center: Rotate handle */}
            <div
              className="absolute -top-7 left-1/2 -ml-3 w-6 h-6 bg-white border-2 border-[#C23531] rounded-full flex items-center justify-center cursor-alias shadow-md z-50"
              onPointerDown={handleStencilRotateStart}
              title="拖拽旋转 / Rotate"
            >
              <svg className="w-3.5 h-3.5 text-[#C23531]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H19" />
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  }
);

JianzhiCanvas.displayName = 'JianzhiCanvas';
export default JianzhiCanvas;
