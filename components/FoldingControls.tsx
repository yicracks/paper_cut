
import React, { useState } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CornerLeftUp, CornerRightUp, CornerLeftDown, CornerRightDown, RotateCcw, Scissors, Pentagon, Square, Hexagon, Triangle, Layers, Snowflake } from 'lucide-react';
import { FoldDirection, FoldingMode, Language } from '../types';
import { TEXT } from '../utils/i18n';

interface FoldingControlsProps {
  mode: FoldingMode;
  onModeChange: (mode: FoldingMode) => void;
  onFold: (direction: FoldDirection) => void;
  canFold: (direction: FoldDirection) => boolean;
  onPresetSelect: (folds: number) => void;
  selectedPreset: number;
  onFinish: () => void;
  onReset: () => void;
  foldCount: number;
  maxFolds: number;
  paperColor: string;
  onColorChange: (color: string) => void;
  themeColor?: string;
  language: Language;
  activeGuideStep?: string | null;
}

const FoldingControls: React.FC<FoldingControlsProps> = ({ 
  mode,
  onModeChange,
  onFold, 
  canFold, 
  onPresetSelect,
  selectedPreset,
  onFinish, 
  onReset, 
  foldCount, 
  maxFolds,
  paperColor,
  onColorChange,
  themeColor,
  language,
  activeGuideStep
}) => {
  const t = TEXT[language];

  // Helper to determine if a specific button is currently the active guide step
  const isButtonActive = (dir: FoldDirection) => {
      if (activeGuideStep === 'fold_up' && dir === 'UP') return true;
      if (activeGuideStep === 'fold_right' && dir === 'RIGHT') return true;
      if (activeGuideStep === 'fold_br' && dir === 'BR') return true;
      return false;
  };

  const getGuideText = (dir: FoldDirection) => {
      if (dir === 'UP') return { title: t.guide_fold_up, sub: t.guide_fold_up_sub };
      if (dir === 'RIGHT') return { title: t.guide_fold_right, sub: t.guide_fold_right_sub };
      if (dir === 'BR') return { title: t.guide_fold_br, sub: t.guide_fold_br_sub };
      return { title: '', sub: '' };
  };

  const Button = ({ dir, icon: Icon, labelKey }: { dir: FoldDirection, icon: any, labelKey: string }) => {
    const disabled = !canFold(dir);
    // @ts-ignore
    const label = t[labelKey] || labelKey;
    const isActiveGuide = isButtonActive(dir);

    const btn = (
      <button
        onClick={() => onFold(dir)}
        disabled={disabled}
        className={`flex items-center justify-center p-4 rounded-lg transition-all aspect-square w-full h-full relative ${
          disabled 
            ? 'bg-zinc-50 text-zinc-200 cursor-not-allowed' 
            : 'bg-white shadow-sm hover:shadow-md hover:bg-red-50 text-zinc-600 hover:text-red-600 border border-zinc-100'
        }`}
        style={isActiveGuide ? { zIndex: 60, borderColor: '#ef4444' } : {}}
        title={`${label}`}
      >
        <Icon size={24} strokeWidth={2} />
      </button>
    );

    // If active guide, wrap it
    if (isActiveGuide) {
        const txt = getGuideText(dir);
        return (
            <div className="relative z-50">
                {btn}
                {/* Highlight Ring */}
                <div 
                    className="absolute inset-0 -m-1 border-4 border-red-500 rounded-xl animate-pulse pointer-events-none"
                    style={{ zIndex: 59 }}
                ></div>

                {/* Tooltip Bubble */}
                <div 
                    className="absolute -top-16 left-1/2 -translate-x-1/2 w-36 bg-red-600 text-white text-xs p-2 rounded-lg shadow-xl text-center cursor-pointer animate-in fade-in slide-in-from-bottom-2 pointer-events-none"
                    style={{ zIndex: 70 }}
                >
                    <div className="font-bold mb-0.5">{txt.title}</div>
                    <div className="opacity-90 text-[10px]">{txt.sub}</div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rotate-45"></div>
                </div>
            </div>
        );
    }

    return btn;
  };

  const PresetButton = ({ count, icon: Icon }: { count: number, icon: any }) => {
      const isSelected = selectedPreset === count;
      const activeStyle = isSelected && themeColor ? { 
          backgroundColor: themeColor, 
          color: 'white', 
          borderColor: themeColor 
      } : {};
      
      const activeClass = isSelected 
        ? (themeColor ? 'shadow-sm' : 'bg-red-50 border-red-200 text-red-600 shadow-sm')
        : 'bg-white border-zinc-100 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700';

      return (
        <button
            onClick={() => onPresetSelect(count)}
            style={activeStyle}
            className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all aspect-square border ${activeClass}`}
            title={`${count}-Fold`}
        >
            <Icon size={24} strokeWidth={2} className="mb-1" />
            <span className="text-sm font-bold">{count}</span>
        </button>
      );
  };

  const activeTabStyle = themeColor ? { color: themeColor } : { color: '#DC2626' };
  const isFinishGuide = activeGuideStep === 'fold_finish';

  return (
    <div className="w-full max-w-xs mx-auto p-4 bg-white rounded-xl shadow-lg border border-zinc-100">
      
      {/* Mode Toggle Tabs */}
      <div className="flex bg-zinc-100 p-1 rounded-lg mb-4">
        <button
          onClick={() => onModeChange('custom')}
          style={mode === 'custom' ? activeTabStyle : {}}
          className={`flex-1 py-3 flex items-center justify-center rounded-md transition-all ${
            mode === 'custom' 
            ? 'bg-white shadow-sm' 
            : 'text-zinc-400 hover:text-zinc-600'
          }`}
          title={t.freeFold}
        >
          <Layers size={20} />
        </button>
        <button
          onClick={() => onModeChange('preset')}
          style={mode === 'preset' ? activeTabStyle : {}}
          className={`flex-1 py-3 flex items-center justify-center rounded-md transition-all ${
            mode === 'preset' 
            ? 'bg-white shadow-sm' 
            : 'text-zinc-400 hover:text-zinc-600'
          }`}
          title={t.presetPatterns}
        >
          <Snowflake size={20} />
        </button>
      </div>

      {mode === 'custom' ? (
        <div className="grid grid-cols-3 gap-3 mb-6 relative">
            <Button dir="TL" icon={CornerLeftUp} labelKey="fold_TL" />
            <Button dir="UP" icon={ArrowUp} labelKey="fold_UP" />
            <Button dir="TR" icon={CornerRightUp} labelKey="fold_TR" />

            <Button dir="LEFT" icon={ArrowLeft} labelKey="fold_LEFT" />
            <div className="flex items-center justify-center relative">
                <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-sm border border-zinc-200 ring-2 ring-white">
                    <input 
                        type="color" 
                        value={paperColor}
                        onChange={(e) => onColorChange(e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10 scale-150"
                        title={t.changeColor}
                    />
                    <div 
                        className="w-full h-full"
                        style={{ backgroundColor: paperColor }}
                    ></div>
                </div>
            </div>
            <Button dir="RIGHT" icon={ArrowRight} labelKey="fold_RIGHT" />

            <Button dir="BL" icon={CornerLeftDown} labelKey="fold_BL" />
            <Button dir="DOWN" icon={ArrowDown} labelKey="fold_DOWN" />
            <Button dir="BR" icon={CornerRightDown} labelKey="fold_BR" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
            <PresetButton count={3} icon={Triangle} />
            <PresetButton count={4} icon={Square} />
            <PresetButton count={5} icon={Pentagon} />
            <PresetButton count={6} icon={Hexagon} />
        </div>
      )}

      <div className="flex gap-3 h-14 relative">
        {mode === 'custom' && (
            <button
                onClick={onReset}
                className="w-14 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 font-bold hover:bg-zinc-200 transition-colors"
                title={t.resetPaper}
            >
                <RotateCcw size={22} />
            </button>
        )}
        
        <div className={`flex-1 relative ${isFinishGuide ? 'z-50' : ''}`}>
             <button
                onClick={onFinish}
                disabled={mode === 'custom' && foldCount === 0}
                style={themeColor ? { backgroundColor: themeColor } : {}}
                className={`w-full h-full rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                    (mode === 'custom' && foldCount === 0)
                    ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none'
                    : (themeColor ? 'text-white shadow-md' : 'bg-red-600 text-white hover:bg-red-700 shadow-red-200')
                }`}
                title={t.startCutting}
            >
                <Scissors size={24} className="-rotate-45" />
            </button>
            
            {isFinishGuide && (
                <>
                    <div className="absolute inset-0 -m-1 border-4 border-red-500 rounded-xl animate-pulse pointer-events-none"></div>
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 bg-red-600 text-white text-xs p-2 rounded-lg shadow-xl text-center pointer-events-none">
                        <div className="font-bold mb-0.5">{t.guide_fold_finish}</div>
                        <div className="opacity-90 text-[10px]">{t.guide_fold_finish_sub}</div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rotate-45"></div>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default FoldingControls;
