
import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Settings as SettingsIcon, Palette, MessageSquare, Info, Trash2, Upload, BookOpen, Scissors, ArrowUp, ArrowRight, CornerRightDown, Hand, Eye, Download } from 'lucide-react';
import { AppSettings, GalleryItem, Language } from '../types';
import { getGalleryItems, deleteGalleryItem } from '../utils/db';
import { TEXT } from '../utils/i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  language: Language;
}

type Tab = 'gallery' | 'theme' | 'about';

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdateSettings,
  language
}) => {
  const t = TEXT[language];
  const [activeTab, setActiveTab] = useState<Tab>('gallery');
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  
  // Feedback state
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackImage, setFeedbackImage] = useState<File | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  useEffect(() => {
    if (isOpen && activeTab === 'gallery') {
      loadGallery();
    }
  }, [isOpen, activeTab]);

  const loadGallery = async () => {
    const items = await getGalleryItems();
    setGalleryItems(items);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t.deleteConfirm)) {
      await deleteGalleryItem(id);
      loadGallery();
    }
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackStatus('sending');
    setTimeout(() => {
      setFeedbackStatus('sent');
      setFeedbackText('');
      setFeedbackImage(null);
      setTimeout(() => setFeedbackStatus('idle'), 3000);
    }, 1500);
  };

  if (!isOpen) return null;

  const TabButton = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-4 text-left transition-colors font-serif ${
        activeTab === id 
        ? 'bg-[#f0ece2] text-red-900 font-bold border-l-4 border-[#C23531]' 
        : 'text-[#5c5c5c] hover:bg-[#fffbf0]'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  const getTabTitle = (tab: Tab) => {
      switch(tab) {
          case 'gallery': return t.mySavedWorks;
          case 'theme': return t.tab_theme;
          case 'about': return t.tab_about;
          default: return tab;
      }
  }

  // Visual Mock Components for Tutorial
  const MockTooltip = ({ text, subtext, position = 'top' }: { text: string, subtext: string, position?: 'top'|'bottom'|'center' }) => {
      const posClass = position === 'top' ? '-top-16' : (position === 'bottom' ? '-bottom-16' : 'top-1/2 -translate-y-1/2');
      return (
          <div className={`absolute left-1/2 -translate-x-1/2 w-40 bg-[#fffbf0] text-red-900 border border-[#d4c4b0] text-xs p-2 rounded-sm shadow-xl text-center z-50 ${posClass}`}>
              <div className="font-bold mb-0.5 font-serif">{text}</div>
              <div className="opacity-90 text-[10px]">{subtext}</div>
              {position === 'top' && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#fffbf0] border-r border-b border-[#d4c4b0] rotate-45"></div>}
              {position === 'bottom' && <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#fffbf0] border-l border-t border-[#d4c4b0] rotate-45"></div>}
          </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2C2C]/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl h-[600px] rounded-sm shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200 border border-[#d4c4b0] relative">
        {/* Double Border Effect */}
        <div className="absolute inset-1 pointer-events-none border border-[#eaddcf] rounded-sm z-50"></div>

        {/* Sidebar */}
        <div className="w-full md:w-64 bg-[#fdfbf7] border-r border-[#d4c4b0] flex flex-col">
          <div className="p-6 border-b border-[#eaddcf]">
            <h2 className="text-xl font-bold text-[#8c7b6c] flex items-center gap-2 font-serif">
              <SettingsIcon className="text-[#C23531]" />
              {t.settingsTitle}
            </h2>
          </div>
          <nav className="flex-1 py-4">
            <TabButton id="gallery" icon={ImageIcon} label={t.tab_gallery} />
            <TabButton id="theme" icon={Palette} label={t.tab_theme} />
            <TabButton id="about" icon={Info} label={t.tab_about} />
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="flex items-center justify-between p-4 border-b border-[#f0ece2]">
            <h3 className="text-xl font-bold text-[#2C2C2C] capitalize font-serif tracking-wide">
                {getTabTitle(activeTab)}
            </h3>
            <button 
              onClick={onClose}
              className="p-2 text-[#d4c4b0] hover:text-[#C23531] hover:bg-[#fffbf0] rounded-full transition-colors z-50"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-white">
            {/* Gallery Tab */}
            {activeTab === 'gallery' && (
              <div className="space-y-6">
                {galleryItems.length === 0 ? (
                  <div className="text-center py-20 text-[#d4c4b0]">
                    <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-serif">{t.noSaves}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {galleryItems.map(item => (
                      <div key={item.id} className="group relative bg-[#fdfbf7] rounded-sm overflow-hidden border border-[#eaddcf] shadow-sm hover:shadow-md transition-shadow">
                        <div className="aspect-square p-2 flex gap-1 bg-white">
                            <img src={item.resultImage} alt={item.name} className="flex-1 h-full object-contain" />
                            {item.cutImage && (
                                <img src={item.cutImage} alt="Cut pattern" className="w-1/3 h-full object-contain border-l border-zinc-100" />
                            )}
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button 
                                onClick={() => handleDelete(item.id)}
                                className="bg-white text-red-600 p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                                title="Delete"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                        <div className="p-2 text-xs text-[#5c5c5c] bg-[#fffbf0] border-t border-[#eaddcf] truncate flex justify-between font-serif">
                            <span>{new Date(item.timestamp).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}</span>
                            <span className="opacity-70">{item.foldMode}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Theme Settings Tab */}
            {activeTab === 'theme' && (
              <div className="max-w-md">
                <label className="flex items-center justify-between p-4 rounded-sm border border-[#eaddcf] cursor-pointer hover:bg-[#fffbf0] transition-colors bg-[#fdfbf7]">
                  <div className="space-y-1">
                    <div className="font-medium text-[#2C2C2C] font-serif">{t.dynamicTheme}</div>
                    <div className="text-sm text-[#5c5c5c]">{t.dynamicThemeDesc}</div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.dynamicTheme}
                        onChange={(e) => onUpdateSettings({ dynamicTheme: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-[#d4c4b0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C23531]"></div>
                  </div>
                </label>
              </div>
            )}


            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="max-w-md space-y-6 font-serif">
                <div className="p-6 bg-[#fdfbf7] rounded-sm border border-[#eaddcf] text-center">
                    <div className="w-16 h-16 bg-[#C23531] rounded-sm mx-auto flex items-center justify-center text-white mb-4 shadow-lg border-2 border-[#a02622]">
                        <SettingsIcon size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-[#2C2C2C] mb-1">{t.appTitle}</h3>
                    <p className="text-[#8c7b6c] text-sm">Version 1.2.0</p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-sm border border-[#eaddcf] bg-white">
                        <span className="text-[#8c7b6c]">{t.creator}</span>
                        <span className="font-medium text-[#2C2C2C]">yi</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-sm border border-[#eaddcf] bg-white">
                        <span className="text-[#8c7b6c]">{t.contact}</span>
                        <a href="mailto:cracks@yeah.net" className="font-medium text-[#C23531] hover:underline">cracks@yeah.net</a>
                    </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;