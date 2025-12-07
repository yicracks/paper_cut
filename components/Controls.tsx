
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
      const activeStyle = isSelected && themeColor ? { backgroundColor: themeColor, color: 'white', borderColor: themeColor } : {};
      
      const isGuideTarget = activeGuideStep === 'cut_tool' && t === 'brush';

      return (
        <div className="relative">
            <button
                onClick={() => onToolChange?.(t)}
                style={activeStyle}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    isSelected 
                    ? 'bg-red-600 text-white shadow-md' 
                    : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-red-500'
                }`}
                title={t}
            >
                {customIcon ? customIcon : (Icon && <Icon size={20} />)}
            </button>
            {isGuideTarget && (
                <div className="absolute inset-0 -m-1 border-2 border-red-500 rounded-xl animate-pulse pointer-events-none"></div>
            )}
        </div>
      );
  };

  const GuidePopup = ({ title, sub, onClick }: { title: string, sub: string, onClick?: () => void }) => (
      <div 
        className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-36 bg-red-600 text-white text-xs p-2 rounded-lg shadow-xl text-center cursor-pointer animate-in fade-in slide-in-from-bottom-2 z-50"
        onClick={onClick}
      >
        <div className="font-bold mb-0.5">{title}</div>
        <div className="opacity-90 text-[10px]">{sub}</div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rotate-45"></div>
      </div>
  );

  const GuideRing = () => (
      <div className="absolute inset-0 -m-1 border-4 border-red-500 rounded-xl animate-pulse pointer-events-none z-40"></div>
  );

  const isThicknessGuide = activeGuideStep === 'cut_thickness';
  const isShapesGuide = activeGuideStep === 'cut_shapes';
  const isResetGuide = activeGuideStep === 'cut_reset';

  return (
    <div className="flex flex-col gap-4 w-full p-4 bg-white rounded-xl shadow-lg border border-zinc-100">
      
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
                {/* Visual Title */}
                <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase text-xs tracking-wider">
                    <Scissors size={14} />
                    <span>{t.tools}</span>
                </div>

                {/* History Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onUndo}
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all"
                        title={t.undo}
                    >
                        <Undo2 size={20} />
                    </button>
                    <button
                        onClick={onRedo}
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all"
                        title={t.redo}
                    >
                        <Redo2 size={20} />
                    </button>
                </div>
            </div>

            {/* Row 1: Draw Tools + Slider */}
            <div className="flex items-center gap-3 bg-zinc-50 p-1.5 rounded-xl border border-zinc-100 relative">
                <ToolButton t="brush" icon={Brush} />
                <ToolButton t="line" icon={Minus} />
                <ToolButton t="arc" customIcon={
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 18C3 10 10 3 18 3" />
                     </svg>
                } />

                <div className="w-px h-6 bg-zinc-200 mx-1"></div>

                 {/* Size Slider */}
                <div className="flex items-center gap-2 flex-1 px-1 relative">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
                    <input
                        type="range"
                        min="2"
                        max="40"
                        value={brushSize}
                        onChange={(e) => onBrushSizeChange?.(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-red-600 hover:accent-red-500"
                        style={{ accentColor: themeColor }}
                        title={t.thickness}
                    />
                    <div className="w-3 h-3 rounded-full bg-zinc-300"></div>

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
            <div className="flex justify-between bg-zinc-50 p-1.5 rounded-xl border border-zinc-100 relative">
                <ToolButton t="square" customIcon={<Square size={20} />} />
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
      <div className="pt-2 border-t border-zinc-100 relative">
            <button
              onClick={onClear}
              className="w-full py-2 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-red-600 transition-all flex items-center justify-center gap-2 font-medium"
              title={t.startOver}
            >
              <RotateCcw size={18} />
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
