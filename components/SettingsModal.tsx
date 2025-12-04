
import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Settings as SettingsIcon, Palette, MessageSquare, Info, Trash2, Upload } from 'lucide-react';
import { AppSettings, GalleryItem } from '../types';
import { getGalleryItems, deleteGalleryItem } from '../utils/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

type Tab = 'gallery' | 'save' | 'theme' | 'feedback' | 'about';

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdateSettings 
}) => {
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
    if (confirm('Delete this saved work?')) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl h-[600px] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-zinc-50 border-r border-zinc-200 flex flex-col">
          <div className="p-6 border-b border-zinc-200">
            <h2 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
              <SettingsIcon className="text-red-600" />
              Settings
            </h2>
          </div>
          <nav className="flex-1 py-4">
            <TabButton id="gallery" icon={ImageIcon} label="My Saves" />
            <TabButton id="save" icon={SettingsIcon} label="Save Options" />
            <TabButton id="theme" icon={Palette} label="Appearance" />
            <TabButton id="feedback" icon={MessageSquare} label="Feedback" />
            <TabButton id="about" icon={Info} label="About Us" />
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between p-4 border-b border-zinc-100">
            <h3 className="text-lg font-bold text-zinc-800 capitalize">
                {activeTab === 'gallery' ? 'My Saved Works' : activeTab}
            </h3>
            <button 
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-white">
            
            {/* Gallery Tab */}
            {activeTab === 'gallery' && (
              <div className="space-y-6">
                {galleryItems.length === 0 ? (
                  <div className="text-center py-20 text-zinc-400">
                    <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No saved works yet. Create and download something!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {galleryItems.map(item => (
                      <div key={item.id} className="group relative bg-zinc-50 rounded-lg overflow-hidden border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="aspect-square p-2">
                            <img src={item.resultImage} alt={item.name} className="w-full h-full object-contain" />
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
                        <div className="p-2 text-xs text-zinc-500 bg-white border-t border-zinc-100 truncate">
                            {new Date(item.timestamp).toLocaleDateString()}
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
                    <div className="font-medium text-zinc-900">Save Cut Pattern</div>
                    <div className="text-sm text-zinc-500">Also save the small thumbnail (cut guide) when downloading</div>
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
                    <div className="font-medium text-zinc-900">Dynamic Icon Colors</div>
                    <div className="text-sm text-zinc-500">Change interface buttons to match your selected paper color</div>
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
                    <label className="block text-sm font-medium text-zinc-700">Your Suggestion</label>
                    <textarea 
                        required
                        className="w-full h-32 p-3 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                        placeholder="Tell us what you think..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                    ></textarea>
                </div>
                
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-700">Upload Screenshot (Optional)</label>
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
                                        <p className="text-sm text-zinc-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
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
                    {feedbackStatus === 'idle' && 'Submit Feedback'}
                    {feedbackStatus === 'sending' && 'Sending...'}
                    {feedbackStatus === 'sent' && 'Thank You!'}
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
                    <h3 className="text-xl font-bold text-zinc-900 mb-1">Digital Jianzhi</h3>
                    <p className="text-zinc-500 text-sm">Version 1.2.0</p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-white">
                        <span className="text-zinc-500">Creator</span>
                        <span className="font-medium text-zinc-900">cracks_yi</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-white">
                        <span className="text-zinc-500">Contact</span>
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
