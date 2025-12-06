
import React from 'react';
import { 
    Scissors, RotateCcw, Eye, Download, Undo2, Redo2,
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
  onShow: () => void;
  isShowingResult: boolean;
  onDownload?: () => void;
  themeColor?: string;
  language: Language;
}

const Controls: React.FC<ControlsProps> = ({
  tool,
  onToolChange,
  brushSize = 15,
  onBrushSizeChange,
  onUndo,
  onRedo,
  onClear,
  onShow,
  isShowingResult,
  onDownload,
  themeColor,
  language
}) => {
  const t = TEXT[language];
  
  const ToolButton = ({ t, icon: Icon, customIcon }: { t: DrawingTool, icon?: any, customIcon?: React.ReactNode }) => {
      const isSelected = tool === t;
      const activeStyle = isSelected && themeColor ? { backgroundColor: themeColor, color: 'white', borderColor: themeColor } : {};
      
      return (
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
      );
  };

  const primaryButtonStyle = themeColor ? { backgroundColor: themeColor } : {};

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm mx-auto p-4 bg-white rounded-xl shadow-lg border border-zinc-100">
      
      {!isShowingResult && (
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
            <div className="flex items-center gap-3 bg-zinc-50 p-1.5 rounded-xl border border-zinc-100">
                <ToolButton t="brush" icon={Brush} />
                <ToolButton t="line" icon={Minus} />
                
                {/* Arc Icon */}
                <ToolButton t="arc" customIcon={
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 18C3 10 10 3 18 3" />
                     </svg>
                } />

                <div className="w-px h-6 bg-zinc-200 mx-1"></div>

                 {/* Size Slider */}
                <div className="flex items-center gap-2 flex-1 px-1">
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
                </div>
            </div>

            {/* Row 2: Shapes */}
            <div className="flex justify-between bg-zinc-50 p-1.5 rounded-xl border border-zinc-100">
                <ToolButton t="square" customIcon={<Square size={20} />} />
                
                <ToolButton t="rect" customIcon={
                    <div className="w-5 h-3.5 border-2 border-current rounded-sm"></div>
                } />
                
                <ToolButton t="circle" icon={Circle} />
                
                {/* Ellipse */}
                <ToolButton t="ellipse" customIcon={
                    <div className="w-5 h-3.5 border-2 border-current rounded-full"></div>
                } />

                <ToolButton t="triangle" icon={Triangle} />
                
                {/* Trapezoid */}
                <ToolButton t="trapezoid" customIcon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 20L7 6H17L20 20H4Z" />
                    </svg>
                } />
                
                <ToolButton t="star" icon={Star} />
            </div>
        </div>
      )}

      <div className={`pt-2 ${!isShowingResult ? 'border-t border-zinc-100' : ''} flex gap-2 ${isShowingResult ? 'justify-center' : ''}`}>
        {!isShowingResult ? (
          <button
            onClick={onShow}
            style={primaryButtonStyle}
            className={`flex-1 ${!themeColor && 'bg-gradient-to-r from-red-600 to-red-500'} text-white hover:shadow-red-500/30 hover:scale-[1.02] py-4 rounded-xl text-lg font-bold tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg`}
            title={t.showResult}
          >
            <Eye size={24} />
          </button>
        ) : (
          <>
            <button
              onClick={onClear}
              className="w-20 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-red-600 transition-all flex items-center justify-center"
              title={t.startOver}
            >
              <RotateCcw size={24} />
            </button>
            
            {onDownload && (
              <button 
                onClick={onDownload}
                style={primaryButtonStyle}
                className={`flex-1 ${!themeColor && 'bg-red-600'} text-white hover:bg-red-700 shadow-lg shadow-red-500/30 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2`}
                title={t.download}
              >
                <Download size={24} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Controls;
