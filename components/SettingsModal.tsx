
import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Settings as SettingsIcon, Palette, MessageSquare, Info, Trash2, Upload, BookOpen, Scissors, Layers, Snowflake, Brush, Square, Download, Eye } from 'lucide-react';
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

type Tab = 'tutorial' | 'gallery' | 'save' | 'theme' | 'feedback' | 'about';

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdateSettings,
  language
}) => {
  const t = TEXT[language];
  const [activeTab, setActiveTab] = useState<Tab>('tutorial');
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
    // Simulate API call
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
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        activeTab === id 
        ? 'bg-red-50 text-red-600 font-medium border-r-2 border-red-600' 
        : 'text-zinc-600 hover:bg-zinc-50'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  const getTabTitle = (tab: Tab) => {
      switch(tab) {
          case 'tutorial': return t.tab_tutorial;
          case 'gallery': return t.mySavedWorks;
          case 'save': return t.tab_save;
          case 'theme': return t.tab_theme;
          case 'feedback': return t.tab_feedback;
          case 'about': return t.tab_about;
          default: return tab;
      }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl h-[600px] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-zinc-50 border-r border-zinc-200 flex flex-col">
          <div className="p-6 border-b border-zinc-200">
            <h2 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
              <SettingsIcon className="text-red-600" />
              {t.settingsTitle}
            </h2>
          </div>
          <nav className="flex-1 py-4">
            <TabButton id="tutorial" icon={BookOpen} label={t.tab_tutorial} />
            <TabButton id="gallery" icon={ImageIcon} label={t.tab_gallery} />
            <TabButton id="save" icon={SettingsIcon} label={t.tab_save} />
            <TabButton id="theme" icon={Palette} label={t.tab_theme} />
            <TabButton id="feedback" icon={MessageSquare} label={t.tab_feedback} />
            <TabButton id="about" icon={Info} label={t.tab_about} />
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between p-4 border-b border-zinc-100">
            <h3 className="text-lg font-bold text-zinc-800 capitalize">
                {getTabTitle(activeTab)}
            </h3>
            <button 
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-white">
            
            {/* Tutorial Tab */}
            {activeTab === 'tutorial' && (
              <div className="space-y-6 max-w-2xl mx-auto">
                
                {/* Step 1: Fold */}
                <div className="bg-zinc-50 rounded-xl border border-zinc-100 overflow-hidden">
                  <div className="bg-zinc-100 p-6 flex justify-center items-center gap-8 text-zinc-400">
                      <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center text-red-600">
                              <Layers size={24} />
                          </div>
                          <span className="text-xs font-bold">{t.freeFold}</span>
                      </div>
                      <div className="h-px w-8 bg-zinc-300"></div>
                      <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center text-red-600">
                              <Snowflake size={24} />
                          </div>
                          <span className="text-xs font-bold">{t.presetPatterns}</span>
                      </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-zinc-900 mb-1">{t.t_step1_title}</h4>
                    <p className="text-sm text-zinc-500 leading-relaxed">{t.t_step1_desc}</p>
                  </div>
                </div>

                {/* Step 2: Cut */}
                <div className="bg-zinc-50 rounded-xl border border-zinc-100 overflow-hidden">
                   <div className="bg-zinc-100 p-6 flex justify-center items-center gap-4">
                      <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg z-10">
                          <Scissors size={18} className="-rotate-45" />
                      </div>
                      <div className="flex gap-2">
                          <div className="w-8 h-8 bg-white rounded border border-zinc-200 flex items-center justify-center text-zinc-400"><Brush size={16} /></div>
                          <div className="w-8 h-8 bg-white rounded border border-zinc-200 flex items-center justify-center text-zinc-400"><Square size={16} /></div>
                      </div>
                   </div>
                   <div className="p-4">
                      <h4 className="font-bold text-zinc-900 mb-1">{t.t_step2_title}</h4>
                      <p className="text-sm text-zinc-500 leading-relaxed">{t.t_step2_desc}</p>
                   </div>
                </div>

                {/* Step 3: Show */}
                <div className="bg-zinc-50 rounded-xl border border-zinc-100 overflow-hidden">
                   <div className="bg-zinc-100 p-6 flex justify-center items-center gap-8">
                       <div className="relative group cursor-default">
                           <div className="w-20 h-20 bg-white shadow-md rounded-lg flex items-center justify-center">
                               <span className="text-red-500/20 text-4xl font-serif">✿</span>
                           </div>
                           <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg">
                               <Download size={18} />
                           </div>
                       </div>
                   </div>
                   <div className="p-4">
                      <h4 className="font-bold text-zinc-900 mb-1">{t.t_step3_title}</h4>
                      <p className="text-sm text-zinc-500 leading-relaxed">{t.t_step3_desc}</p>
                   </div>
                </div>

              </div>
            )}

            {/* Gallery Tab */}
            {activeTab === 'gallery' && (
              <div className="space-y-6">
                {galleryItems.length === 0 ? (
                  <div className="text-center py-20 text-zinc-400">
                    <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
                    <p>{t.noSaves}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {galleryItems.map(item => (
                      <div key={item.id} className="group relative bg-zinc-50 rounded-lg overflow-hidden border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="aspect-square p-2 flex gap-1">
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
                        <div className="p-2 text-xs text-zinc-500 bg-white border-t border-zinc-100 truncate flex justify-between">
                            <span>{new Date(item.timestamp).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}</span>
                            <span className="opacity-70">{item.foldMode}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Save Settings Tab */}
            {activeTab === 'save' && (
              <div className="max-w-md">
                <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 cursor-pointer hover:bg-zinc-50 transition-colors">
                  <div className="space-y-1">
                    <div className="font-medium text-zinc-900">{t.saveCutPattern}</div>
                    <div className="text-sm text-zinc-500">{t.saveCutPatternDesc}</div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.saveCutPattern}
                        onChange={(e) => onUpdateSettings({ saveCutPattern: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </div>
                </label>
              </div>
            )}

            {/* Theme Settings Tab */}
            {activeTab === 'theme' && (
              <div className="max-w-md">
                <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 cursor-pointer hover:bg-zinc-50 transition-colors">
                  <div className="space-y-1">
                    <div className="font-medium text-zinc-900">{t.dynamicTheme}</div>
                    <div className="text-sm text-zinc-500">{t.dynamicThemeDesc}</div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.dynamicTheme}
                        onChange={(e) => onUpdateSettings({ dynamicTheme: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </div>
                </label>
              </div>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
              <form onSubmit={handleFeedbackSubmit} className="max-w-md space-y-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-700">{t.yourSuggestion}</label>
                    <textarea 
                        required
                        className="w-full h-32 p-3 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                        placeholder={t.placeholderFeedback}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                    ></textarea>
                </div>
                
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-700">{t.uploadScreenshot}</label>
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-300 border-dashed rounded-lg cursor-pointer bg-zinc-50 hover:bg-zinc-100 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {feedbackImage ? (
                                    <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                                        <ImageIcon size={20} />
                                        {feedbackImage.name}
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 mb-3 text-zinc-400" />
                                        <p className="text-sm text-zinc-500"><span className="font-semibold">{t.clickToUpload}</span> {t.dragDrop}</p>
                                    </>
                                )}
                            </div>
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => setFeedbackImage(e.target.files?.[0] || null)}
                            />
                        </label>
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={feedbackStatus !== 'idle'}
                    className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
                        feedbackStatus === 'sent' 
                        ? 'bg-green-600' 
                        : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200'
                    }`}
                >
                    {feedbackStatus === 'idle' && t.submitFeedback}
                    {feedbackStatus === 'sending' && t.sending}
                    {feedbackStatus === 'sent' && t.thankYou}
                </button>
              </form>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="max-w-md space-y-6">
                <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 text-center">
                    <div className="w-16 h-16 bg-red-600 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg shadow-red-200">
                        <SettingsIcon size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-1">{t.appTitle}</h3>
                    <p className="text-zinc-500 text-sm">Version 1.2.0</p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-white">
                        <span className="text-zinc-500">{t.creator}</span>
                        <span className="font-medium text-zinc-900">cracks_yi</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-white">
                        <span className="text-zinc-500">{t.contact}</span>
                        <a href="mailto:cracks@yeah.net" className="font-medium text-red-600 hover:underline">cracks@yeah.net</a>
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
