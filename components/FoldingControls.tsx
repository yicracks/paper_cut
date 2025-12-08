
import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CornerLeftUp, CornerRightUp, CornerLeftDown, CornerRightDown, RotateCcw, Pentagon, Square, Hexagon, Triangle, Layers, Snowflake } from 'lucide-react';
import { FoldDirection, FoldingMode, Language } from '../types';
import { TEXT } from '../utils/i18n';

interface FoldingControlsProps {
  mode: FoldingMode;
  onModeChange: (mode: FoldingMode) => void;
  onFold: (direction: FoldDirection) => void;
  canFold: (direction: FoldDirection) => boolean;
  onPresetSelect: (folds: number) => void;
  selectedPreset: number;
  onReset: () => void;
  foldCount: number;
  maxFolds: number;
  paperColor: string;
  onColorChange: (color: string) => void;
  themeColor?: string;
  language: Language;
}

const FoldingControls: React.FC<FoldingControlsProps> = ({ 
  mode,
  onModeChange,
  onFold, 
  canFold, 
  onPresetSelect,
  selectedPreset,
  onReset, 
  foldCount, 
  paperColor,
  onColorChange,
  themeColor,
  language
}) => {
  const t = TEXT[language];

  // Smaller icons requested
  const ICON_SIZE = 14;

  const Button = ({ dir, icon: Icon, labelKey }: { dir: FoldDirection, icon: any, labelKey: string }) => {
    const disabled = !canFold(dir);
    // @ts-ignore
    const label = t[labelKey] || labelKey;

    return (
      <button
        onClick={() => onFold(dir)}
        disabled={disabled}
        className={`flex items-center justify-center p-1.5 rounded-sm transition-all aspect-square w-full h-full relative border ${
          disabled 
            ? 'bg-white/20 text-zinc-300 border-white/20 cursor-not-allowed' 
            : 'bg-white/40 shadow-sm hover:shadow-md hover:bg-white/60 text-[#2C2C2C] hover:text-[#C23531] border-white/30 hover:border-red-200'
        }`}
        title={`${label}`}
      >
        <Icon size={ICON_SIZE} strokeWidth={2} />
      </button>
    );
  };

  const PresetButton = ({ count, icon: Icon }: { count: number, icon: any }) => {
      const isSelected = selectedPreset === count;
      const activeStyle = isSelected && themeColor ? { 
          backgroundColor: themeColor, 
          color: 'white', 
          borderColor: themeColor 
      } : {};
      
      const activeClass = isSelected 
        ? (themeColor ? 'shadow-sm' : 'bg-red-50/80 border-red-300 text-red-700 shadow-sm')
        : 'bg-white/40 border-white/30 text-[#5c5c5c] hover:bg-white/60 hover:text-[#2C2C2C] hover:border-white/50';

      return (
        <button
            onClick={() => onPresetSelect(count)}
            style={activeStyle}
            className={`flex flex-col items-center justify-center p-1.5 rounded-sm transition-all aspect-square border ${activeClass}`}
            title={`${count}-Fold`}
        >
            <Icon size={ICON_SIZE} strokeWidth={2} className="mb-0.5" />
            <span className="text-[10px] font-bold font-serif">{count}</span>
        </button>
      );
  };

  const activeTabStyle = themeColor ? { color: themeColor } : { color: '#C23531' };

  return (
    <div className="w-full">
      
      {/* Mode Toggle Tabs - Preset first */}
      <div className="flex bg-white/20 p-0.5 rounded-sm mb-2 border border-white/20">
        <button
          onClick={() => onModeChange('preset')}
          style={mode === 'preset' ? activeTabStyle : {}}
          className={`flex-1 py-1 flex items-center justify-center rounded-sm transition-all ${
            mode === 'preset' 
            ? 'bg-white/80 shadow-sm border border-white/30' 
            : 'text-[#5c5c5c] hover:text-[#2C2C2C]'
          }`}
          title={t.presetPatterns}
        >
          <Snowflake size={ICON_SIZE} />
        </button>
        <button
          onClick={() => onModeChange('custom')}
          style={mode === 'custom' ? activeTabStyle : {}}
          className={`flex-1 py-1 flex items-center justify-center rounded-sm transition-all ${
            mode === 'custom' 
            ? 'bg-white/80 shadow-sm border border-white/30' 
            : 'text-[#5c5c5c] hover:text-[#2C2C2C]'
          }`}
          title={t.freeFold}
        >
          <Layers size={ICON_SIZE} />
        </button>
      </div>

      {mode === 'custom' ? (
        <div className="grid grid-cols-3 gap-1 mb-1 relative p-1 bg-white/10 border border-white/20 rounded-sm">
            <Button dir="TL" icon={CornerLeftUp} labelKey="fold_TL" />
            <Button dir="UP" icon={ArrowUp} labelKey="fold_UP" />
            <Button dir="TR" icon={CornerRightUp} labelKey="fold_TR" />

            <Button dir="LEFT" icon={ArrowLeft} labelKey="fold_LEFT" />
            <div className="flex items-center justify-center relative">
                <div className="relative w-5 h-5 rounded-full overflow-hidden shadow-sm border-2 border-white ring-1 ring-[#d4c4b0]">
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
        <div className="grid grid-cols-2 gap-1 mb-1 p-1 bg-white/10 border border-white/20 rounded-sm">
            <PresetButton count={3} icon={Triangle} />
            <PresetButton count={4} icon={Square} />
            <PresetButton count={5} icon={Pentagon} />
            <PresetButton count={6} icon={Hexagon} />
            {/* Color picker for preset mode */}
            <div className="col-span-2 mt-1 flex justify-center border-t border-white/20 pt-1">
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#5c5c5c] font-serif">{t.changeColor}:</span>
                    <div className="relative w-4 h-4 rounded-full overflow-hidden shadow-sm border border-white/50">
                        <input 
                            type="color" 
                            value={paperColor}
                            onChange={(e) => onColorChange(e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                        <div className="w-full h-full" style={{ backgroundColor: paperColor }}></div>
                    </div>
                 </div>
            </div>
        </div>
      )}

      {mode === 'custom' && (
        <div className="mt-2 flex justify-center">
             <button
                onClick={onReset}
                className="w-full py-1 flex items-center justify-center rounded-sm bg-white/30 text-[#5c5c5c] border border-transparent hover:border-white/50 hover:text-[#2C2C2C] transition-colors gap-2 text-[10px]"
                title={t.resetPaper}
            >
                <RotateCcw size={12} />
                {t.resetPaper}
            </button>
        </div>
      )}
    </div>
  );
};

export default FoldingControls;
