
import React from 'react';
import { Pencil, Minus, Circle, Square, Star, CircleDot, X, Paintbrush } from 'lucide-react';
import { DrawingTool, Language } from '../types';
import { TEXT } from '../utils/i18n';
import { motion } from 'motion/react';

interface BrushToolboxProps {
  currentTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onClose: () => void;
  language: Language;
  dragConstraints?: React.RefObject<HTMLDivElement | null>;
}

const BrushToolbox: React.FC<BrushToolboxProps> = ({
  currentTool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
  onClose,
  language,
  dragConstraints
}) => {
  const t = TEXT[language];

  const tools: { id: DrawingTool; icon: React.ReactNode; label: string }[] = [
    { id: 'brush', icon: <Pencil size={18} />, label: t.brush_free },
    { id: 'line', icon: <Minus size={18} />, label: t.brush_line },
    { id: 'circle', icon: <Circle size={18} />, label: t.brush_circle },
    { id: 'ellipse', icon: <CircleDot size={18} />, label: t.brush_ellipse },
    { id: 'rect', icon: <Square size={18} />, label: t.brush_rect },
    { id: 'star', icon: <Star size={18} />, label: t.brush_star },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      drag
      dragConstraints={dragConstraints}
      dragElastic={0}
      dragMomentum={false}
      className="absolute top-10 left-12 w-48 z-40 bg-white/95 backdrop-blur-md border border-[#d4c4b0] shadow-2xl p-3 rounded-sm chinese-card cursor-move"
    >
      <div className="flex justify-between items-center mb-3 pb-1 border-b border-[#eaddcf] select-none">
        <div className="flex items-center gap-1">
          <Paintbrush size={12} className="text-[#C23531]" />
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }} 
          className="text-[#8c7b6c] hover:text-[#C23531] transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex flex-col gap-4" onPointerDown={e => e.stopPropagation()}>
        {/* Tool Selection */}
        <div className="grid grid-cols-3 gap-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`flex items-center justify-center p-2.5 rounded-sm border transition-all cursor-pointer ${
                currentTool === tool.id
                  ? 'bg-red-50 border-[#C23531] text-[#C23531] shadow-inner'
                  : 'bg-white border-[#d4c4b0] text-[#8c7b6c] hover:border-[#C23531] hover:text-[#C23531]'
              }`}
              title={tool.label}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        {/* Brush Size */}
        <div className="space-y-2">
          <div className="flex justify-end items-center">
            <span className="text-[10px] font-mono text-[#5c5c5c] bg-[#f9f7f2] px-1 rounded-sm border border-[#eaddcf]">{brushSize}px</span>
          </div>
          <input
            type="range"
            min="1"
            max="40"
            value={brushSize}
            onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
            className="w-full h-1 bg-[#eaddcf] rounded-lg appearance-none cursor-pointer accent-[#C23531]"
          />
          <div className="flex justify-between px-1">
            <div className="w-1 h-1 rounded-full bg-[#d4c4b0]"></div>
            <div className="w-2 h-2 rounded-full bg-[#d4c4b0]"></div>
            <div className="w-3 h-3 rounded-full bg-[#d4c4b0]"></div>
            <div className="w-4 h-4 rounded-full bg-[#d4c4b0]"></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BrushToolbox;
