import React from 'react';
import { X, LayoutGrid, Type, Sparkles } from 'lucide-react';
import { STENCILS, StencilPattern } from '../patterns';
import { Language } from '../types';
import { motion } from 'motion/react';

interface StencilPickerProps {
  onSelect: (stencil: StencilPattern) => void;
  onClose: () => void;
  language: Language;
  dragConstraints?: React.RefObject<HTMLDivElement | null>;
}

const QUICK_CHARACTERS = ['福', '春', '喜', '寿', '吉', '祥', '和', '乐', '平', '安'];

const StencilPicker: React.FC<StencilPickerProps> = ({
  onSelect,
  onClose,
  language,
  dragConstraints
}) => {
  const isZh = language === 'zh';
  const [activeCategory, setActiveCategory] = React.useState<string>('all');
  const [customText, setCustomText] = React.useState('福');
  const [selectedFrame, setSelectedFrame] = React.useState<'round' | 'diamond' | 'lantern'>('round');

  const categories = [
    { id: 'all', zh: '全部', en: 'All' },
    { id: 'traditional', zh: '经典', en: 'Classic' },
    { id: 'zodiac', zh: '十二生肖', en: 'Zodiac' },
    { id: 'astrology', zh: '十二星座', en: 'Astrology' },
    { id: 'wedding', zh: '节日婚庆', en: 'Festive & Wedding' },
    { id: 'custom_text', zh: '自制字帖', en: 'DIY Text' },
  ];

  const filteredStencils = STENCILS.filter(
    (s) => activeCategory === 'all' || s.category === activeCategory
  );

  const getCustomSvg = (text: string, frame: 'round' | 'diamond' | 'lantern') => {
    const cleanedText = (text || '').trim().slice(0, 2); // Limit to 2 characters max
    if (!cleanedText) return '';

    if (frame === 'diamond') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
  <path d="M50,5 L95,50 L50,95 L5,50 Z" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round" />
  <path d="M50,11 L89,50 L50,89 L11,50 Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
  <path d="M50,8 L54,15 L46,15 Z" />
  <path d="M50,92 L54,85 L46,85 Z" />
  <path d="M8,50 L15,54 L15,46 Z" />
  <path d="M92,50 L85,54 L85,46 Z" />
  <text x="50" y="52" font-family="'Noto Serif SC', 'STKaiti', 'Kaiti', 'Georgia', 'serif', sans-serif" font-size="${cleanedText.length > 1 ? '24' : '42'}" font-weight="900" text-anchor="middle" dominant-baseline="central" fill="currentColor">${cleanedText}</text>
</svg>`;
    }

    if (frame === 'lantern') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
  <path d="M50,6 C25,12 21,32 21,50 C21,68 25,88 50,94 C75,88 79,68 79,50 C79,32 75,12 50,6 Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" />
  <rect x="35" y="3" width="30" height="4" rx="1.5" />
  <rect x="35" y="93" width="30" height="4" rx="1.5" />
  <path d="M44,97 L44,100 M50,97 L50,100 M56,97 L56,100" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
  <text x="50" y="50" font-family="'Noto Serif SC', 'STKaiti', 'Kaiti', 'Georgia', 'serif', sans-serif" font-size="${cleanedText.length > 1 ? '22' : '38'}" font-weight="900" text-anchor="middle" dominant-baseline="central" fill="currentColor">${cleanedText}</text>
</svg>`;
    }

    // Default 'round'
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="4" />
  <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" stroke-width="1.5" />
  <path d="M50,2 L53,6 L47,6 Z" />
  <path d="M50,98 L53,94 L47,94 Z" />
  <path d="M2,50 L6,53 L6,47 Z" />
  <path d="M98,50 L94,53 L94,47 Z" />
  <circle cx="21" cy="21" r="2.5" />
  <circle cx="79" cy="21" r="2.5" />
  <circle cx="21" cy="79" r="2.5" />
  <circle cx="79" cy="79" r="2.5" />
  <text x="50" y="52" font-family="'Noto Serif SC', 'STKaiti', 'Kaiti', 'Georgia', 'serif', sans-serif" font-size="${cleanedText.length > 1 ? '24' : '42'}" font-weight="900" text-anchor="middle" dominant-baseline="central" fill="currentColor">${cleanedText}</text>
</svg>`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      drag
      dragConstraints={dragConstraints}
      dragElastic={0}
      dragMomentum={false}
      className="absolute top-12 left-12 w-72 z-50 bg-white/95 backdrop-blur-md border border-[#d4c4b0] shadow-2xl p-3.5 rounded-sm chinese-card cursor-move"
    >
      <div className="flex justify-between items-center mb-3 pb-1 border-b border-[#eaddcf] select-none">
        <div className="flex items-center gap-1.5 align-middle">
          <LayoutGrid size={14} className="text-[#C23531]" />
          <h3 className="text-xs font-bold text-[#5c5c5c] tracking-widest font-serif">
            {isZh ? '剪纸花样图案库' : 'Jianzhi Stencils'}
          </h3>
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

      <div 
        className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1" 
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 pb-2 select-none shrink-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2 py-0.5 text-[10px] rounded-full border transition-all text-nowrap cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-[#C23531] text-white border-[#C23531] font-bold'
                  : 'bg-[#fdfbf7] text-[#5c5c5c] border-[#eaddcf] hover:border-[#C23531]'
              }`}
            >
              {isZh ? cat.zh : cat.en}
            </button>
          ))}
        </div>

        <p className="text-[10px] text-[#8c7b6c] font-serif mb-1 select-none leading-relaxed">
          {isZh ? '* 点击图案即刻裁剪放入画布，调整位置、大小或旋转时将自动工作并刷新裁剪效果。' : '* Tap a pattern to instantly place and cut. Adjusting handles will auto-refresh the cuts.'}
        </p>

        {activeCategory === 'custom_text' ? (
          <div className="flex flex-col gap-3 p-2 bg-[#fdfbf7] border border-[#eaddcf] rounded-sm select-none">
            {/* Input fields */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#8c7b6c] font-serif flex items-center gap-1">
                <Type size={11} className="text-[#C23531]" />
                {isZh ? '定制文字 (支持1-2个字)' : 'Custom Characters (1-2 chars)'}
              </label>
              <input
                type="text"
                maxLength={2}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full px-2 py-1 text-sm font-bold border border-[#d4c4b0] rounded-sm bg-white text-[#2C2C2C] focus:outline-none focus:border-[#C23531] font-serif text-center"
                placeholder={isZh ? '例如：春' : 'e.g. 春'}
              />
            </div>

            {/* Quick selectors */}
            <div className="flex flex-wrap gap-1 justify-center py-1">
              {QUICK_CHARACTERS.map((char) => (
                <button
                  key={char}
                  onClick={() => setCustomText(char)}
                  className={`w-6 h-6 text-xs font-bold rounded-sm border cursor-pointer transition-colors hover:bg-red-50 hover:border-[#C23531] font-serif ${
                    customText === char
                      ? 'bg-[#C23531] text-white border-[#C23531]'
                      : 'bg-white text-[#5c5c5c] border-[#eaddcf]'
                  }`}
                >
                  {char}
                </button>
              ))}
            </div>

            {/* Frame Styles */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[#8c7b6c] font-serif">
                {isZh ? '选择剪纸花栏边框' : 'Select Border Style'}
              </span>
              <div className="grid grid-cols-3 gap-1">
                {(
                  [
                    { id: 'round', zh: '团圆双环', en: 'Round' },
                    { id: 'diamond', zh: '春联福格', en: 'Diamond' },
                    { id: 'lantern', zh: '喜庆红灯', en: 'Lantern' },
                  ] as const
                ).map((frm) => (
                  <button
                    key={frm.id}
                    onClick={() => setSelectedFrame(frm.id)}
                    className={`px-1 py-0.5 text-[9px] rounded-sm border cursor-pointer font-serif transition-all text-center truncate ${
                      selectedFrame === frm.id
                        ? 'bg-[#C23531]/10 text-[#C23531] border-[#C23531] font-bold'
                        : 'bg-white text-[#5c5c5c] border-[#eaddcf] hover:border-[#C23531]'
                    }`}
                  >
                    {isZh ? frm.zh : frm.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Generated pattern preview */}
            <div className="flex flex-col items-center py-2 bg-white border border-[#eaddcf] rounded-sm">
              <span className="text-[9px] text-[#8c7b6c] font-serif mb-1 tracking-wider">
                {isZh ? '— 实时镂空裁剪效果 —' : '— Live Carve Preview —'}
              </span>
              <div
                className="w-20 h-20 flex items-center justify-center text-[#C23531] p-0.5 scale-100 hover:scale-105 transition-transform"
                dangerouslySetInnerHTML={{ __html: getCustomSvg(customText, selectedFrame) }}
              />
            </div>

            {/* Main carve action button */}
            <button
              onClick={() => {
                const cleaned = (customText || '').trim();
                if (!cleaned) return;
                onSelect({
                  id: 'custom_generated_' + Date.now().toString(),
                  nameZh: `定制 ·「${cleaned}」`,
                  nameEn: `DIY "${cleaned}"`,
                  svgContent: getCustomSvg(cleaned, selectedFrame),
                  category: 'traditional'
                });
              }}
              disabled={!customText.trim()}
              className="w-full py-1 bg-[#C23531] text-white rounded-sm text-[10px] font-bold font-serif shadow-md hover:bg-[#a02622] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1"
            >
              <Sparkles size={11} />
              <span>{isZh ? '植入贴纸即时裁剪' : 'Carve to Canvas'}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredStencils.map((stencil) => (
              <button
                key={stencil.id}
                onClick={() => onSelect(stencil)}
                className="flex flex-col items-center p-2 rounded-sm border border-[#eaddcf] bg-[#f9f7f2] hover:bg-red-50/50 hover:border-[#C23531] transition-all group cursor-pointer"
              >
                <div 
                  className="w-16 h-16 flex items-center justify-center text-[#C23531]/80 group-hover:text-[#C23531] group-hover:scale-105 transition-all mb-1.5"
                  dangerouslySetInnerHTML={{ __html: stencil.svgContent }}
                />
                <span className="text-[10px] font-bold text-[#5c5c5c] font-serif text-center group-hover:text-[#C23531] transition-colors truncate w-full">
                  {isZh ? stencil.nameZh : stencil.nameEn}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StencilPicker;
