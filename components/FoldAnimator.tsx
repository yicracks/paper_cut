
import React, { useEffect, useState } from 'react';
import { FoldDirection } from '../types';

interface FoldAnimatorProps {
  image: string;
  direction: FoldDirection;
  onComplete: () => void;
  bounds: { minX: number, maxX: number, minY: number, maxY: number };
  duration?: number; // ms
}

const FoldAnimator: React.FC<FoldAnimatorProps> = ({ 
  image, 
  direction, 
  onComplete,
  bounds,
  duration = 600 
}) => {
  const [isFolded, setIsFolded] = useState(false);

  useEffect(() => {
    // Trigger animation next frame to ensure initial state is rendered
    const timer = requestAnimationFrame(() => {
        setIsFolded(true);
    });
    
    // Cleanup/Complete timer
    const completeTimer = setTimeout(() => {
        onComplete();
    }, duration + 50); // Small buffer

    return () => {
        cancelAnimationFrame(timer);
        clearTimeout(completeTimer);
    };
  }, [onComplete, duration]);

  // Convert pixel bounds to percentages (assuming 500x500 canvas)
  const SIZE = 500;
  const bx1 = (bounds.minX / SIZE) * 100;
  const bx2 = (bounds.maxX / SIZE) * 100;
  const by1 = (bounds.minY / SIZE) * 100;
  const by2 = (bounds.maxY / SIZE) * 100;

  const mx = (bx1 + bx2) / 2;
  const my = (by1 + by2) / 2;

  // Helper to format polygon points
  const p = (x: number, y: number) => `${x}% ${y}%`;

  let activeClip = '';
  let staticClip = '';
  let transformAxis = ''; 
  let angle = '0deg';
  // Center the transform origin on the fold axis of the current bounds
  let transformOrigin = `${mx}% ${my}%`; 

  switch (direction) {
    case 'UP': 
      // Fold Axis: Horizontal Center (my)
      // Static (Keep Top): y < my
      staticClip = `polygon(${p(bx1, by1)}, ${p(bx2, by1)}, ${p(bx2, my)}, ${p(bx1, my)})`;
      // Active (Fold Bottom): y > my
      activeClip = `polygon(${p(bx1, my)}, ${p(bx2, my)}, ${p(bx2, by2)}, ${p(bx1, by2)})`;
      
      transformAxis = '1, 0, 0';
      angle = '-180deg'; 
      transformOrigin = `50% ${my}%`;
      break;
      
    case 'DOWN':
      // Fold Axis: Horizontal Center (my)
      // Static (Keep Bottom): y > my
      staticClip = `polygon(${p(bx1, my)}, ${p(bx2, my)}, ${p(bx2, by2)}, ${p(bx1, by2)})`;
      // Active (Fold Top): y < my
      activeClip = `polygon(${p(bx1, by1)}, ${p(bx2, by1)}, ${p(bx2, my)}, ${p(bx1, my)})`;
      
      transformAxis = '1, 0, 0';
      angle = '180deg';
      transformOrigin = `50% ${my}%`;
      break;

    case 'LEFT':
      // Fold Axis: Vertical Center (mx)
      // Static (Keep Left): x < mx
      staticClip = `polygon(${p(bx1, by1)}, ${p(mx, by1)}, ${p(mx, by2)}, ${p(bx1, by2)})`;
      // Active (Fold Right): x > mx
      activeClip = `polygon(${p(mx, by1)}, ${p(bx2, by1)}, ${p(bx2, by2)}, ${p(mx, by2)})`;
      
      transformAxis = '0, 1, 0';
      angle = '-180deg';
      transformOrigin = `${mx}% 50%`;
      break;

    case 'RIGHT':
      // Fold Axis: Vertical Center (mx)
      // Static (Keep Right): x > mx
      staticClip = `polygon(${p(mx, by1)}, ${p(bx2, by1)}, ${p(bx2, by2)}, ${p(mx, by2)})`;
      // Active (Fold Left): x < mx
      activeClip = `polygon(${p(bx1, by1)}, ${p(mx, by1)}, ${p(mx, by2)}, ${p(bx1, by2)})`;
      
      transformAxis = '0, 1, 0';
      angle = '180deg';
      transformOrigin = `${mx}% 50%`;
      break;
    
    // Diagonal Folds
    // We assume diagonal folds are only active on square shapes (per simulation logic),
    // so we can use the corners of the bounds to define the triangle clips.
    
    case 'TL':
      // Keep Top-Left Triangle. Fold Axis: Diagonal from BL to TR.
      // Static: TL Triangle (bx1, by1), (bx2, by1), (bx1, by2)
      staticClip = `polygon(${p(bx1, by1)}, ${p(bx2, by1)}, ${p(bx1, by2)})`;
      // Active: BR Triangle (bx2, by1), (bx2, by2), (bx1, by2)
      activeClip = `polygon(${p(bx2, by1)}, ${p(bx2, by2)}, ${p(bx1, by2)})`;
      
      transformAxis = '1, -1, 0';
      angle = '180deg';
      break;

    case 'TR':
      // Keep Top-Right. Fold Axis: Diagonal from TL to BR.
      // Static: TR Triangle (bx1, by1), (bx2, by1), (bx2, by2)
      staticClip = `polygon(${p(bx1, by1)}, ${p(bx2, by1)}, ${p(bx2, by2)})`;
      // Active: BL Triangle (bx1, by1), (bx1, by2), (bx2, by2)
      activeClip = `polygon(${p(bx1, by1)}, ${p(bx1, by2)}, ${p(bx2, by2)})`;

      transformAxis = '1, 1, 0';
      angle = '-180deg';
      break;

    case 'BL':
      // Keep Bottom-Left. Fold Axis: Diagonal from TL to BR.
      // Static: BL Triangle (bx1, by1), (bx1, by2), (bx2, by2)
      staticClip = `polygon(${p(bx1, by1)}, ${p(bx1, by2)}, ${p(bx2, by2)})`;
      // Active: TR Triangle (bx1, by1), (bx2, by1), (bx2, by2)
      activeClip = `polygon(${p(bx1, by1)}, ${p(bx2, by1)}, ${p(bx2, by2)})`;

      transformAxis = '1, 1, 0';
      angle = '180deg';
      break;

    case 'BR':
      // Keep Bottom-Right. Fold Axis: Diagonal from BL to TR.
      // Static: BR Triangle (bx2, by1), (bx2, by2), (bx1, by2)
      staticClip = `polygon(${p(bx2, by1)}, ${p(bx2, by2)}, ${p(bx1, by2)})`;
      // Active: TL Triangle (bx1, by1), (bx2, by1), (bx1, by2)
      activeClip = `polygon(${p(bx1, by1)}, ${p(bx2, by1)}, ${p(bx1, by2)})`;

      transformAxis = '1, -1, 0';
      angle = '-180deg';
      break;
  }

  // Common styles
  const commonStyle: React.CSSProperties = {
     position: 'absolute',
     inset: 0,
     backgroundSize: '100% 100%', // Stretch to fill container
     backgroundRepeat: 'no-repeat',
     backgroundImage: `url(${image})`
  };

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ perspective: '1200px' }}>
      <div className="relative w-full h-full transform-style-3d">
        
        {/* Static Layer */}
        <div 
          style={{ 
            ...commonStyle,
            clipPath: staticClip,
            zIndex: 1
          }}
        />

        {/* Active Layer */}
        <div 
          style={{ 
            ...commonStyle,
            clipPath: activeClip,
            transformOrigin: transformOrigin,
            transform: isFolded ? `rotate3d(${transformAxis}, ${angle})` : 'rotate3d(0,0,0,0deg)',
            transition: `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            zIndex: 2,
            backfaceVisibility: 'visible'
          }}
        >
          {/* Shadow Overlay - constrained to activeClip by parent overflow or structure */}
          <div className="absolute inset-0 bg-black/10 transition-opacity duration-500" style={{ opacity: isFolded ? 1 : 0 }}></div>
        </div>

      </div>
    </div>
  );
};

export default FoldAnimator;
