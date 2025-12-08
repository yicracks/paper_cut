
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

  // Smaller icons (size 18 instead of 24)
  const ICON_SIZE = 18;

  const Button = ({ dir, icon: Icon, labelKey }: { dir: FoldDirection, icon: any, labelKey: string }) => {
    const disabled = !canFold(dir);
    // @ts-ignore
    const label = t[labelKey] || labelKey;

    return (
      <button
        onClick={() => onFold(dir)}
        disabled={disabled}
        className={`flex items-center justify-center p-2 rounded-sm transition-all aspect-square w-full h-full relative border ${
          disabled 
            ? 'bg-[#f8f8f8] text-zinc-200 border-zinc-100 cursor-not-allowed' 
            : 'bg-white shadow-sm hover:shadow-md hover:bg-red-50 text-[#5c5c5c] hover:text-[#C23531] border-[#eaddcf] hover:border-red-200'
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
        ? (themeColor ? 'shadow-sm' : 'bg-red-50 border-red-300 text-red-700 shadow-sm')
        : 'bg-white border-[#eaddcf] text-[#8c7b6c] hover:bg-[#fffbf0] hover:text-[#5c5c5c] hover:border-[#d4c4b0]';

      return (
        <button
            onClick={() => onPresetSelect(count)}
            style={activeStyle}
            className={`flex flex-col items-center justify-center p-2 rounded-sm transition-all aspect-square border ${activeClass}`}
            title={`${count}-Fold`}
        >
            <Icon size={ICON_SIZE} strokeWidth={2} className="mb-1" />
            <span className="text-xs font-bold font-serif">{count}</span>
        </button>
      );
  };

  const activeTabStyle = themeColor ? { color: themeColor } : { color: '#C23531' };

  return (
    <div className="w-full p-3 bg-white rounded-sm shadow-md border border-[#d4c4b0] chinese-card">
      
      {/* Mode Toggle Tabs - Preset first */}
      <div className="flex bg-[#fdfbf7] p-1 rounded-sm mb-3 border border-[#eaddcf]">
        <button
          onClick={() => onModeChange('preset')}
          style={mode === 'preset' ? activeTabStyle : {}}
          className={`flex-1 py-2 flex items-center justify-center rounded-sm transition-all ${
            mode === 'preset' 
            ? 'bg-white shadow-sm border border-zinc-100' 
            : 'text-[#8c7b6c] hover:text-[#5c5c5c]'
          }`}
          title={t.presetPatterns}
        >
          <Snowflake size={ICON_SIZE} />
        </button>
        <button
          onClick={() => onModeChange('custom')}
          style={mode === 'custom' ? activeTabStyle : {}}
          className={`flex-1 py-2 flex items-center justify-center rounded-sm transition-all ${
            mode === 'custom' 
            ? 'bg-white shadow-sm border border-zinc-100' 
            : 'text-[#8c7b6c] hover:text-[#5c5c5c]'
          }`}
          title={t.freeFold}
        >
          <Layers size={ICON_SIZE} />
        </button>
      </div>

      {mode === 'custom' ? (
        <div className="grid grid-cols-3 gap-2 mb-2 relative p-2 bg-[#f9f7f2] border border-[#eaddcf] rounded-sm">
            <Button dir="TL" icon={CornerLeftUp} labelKey="fold_TL" />
            <Button dir="UP" icon={ArrowUp} labelKey="fold_UP" />
            <Button dir="TR" icon={CornerRightUp} labelKey="fold_TR" />

            <Button dir="LEFT" icon={ArrowLeft} labelKey="fold_LEFT" />
            <div className="flex items-center justify-center relative">
                <div className="relative w-6 h-6 rounded-full overflow-hidden shadow-sm border-2 border-white ring-1 ring-[#d4c4b0]">
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
        <div className="grid grid-cols-2 gap-2 mb-2 p-2 bg-[#f9f7f2] border border-[#eaddcf] rounded-sm">
            <PresetButton count={3} icon={Triangle} />
            <PresetButton count={4} icon={Square} />
            <PresetButton count={5} icon={Pentagon} />
            <PresetButton count={6} icon={Hexagon} />
            {/* Color picker for preset mode */}
            <div className="col-span-2 mt-2 flex justify-center border-t border-[#eaddcf] pt-2">
                 <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8c7b6c] font-serif">{t.changeColor}:</span>
                    <div className="relative w-5 h-5 rounded-full overflow-hidden shadow-sm border border-[#d4c4b0]">
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
        <div className="mt-3 flex justify-center">
             <button
                onClick={onReset}
                className="w-full py-1.5 flex items-center justify-center rounded-sm bg-[#f0ece2] text-[#8c7b6c] border border-transparent hover:border-[#d4c4b0] hover:text-[#5c5c5c] transition-colors gap-2 text-xs"
                title={t.resetPaper}
            >
                <RotateCcw size={14} />
                {t.resetPaper}
            </button>
        </div>
      )}
    </div>
  );
};

export default FoldingControls;
