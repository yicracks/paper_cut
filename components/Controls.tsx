
import React, { useState, useRef, useEffect } from 'react';
import { 
    Minus, Brush, ChevronDown
} from 'lucide-react';
import { DrawingTool, Language } from '../types';
import { TEXT } from '../utils/i18n';

interface ControlsProps {
  tool: DrawingTool;
  onToolChange?: (tool: DrawingTool) => void;
  brushSize?: number;
  onBrushSizeChange?: (size: number) => void;
  themeColor?: string;
  language: Language;
}

const Controls: React.FC<ControlsProps> = ({
  tool,
  onToolChange,
  brushSize = 2,
  onBrushSizeChange,
  themeColor,
  language
}) => {
  const t = TEXT[language];
  const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsToolMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getToolIcon = (currentTool: DrawingTool) => {
      switch (currentTool) {
          case 'line': return <Minus size={16} />;
          case 'arc': return (
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18C3 10 10 3 18 3" />
             </svg>
          );
          default: return <Brush size={16} />;
      }
  };

  const handleToolSelect = (newTool: DrawingTool) => {
      onToolChange?.(newTool);
      setIsToolMenuOpen(false);
  };

  return (
    <div className="flex flex-col gap-2 w-full p-2 rounded-sm border border-transparent">
        {/* Row 1: Consolidated Tool + Slider */}
        <div className="flex items-center gap-2 relative">
            
            {/* Consolidated Tool Button */}
            <div className="relative" ref={menuRef}>
                <button 
                    onClick={() => setIsToolMenuOpen(!isToolMenuOpen)}
                    className={`w-8 h-8 flex items-center justify-center gap-0.5 rounded-sm border transition-all ${
                        themeColor 
                        ? 'bg-[#C23531]/90 text-white border-[#a02622] shadow-sm'
                        : 'bg-[#C23531]/90 text-white border-[#a02622] shadow-sm'
                    }`}
                    style={themeColor ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                    title="Select Drawing Tool"
                >
                    {getToolIcon(tool)}
                    <ChevronDown size={10} className="opacity-80" />
                </button>

                {/* Dropdown Menu */}
                {isToolMenuOpen && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#d4c4b0] shadow-xl rounded-sm p-1 flex flex-col gap-1 w-24 animate-in fade-in zoom-in-95 duration-100">
                            <button onClick={() => handleToolSelect('brush')} className={`flex items-center gap-2 px-2 py-1.5 text-xs text-left rounded-sm hover:bg-[#fffbf0] ${tool === 'brush' ? 'text-red-700 font-bold bg-[#fdfbf7]' : 'text-[#5c5c5c]'}`}>
                            <Brush size={14} /> Brush
                            </button>
                            <button onClick={() => handleToolSelect('line')} className={`flex items-center gap-2 px-2 py-1.5 text-xs text-left rounded-sm hover:bg-[#fffbf0] ${tool === 'line' ? 'text-red-700 font-bold bg-[#fdfbf7]' : 'text-[#5c5c5c]'}`}>
                            <Minus size={14} /> Line
                            </button>
                            <button onClick={() => handleToolSelect('arc')} className={`flex items-center gap-2 px-2 py-1.5 text-xs text-left rounded-sm hover:bg-[#fffbf0] ${tool === 'arc' ? 'text-red-700 font-bold bg-[#fdfbf7]' : 'text-[#5c5c5c]'}`}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18C3 10 10 3 18 3" /></svg>
                            Curve
                            </button>
                    </div>
                )}
            </div>

            <div className="w-px h-6 bg-white/30"></div>

                {/* Size Slider - Expanded to take remaining space */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-1 h-1 rounded-full bg-white/50 flex-shrink-0"></div>
                <input
                    type="range"
                    min="2"
                    max="40"
                    value={brushSize}
                    onChange={(e) => onBrushSizeChange?.(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/40 rounded-full appearance-none cursor-pointer accent-[#C23531] hover:accent-red-700 opacity-90 hover:opacity-100 transition-opacity"
                    style={{ accentColor: themeColor || '#C23531' }}
                    title={t.thickness}
                />
                <div className="w-2.5 h-2.5 rounded-full bg-white/50 flex-shrink-0"></div>
            </div>
        </div>
    </div>
  );
};

export default Controls;
