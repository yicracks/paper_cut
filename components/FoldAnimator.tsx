
import React, { useEffect, useState } from 'react';
import { FoldDirection } from '../types';

interface FoldAnimatorProps {
  image: string;
  direction: FoldDirection;
  onComplete: () => void;
  duration?: number; // ms
}

const FoldAnimator: React.FC<FoldAnimatorProps> = ({ 
  image, 
  direction, 
  onComplete,
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

  // Define Geometry based on direction
  // The 'Active' part is the one that moves.
  // The 'Static' part is the one that stays (The "Keep" region).
  
  let activeClip = '';
  let staticClip = '';
  let transformAxis = ''; // rotate3d axis vector
  let angle = '0deg';

  // Standard CSS coordinates: X right, Y down.
  // We rotate around the fold line.
  
  switch (direction) {
    case 'UP': 
      // Keep Top. Active Bottom.
      // Axis Y=50%.
      staticClip = 'polygon(0 0, 100% 0, 100% 50%, 0 50%)';
      activeClip = 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)';
      transformAxis = '1, 0, 0';
      angle = '-180deg'; // Rotate Bottom Up-and-Out
      break;
    case 'DOWN':
      // Keep Bottom. Active Top.
      staticClip = 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)';
      activeClip = 'polygon(0 0, 100% 0, 100% 50%, 0 50%)';
      transformAxis = '1, 0, 0';
      angle = '180deg';
      break;
    case 'LEFT':
      // Keep Left. Active Right.
      // Axis X=50%.
      staticClip = 'polygon(0 0, 50% 0, 50% 100%, 0 100%)';
      activeClip = 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)';
      transformAxis = '0, 1, 0';
      angle = '-180deg'; // Rotate Right Left-and-Out
      break;
    case 'RIGHT':
      // Keep Right. Active Left.
      staticClip = 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)';
      activeClip = 'polygon(0 0, 50% 0, 50% 100%, 0 100%)';
      transformAxis = '0, 1, 0';
      angle = '180deg';
      break;
    
    // Diagonals
    // Note: Transform Origin is set to center (50% 50%), which works for all main diagonals in a square.
    
    case 'TL':
      // Keep Top-Left (Triangle). Active Bottom-Right.
      // Fold along Diagonal BL -> TR.
      staticClip = 'polygon(0 0, 100% 0, 0 100%)';
      activeClip = 'polygon(100% 0, 100% 100%, 0 100%)';
      transformAxis = '1, -1, 0'; // Vector along diagonal
      angle = '180deg';
      break;
    case 'TR':
      // Keep Top-Right. Active Bottom-Left.
      // Fold along Diagonal TL -> BR.
      staticClip = 'polygon(0 0, 100% 0, 100% 100%)';
      activeClip = 'polygon(0 0, 100% 100%, 0 100%)';
      transformAxis = '1, 1, 0';
      angle = '-180deg';
      break;
    case 'BL':
      // Keep Bottom-Left. Active Top-Right.
      // Fold along Diagonal TL -> BR.
      staticClip = 'polygon(0 0, 100% 100%, 0 100%)';
      activeClip = 'polygon(0 0, 100% 0, 100% 100%)';
      transformAxis = '1, 1, 0';
      angle = '180deg';
      break;
    case 'BR':
      // Keep Bottom-Right. Active Top-Left.
      // Fold along Diagonal BL -> TR.
      staticClip = 'polygon(100% 0, 100% 100%, 0 100%)';
      activeClip = 'polygon(0 0, 100% 0, 0 100%)';
      transformAxis = '1, -1, 0';
      angle = '-180deg';
      break;
  }

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ perspective: '1200px' }}>
      <div className="relative w-full h-full transform-style-3d">
        
        {/* Static Layer (The part that stays) */}
        <div 
          className="absolute inset-0 bg-no-repeat bg-contain"
          style={{ 
            backgroundImage: `url(${image})`,
            clipPath: staticClip,
            zIndex: 1
          }}
        />

        {/* Active Layer (The part that folds) */}
        <div 
          className="absolute inset-0 bg-no-repeat bg-contain shadow-xl"
          style={{ 
            backgroundImage: `url(${image})`,
            clipPath: activeClip,
            transformOrigin: '50% 50%',
            transform: isFolded ? `rotate3d(${transformAxis}, ${angle})` : 'rotate3d(0,0,0,0deg)',
            transition: `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            zIndex: 2,
            backfaceVisibility: 'visible' // Show the mirrored image on back
          }}
        >
          {/* Optional: Lighting gradient overlay to enhance 3D effect */}
          <div className={`absolute inset-0 bg-black/10 transition-opacity duration-${duration}`} style={{ opacity: isFolded ? 1 : 0 }}></div>
        </div>

      </div>
    </div>
  );
};

export default FoldAnimator;
