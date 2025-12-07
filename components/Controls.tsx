import React from 'react';
import { 
    Scissors, RotateCcw, Undo2, Redo2,
    Minus, Square, Circle, Triangle, Brush, Star
} from 'lucide-react';
import { DrawingTool, Language } from '../types';
import { TEXT } from '../utils/i18n';

interface ControlsProps {
  tool: DrawingTool;
  onToolChange?: (tool: DrawingTool) => void;
  brushSize?: number;
  onBrushSizeChange?: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  themeColor?: string;
  language: Language;
  activeGuideStep?: string | null;
  onNextGuide?: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  tool,
  onToolChange,
  brushSize = 15,
  onBrushSizeChange,
  onUndo,
  onRedo,
  onClear,
  themeColor,
  language,
  activeGuideStep,
  onNextGuide
}) => {
  const t = TEXT[language];
  
  const ToolButton = ({ t, icon: Icon, customIcon }: { t: DrawingTool, icon?: any, customIcon?: React.ReactNode }) => {
      const isSelected = tool === t;
      // Traditional red for active state
      const activeStyle = isSelected && themeColor ? { backgroundColor: themeColor, color: 'white', borderColor: themeColor } : {};
      
      const isGuideTarget = activeGuideStep === 'cut_tool' && t === 'brush';

      return (
        <div className="relative">
            <button
                onClick={() => onToolChange?.(t)}
                style={activeStyle}
                className={`w-10 h-10 flex items-center justify-center transition-all border-2 rounded-sm ${
                    isSelected 
                    ? 'bg-[#C23531] text-white border-[#a02622] shadow-sm' 
                    : 'bg-[#fffbf0] text-[#8c7b6c] border-[#eaddcf] hover:border-red-300 hover:text-red-700'
                }`}
                title={t}
            >
                {customIcon ? customIcon : (Icon && <Icon size={18} />)}
            </button>
            {isGuideTarget && (
                <div className="absolute inset-0 -m-1 border-2 border-red-500 rounded-sm animate-pulse pointer-events-none"></div>
            )}
        </div>
      );
  };

  const GuidePopup = ({ title, sub, onClick }: { title: string, sub: string, onClick?: () => void }) => (
      <div 
        className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-36 bg-[#fffbf0] text-red-900 border border-[#d4c4b0] text-xs p-2 rounded-sm shadow-xl text-center cursor-pointer animate-in fade-in slide-in-from-bottom-2 z-50"
        onClick={onClick}
      >
        <div className="font-bold mb-0.5 font-serif">{title}</div>
        <div className="opacity-90 text-[10px]">{sub}</div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#fffbf0] border-r border-b border-[#d4c4b0] rotate-45"></div>
      </div>
  );

  const GuideRing = () => (
      <div className="absolute inset-0 -m-1 border-2 border-yellow-500 rounded-lg animate-pulse pointer-events-none z-40"></div>
  );

  const isThicknessGuide = activeGuideStep === 'cut_thickness';
  const isShapesGuide = activeGuideStep === 'cut_shapes';
  const isResetGuide = activeGuideStep === 'cut_reset';

  return (
    <div className="flex flex-col gap-4 w-full p-5 bg-white rounded-sm shadow-md border border-[#d4c4b0] chinese-card">
      
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 border-b border-[#eaddcf] pb-2">
                {/* Visual Title */}
                <div className="flex items-center gap-2 text-[#8c7b6c] font-bold uppercase text-xs tracking-wider font-serif">
                    <Scissors size={14} />
                    <span>{t.tools}</span>
                </div>

                {/* History Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onUndo}
                        className="w-8 h-8 flex items-center justify-center rounded-sm bg-[#fffbf0] border border-[#eaddcf] text-[#8c7b6c] hover:text-red-800 hover:border-red-200 transition-all"
                        title={t.undo}
                    >
                        <Undo2 size={16} />
                    </button>
                    <button
                        onClick={onRedo}
                        className="w-8 h-8 flex items-center justify-center rounded-sm bg-[#fffbf0] border border-[#eaddcf] text-[#8c7b6c] hover:text-red-800 hover:border-red-200 transition-all"
                        title={t.redo}
                    >
                        <Redo2 size={16} />
                    </button>
                </div>
            </div>

            {/* Row 1: Draw Tools + Slider */}
            <div className="flex items-center gap-3 bg-[#fdfbf7] p-2 rounded-sm border border-[#eaddcf] relative">
                <ToolButton t="brush" icon={Brush} />
                <ToolButton t="line" icon={Minus} />
                <ToolButton t="arc" customIcon={
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 18C3 10 10 3 18 3" />
                     </svg>
                } />

                <div className="w-px h-6 bg-[#d4c4b0] mx-1"></div>

                 {/* Size Slider */}
                <div className="flex items-center gap-2 flex-1 px-1 relative">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#d4c4b0]"></div>
                    <input
                        type="range"
                        min="2"
                        max="40"
                        value={brushSize}
                        onChange={(e) => onBrushSizeChange?.(parseInt(e.target.value))}
                        className="flex-1 h-1.5 bg-[#eaddcf] rounded-full appearance-none cursor-pointer accent-[#C23531] hover:accent-red-700"
                        style={{ accentColor: themeColor || '#C23531' }}
                        title={t.thickness}
                    />
                    <div className="w-3 h-3 rounded-full bg-[#d4c4b0]"></div>

                    {isThicknessGuide && <GuideRing />}
                    {isThicknessGuide && (
                        <GuidePopup 
                            title={t.guide_cut_thickness} 
                            sub={t.guide_cut_thickness_sub} 
                            onClick={onNextGuide} 
                        />
                    )}
                </div>
            </div>

            {/* Row 2: Shapes */}
            <div className="flex justify-between bg-[#fdfbf7] p-2 rounded-sm border border-[#eaddcf] relative">
                <ToolButton t="square" customIcon={<Square size={18} />} />
                <ToolButton t="rect" customIcon={
                    <div className="w-5 h-3.5 border-2 border-current rounded-sm"></div>
                } />
                <ToolButton t="circle" icon={Circle} />
                <ToolButton t="ellipse" customIcon={
                    <div className="w-5 h-3.5 border-2 border-current rounded-full"></div>
                } />
                <ToolButton t="triangle" icon={Triangle} />
                <ToolButton t="trapezoid" customIcon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 20L7 6H17L20 20H4Z" />
                    </svg>
                } />
                <ToolButton t="star" icon={Star} />

                {isShapesGuide && <GuideRing />}
                {isShapesGuide && (
                    <GuidePopup 
                        title={t.guide_cut_shapes} 
                        sub={t.guide_cut_shapes_sub} 
                        onClick={onNextGuide} 
                    />
                )}
            </div>
        </div>

      {/* Footer Actions: Reset */}
      <div className="pt-2 border-t border-[#eaddcf] relative mt-2">
            <button
              onClick={onClear}
              className="w-full py-2.5 rounded-sm bg-[#f0ece2] text-[#8c7b6c] hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-transparent transition-all flex items-center justify-center gap-2 font-serif font-bold tracking-wide"
              title={t.startOver}
            >
              <RotateCcw size={16} />
              {t.startOver}
            </button>
            {isResetGuide && (
                <>
                    <GuideRing />
                    <GuidePopup 
                        title={t.guide_cut_reset} 
                        sub={t.guide_cut_reset_sub} 
                        onClick={() => onNextGuide?.()} 
                    />
                </>
            )}
      </div>
    </div>
  );
};

export default Controls;