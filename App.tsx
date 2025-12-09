
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Scissors, Settings, Languages, Download, ArrowRight, AlertTriangle, SlidersHorizontal, X, RotateCcw, Undo2, Redo2 } from 'lucide-react';
import JianzhiCanvas, { JianzhiCanvasHandle } from './components/JianzhiCanvas';
import FoldingControls from './components/FoldingControls';
import SettingsModal from './components/SettingsModal';
import { PaperSimulation } from './utils/simulationUtils';
import { PresetSimulation } from './utils/presetSimulation';
import { FoldDirection, FoldingMode, SimulationEngine, AppSettings, Language } from './types';
import { saveToGallery } from './utils/db';
import { TEXT } from './utils/i18n';
import { SIM_SIZE, DISPLAY_MARGIN, DEFAULT_BRUSH_SIZE, DEFAULT_PAPER_COLOR } from './utils/constants';

// Hook for responsive display size
const useDisplaySize = (baseSize: number, margin: number = DISPLAY_MARGIN) => {
    const [displaySize, setDisplaySize] = useState(baseSize);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            // Ensure it fits within width minus margin, but max out at baseSize
            // For mobile, we might want to be more aggressive with shrinking
            const availableWidth = Math.min(width - margin, baseSize);
            setDisplaySize(Math.floor(availableWidth));
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check

        return () => window.removeEventListener('resize', handleResize);
    }, [baseSize, margin]);

    return displaySize;
};

const App = () => {
  // Language State (Default: zh)
  const [language, setLanguage] = useState<Language>('zh');
  
  // Folding State - Default to 'preset'
  const [mode, setMode] = useState<FoldingMode>('preset');
  const [foldCount, setFoldCount] = useState(0); 
  const [foldSequence, setFoldSequence] = useState<string[]>([]); 
  const [selectedPreset, setSelectedPreset] = useState(5); 
  
  // Paper Appearance
  const [paperColor, setPaperColor] = useState(DEFAULT_PAPER_COLOR); 

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    dynamicTheme: false,
    disableResetWarning: false
  });

  // UI State
  const [showCuttingSettings, setShowCuttingSettings] = useState(false);

  // Reset Warning State
  const [pendingResetAction, setPendingResetAction] = useState<(() => void) | null>(null);

  const displaySize = useDisplaySize(SIM_SIZE);

  const simulationRef = useRef<SimulationEngine | null>(null);
  const canvasRef = useRef<JianzhiCanvasHandle>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Initialize simulation engine only once or when needed
  if (!simulationRef.current) {
      simulationRef.current = new PresetSimulation(SIM_SIZE, selectedPreset);
  }

  const MAX_FOLDS = 5;
  const t = TEXT[language];

  // --- Core Logic ---

  // Re-initializes the drawing canvas (clears cuts, draws paper shape)
  // This is passed to the JianzhiCanvas component's onInit prop
  const initCutCanvas = useCallback((ctx: CanvasRenderingContext2D) => {
      if (simulationRef.current) {
          simulationRef.current.renderActiveCutState(ctx, paperColor);
          // Small delay to allow canvas paint before preview generation
          setTimeout(updatePreview, 10);
      }
  }, [paperColor]); 

  // Wrapper to handle reset warning
  const requestReset = (action: () => void) => {
    if (appSettings.disableResetWarning) {
        action();
    } else {
        setPendingResetAction(() => action);
    }
  };

  const confirmReset = (dontShowAgain: boolean) => {
      if (dontShowAgain) {
          setAppSettings(prev => ({ ...prev, disableResetWarning: true }));
      }
      if (pendingResetAction) {
          pendingResetAction();
      }
      setPendingResetAction(null);
  };

  const cancelReset = () => {
      setPendingResetAction(null);
  };

  // Triggered when the user changes Folding Mode (Preset <-> Free)
  const handleModeChange = (newMode: FoldingMode) => {
      if (newMode === mode) return;
      
      requestReset(() => {
        setMode(newMode);
        if (newMode === 'custom') {
            simulationRef.current = new PaperSimulation(SIM_SIZE);
            setFoldCount(0);
            setFoldSequence([]);
        } else {
            simulationRef.current = new PresetSimulation(SIM_SIZE, selectedPreset);
        }
        // Reset the canvas AND wipe undo history because the fold basis has changed
        canvasRef.current?.hardReset();
      });
  };

  // Triggered when user selects a different Preset number
  const handlePresetSelect = (preset: number) => {
      if (selectedPreset === preset && mode === 'preset') return;

      requestReset(() => {
        setSelectedPreset(preset);
        if (mode === 'preset') {
            simulationRef.current = new PresetSimulation(SIM_SIZE, preset);
            canvasRef.current?.hardReset();
        } else {
            // Switching from Custom to Preset implicitly
             setMode('preset');
             simulationRef.current = new PresetSimulation(SIM_SIZE, preset);
             canvasRef.current?.hardReset();
        }
      });
  };

  // Check if a specific fold is allowed in Free Fold mode
  const canFold = (dir: FoldDirection): boolean => {
    if (mode === 'preset') return false;
    if (foldCount >= MAX_FOLDS) return false;
    return simulationRef.current ? simulationRef.current.canFold(dir) : false;
  };

  // Execute a Free Fold action
  const handleFold = (dir: FoldDirection) => {
    if (mode === 'preset' || !simulationRef.current) return;
    
    // Attempt to fold logic
    if (simulationRef.current.fold(dir)) {
        setFoldCount(prev => prev + 1);
        setFoldSequence(prev => [...prev, dir]);
        // Reset canvas (keeping history wouldn't make sense as shape changed)
        canvasRef.current?.hardReset();
    }
  };

  // "Start Over" in CUT area: Reset cuts but keep current fold sequence/mode
  const handleResetCuts = () => {
     // No confirmation prompt for resetting cuts within the same mode
     canvasRef.current?.hardReset();
     updatePreview();
  };

  // "Reset Paper" in FOLD area: Reset everything to flat paper
  const handleResetFolds = () => {
    requestReset(() => {
        if (mode === 'custom') {
            simulationRef.current = new PaperSimulation(SIM_SIZE);
            setFoldCount(0);
            setFoldSequence([]);
        } else {
            simulationRef.current = new PresetSimulation(SIM_SIZE, selectedPreset);
        }
        canvasRef.current?.hardReset();
    });
  };

  // Generate the unfolded preview
  const updatePreview = () => {
    const cutCanvas = canvasRef.current?.getCanvas();
    const previewCanvas = previewCanvasRef.current;
    
    if (cutCanvas && previewCanvas && simulationRef.current) {
        // Direct canvas-to-canvas rendering for performance
        simulationRef.current.applyCutAndUnfold(cutCanvas, paperColor, previewCanvas);
    }
  };

  // --- Saving & Exporting ---

  const getNameInfo = () => {
      if (mode === 'preset') {
          return `${selectedPreset}-fold`;
      } else {
          return foldSequence.length > 0 ? `custom-${foldSequence.join('-')}` : 'custom-blank';
      }
  };

  const getTimestamp = () => {
      const d = new Date();
      return {
          str: d.toISOString().replace(/[:.]/g, '-').slice(0, 19),
          val: d.getTime()
      };
  };

  const handleSaveCut = () => {
      const cutCanvas = canvasRef.current?.getCanvas();
      if (!cutCanvas) return;

      const cutDataUrl = cutCanvas.toDataURL();
      const ts = getTimestamp().str;
      const name = getNameInfo();
      
      const link = document.createElement('a');
      link.download = `jianzhi-pattern-${name}-${ts}.png`;
      link.href = cutDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleSaveResult = async () => {
      if (!simulationRef.current || !previewCanvasRef.current) return;

      // Ensure preview is up to date
      updatePreview();
      
      const previewDataUrl = previewCanvasRef.current.toDataURL();
      const cutCanvas = canvasRef.current?.getCanvas();
      const cutImage = cutCanvas ? cutCanvas.toDataURL() : undefined;

      const ts = getTimestamp();
      const name = getNameInfo();
      
      const link = document.createElement('a');
      link.download = `jianzhi-result-${name}-${ts.str}.png`;
      link.href = previewDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      await saveToGallery({
          id: ts.val.toString(),
          timestamp: ts.val,
          resultImage: previewDataUrl,
          cutImage: cutImage,
          name: name,
          foldMode: mode === 'preset' ? `${selectedPreset}-Fold` : 'Custom Fold'
      });
  };

  const dynamicThemeColor = appSettings.dynamicTheme ? paperColor : undefined;

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  // Whenever paper color changes, we need to re-render the base paper
  useEffect(() => {
     canvasRef.current?.clear();
  }, [paperColor]);

  return (
    <div className="min-h-screen bg-pattern-lattice text-[#2C2C2C] pb-10 font-serif">
      {/* Header */}
      <header className="bg-[#fffbf0] border-b border-[#d4c4b0] pt-3 pb-3 px-6 sticky top-0 z-40 shadow-sm">
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-red-800/20 to-transparent"></div>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div 
                    className={`w-10 h-10 ${!dynamicThemeColor && 'bg-[#C23531]'} rounded-sm flex items-center justify-center text-white shadow-md overflow-hidden border-2 border-[#a02622]`}
                    style={dynamicThemeColor ? { backgroundColor: dynamicThemeColor } : {}}
                >
                    <Scissors size={20} strokeWidth={2} style={{ transform: 'rotate(-45deg)' }} />
                </div>
                <h1 className="text-xl md:text-2xl font-bold tracking-widest text-red-900 whitespace-nowrap" style={{ fontFamily: '"Noto Serif SC", serif' }}>
                    {t.appTitle}
                </h1>
            </div>

            <div className="flex gap-2">
                <button 
                    onClick={toggleLanguage}
                    className="p-2 text-[#8c7b6c] hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                    title="Change Language"
                >
                    <Languages size={22} />
                </button>
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 text-[#8c7b6c] hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                    title="Settings"
                >
                    <Settings size={22} />
                </button>
            </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto mt-6 px-2 md:px-4">
        {/* Main Layout: Cut Canvas (Center) + Preview (Right) */}
        <div className="flex flex-col xl:flex-row items-start justify-center gap-6">
            
            {/* COLUMN 1: Drawing Canvas + Overlay Controls */}
            <div className="flex flex-col gap-4 items-center w-full xl:w-auto">
                 <div className="flex items-center justify-between w-full max-w-[500px] px-2 border-b border-[#d4c4b0] pb-1">
                     <span className="text-sm font-bold text-[#8c7b6c] font-serif tracking-widest">{t.step_cut}</span>
                </div>
                
                <div className="relative inline-block p-4 bg-white border border-[#d4c4b0] shadow-md z-10 chinese-card">
                    {/* Settings Toggle Button */}
                    <button
                        onClick={() => setShowCuttingSettings(!showCuttingSettings)}
                        className="absolute top-2 left-2 z-30 p-1.5 bg-white/90 border border-[#d4c4b0] rounded-sm text-[#8c7b6c] hover:text-[#C23531] hover:border-[#C23531] shadow-sm transition-all"
                        title={t.cuttingSettings}
                    >
                        <SlidersHorizontal size={16} />
                    </button>

                    {/* History Actions (Top Right of Canvas) */}
                    <div className="absolute top-2 right-2 z-30 flex gap-1">
                        <button
                            onClick={() => { canvasRef.current?.undo(); updatePreview(); }}
                            className="p-1.5 bg-white/90 border border-[#d4c4b0] rounded-sm text-[#8c7b6c] hover:text-[#C23531] hover:border-[#C23531] shadow-sm transition-all"
                            title={t.undo}
                        >
                            <Undo2 size={16} />
                        </button>
                        <button
                            onClick={() => { canvasRef.current?.redo(); updatePreview(); }}
                            className="p-1.5 bg-white/90 border border-[#d4c4b0] rounded-sm text-[#8c7b6c] hover:text-[#C23531] hover:border-[#C23531] shadow-sm transition-all"
                            title={t.redo}
                        >
                            <Redo2 size={16} />
                        </button>
                        <button
                            onClick={handleResetCuts}
                            className="p-1.5 bg-white/90 border border-[#d4c4b0] rounded-sm text-[#8c7b6c] hover:text-[#C23531] hover:border-[#C23531] shadow-sm transition-all ml-1"
                            title={t.startOver}
                        >
                            <RotateCcw size={16} />
                        </button>
                    </div>

                    {/* Settings Overlay Panel - Small, Compact, Transparent */}
                    {showCuttingSettings && (
                        <div className="absolute top-10 left-2 w-48 z-20 bg-white/15 backdrop-blur-[1px] border border-white/30 shadow-lg p-2 rounded-sm overflow-y-auto max-h-[85%] animate-in fade-in duration-200">
                             <div className="flex justify-between items-center mb-2 pb-1 border-b border-white/20">
                                <h3 className="text-[10px] font-bold text-[#5c5c5c] uppercase tracking-wide">{t.cuttingSettings}</h3>
                                <button onClick={() => setShowCuttingSettings(false)} className="text-[#8c7b6c] hover:text-[#C23531]">
                                    <X size={14} />
                                </button>
                             </div>
                             
                             <div className="flex flex-col gap-2">
                                <FoldingControls 
                                    mode={mode}
                                    onModeChange={handleModeChange}
                                    onFold={handleFold}
                                    canFold={canFold}
                                    onPresetSelect={handlePresetSelect}
                                    selectedPreset={selectedPreset}
                                    onReset={handleResetFolds}
                                    foldCount={foldCount}
                                    maxFolds={MAX_FOLDS}
                                    paperColor={paperColor}
                                    onColorChange={setPaperColor}
                                    themeColor={dynamicThemeColor}
                                    language={language}
                                />
                             </div>
                        </div>
                    )}

                    <JianzhiCanvas
                        ref={canvasRef}
                        width={SIM_SIZE}
                        height={SIM_SIZE}
                        displaySize={displaySize}
                        tool={'brush'}
                        brushSize={DEFAULT_BRUSH_SIZE}
                        onInit={initCutCanvas}
                        onInteractEnd={updatePreview} 
                        onInteractStart={() => {}}
                    />
                </div>

                <div className="relative w-full max-w-[500px]">
                    <button 
                        onClick={handleSaveCut}
                        className={`w-full py-3 rounded-sm font-serif font-bold transition-all flex items-center justify-center gap-2 text-white shadow-md border border-[#a02622] btn-seal ${
                            dynamicThemeColor ? '' : 'bg-[#C23531] hover:bg-[#b91c1c]'
                        }`}
                        style={dynamicThemeColor ? { backgroundColor: dynamicThemeColor } : {}}
                    >
                        <Download size={18} />
                        {t.savePattern}
                    </button>
                 </div>
            </div>

            {/* Arrow Divider (Desktop only) */}
            <div className="text-[#d4c4b0] hidden xl:block self-start pt-48 opacity-50">
                <ArrowRight size={32} />
            </div>

            {/* COLUMN 2: Preview */}
            <div className="flex flex-col gap-4 items-center xl:sticky xl:top-24 w-full xl:w-auto">
                 <div className="flex items-center justify-between w-full max-w-[500px] px-2 border-b border-[#d4c4b0] pb-1">
                     <span className="text-sm font-bold text-[#8c7b6c] font-serif tracking-widest">{t.step_show}</span>
                 </div>
                 
                 <div className="relative p-4 bg-white border border-[#d4c4b0] shadow-md flex items-center justify-center overflow-hidden chinese-card inline-block">
                    <div 
                        style={{ width: displaySize, height: displaySize }}
                        className="relative flex items-center justify-center bg-[#f9f7f2]"
                    >
                        <div className="absolute inset-0 bg-[#f9f7f2] opacity-50 pointer-events-none"></div>
                        <canvas 
                            ref={previewCanvasRef}
                            width={SIM_SIZE}
                            height={SIM_SIZE}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            className="z-10 relative drop-shadow-md"
                        />
                    </div>
                 </div>

                 <div className="relative w-full max-w-[500px]">
                    <button 
                        onClick={handleSaveResult}
                        className={`w-full py-3 rounded-sm font-serif font-bold transition-all flex items-center justify-center gap-2 text-white shadow-lg border-2 border-[#a02622] btn-seal ${
                            dynamicThemeColor ? '' : 'bg-[#C23531] hover:bg-[#b91c1c]'
                        }`}
                        style={dynamicThemeColor ? { backgroundColor: dynamicThemeColor } : {}}
                    >
                        <Download size={24} />
                        {t.saveResult}
                    </button>
                 </div>
            </div>

        </div>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={appSettings}
        onUpdateSettings={(newSettings) => setAppSettings(prev => ({ ...prev, ...newSettings }))}
        language={language}
      />

      {/* Reset Warning Modal */}
      {pendingResetAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2C2C]/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-sm border border-[#d4c4b0] shadow-2xl max-w-sm w-full p-6 relative chinese-card">
                  <div className="flex items-center gap-3 mb-4 text-[#C23531]">
                      <AlertTriangle size={24} />
                      <h3 className="text-lg font-bold font-serif">{t.resetWarningTitle}</h3>
                  </div>
                  <p className="text-[#5c5c5c] mb-6 font-serif leading-relaxed">
                      {t.resetWarningDesc}
                  </p>
                  
                  <label className="flex items-center gap-2 mb-6 cursor-pointer group">
                      <input 
                          type="checkbox" 
                          id="dontShowAgain"
                          className="w-4 h-4 rounded-sm border-gray-300 text-[#C23531] focus:ring-[#C23531]"
                      />
                      <span className="text-sm text-[#8c7b6c] group-hover:text-[#5c5c5c] transition-colors font-serif select-none">
                          {t.dontShowAgain}
                      </span>
                  </label>

                  <div className="flex gap-3">
                      <button
                          onClick={cancelReset}
                          className="flex-1 py-2 rounded-sm border border-[#d4c4b0] text-[#5c5c5c] hover:bg-[#fffbf0] transition-colors font-serif"
                      >
                          {t.cancel}
                      </button>
                      <button
                          onClick={() => {
                              const checkbox = document.getElementById('dontShowAgain') as HTMLInputElement;
                              confirmReset(checkbox?.checked || false);
                          }}
                          className="flex-1 py-2 rounded-sm bg-[#C23531] text-white hover:bg-[#b91c1c] shadow-md transition-all font-serif font-bold"
                      >
                          {t.confirm}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
