
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Scissors, Settings, Languages, ArrowRight } from 'lucide-react';
import JianzhiCanvas, { JianzhiCanvasHandle } from './components/JianzhiCanvas';
import Controls from './components/Controls';
import FoldingControls from './components/FoldingControls';
import SettingsModal from './components/SettingsModal';
import FoldAnimator from './components/FoldAnimator';
import { PaperSimulation } from './utils/simulationUtils';
import { PresetSimulation } from './utils/presetSimulation';
import { DrawingTool, FoldDirection, FoldingMode, SimulationEngine, AppSettings, Language } from './types';
import { saveToGallery } from './utils/db';
import { TEXT } from './utils/i18n';

const App = () => {
  const [phase, setPhase] = useState<'folding' | 'cutting'>('folding');
  
  // Language State
  const [language, setLanguage] = useState<Language>('en');

  // Cutting Tools State
  const [tool, setTool] = useState<DrawingTool>('brush');
  const [brushSize, setBrushSize] = useState(15);
  
  // Live Preview State for Cutting Phase
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Folding State
  const [mode, setMode] = useState<FoldingMode>('custom');
  const [foldCount, setFoldCount] = useState(0); 
  const [foldSequence, setFoldSequence] = useState<string[]>([]); 
  const [selectedPreset, setSelectedPreset] = useState(5); 
  
  // Folding Animation State
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationData, setAnimationData] = useState<{
    image: string, 
    dir: FoldDirection,
    bounds: { minX: number, maxX: number, minY: number, maxY: number }
  } | null>(null);
  
  // Paper Appearance
  const [paperColor, setPaperColor] = useState('#DC2626');

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    saveCutPattern: true,
    dynamicTheme: false
  });

  const SIM_SIZE = 500;
  const simulationRef = useRef<SimulationEngine | null>(null);
  const foldCanvasRef = useRef<HTMLCanvasElement>(null);
  
  if (!simulationRef.current) {
      simulationRef.current = new PaperSimulation(SIM_SIZE);
  }

  const MAX_FOLDS = 5;
  const VISUAL_SIZE = 500; 
  
  const canvasRef = useRef<JianzhiCanvasHandle>(null);

  const t = TEXT[language];

  useEffect(() => {
    if (phase === 'folding' && foldCanvasRef.current && simulationRef.current && !isAnimating) {
        simulationRef.current.renderFoldedState(foldCanvasRef.current, paperColor);
    }
  }, [phase, paperColor, isAnimating]);

  const handleModeChange = (newMode: FoldingMode) => {
      setMode(newMode);
      if (newMode === 'custom') {
          simulationRef.current = new PaperSimulation(SIM_SIZE);
          setFoldCount(0);
          setFoldSequence([]);
      } else {
          simulationRef.current = new PresetSimulation(SIM_SIZE, selectedPreset);
      }
      
      if (foldCanvasRef.current && simulationRef.current) {
          const ctx = foldCanvasRef.current.getContext('2d');
          ctx?.clearRect(0, 0, VISUAL_SIZE, VISUAL_SIZE);
          simulationRef.current.renderFoldedState(foldCanvasRef.current, paperColor);
      }
  };

  const handlePresetSelect = (preset: number) => {
      setSelectedPreset(preset);
      if (mode === 'preset') {
          simulationRef.current = new PresetSimulation(SIM_SIZE, preset);
          if (foldCanvasRef.current && simulationRef.current) {
              simulationRef.current.renderFoldedState(foldCanvasRef.current, paperColor);
          }
      }
  };

  const canFold = (dir: FoldDirection): boolean => {
    if (mode === 'preset') return false;
    if (foldCount >= MAX_FOLDS) return false;
    if (isAnimating) return false;
    return simulationRef.current ? simulationRef.current.canFold(dir) : false;
  };

  // Internal helper to apply fold logic after animation
  const executeFold = useCallback((dir: FoldDirection) => {
    if (simulationRef.current?.fold(dir)) {
        setFoldCount(prev => prev + 1);
        setFoldSequence(prev => [...prev, dir]);
    }
    // Render is handled by useEffect when isAnimating becomes false
  }, []);

  const handleFold = (dir: FoldDirection) => {
    if (mode === 'preset' || !simulationRef.current || isAnimating) return;
    
    // Capture current state for animation
    if (foldCanvasRef.current) {
        const image = foldCanvasRef.current.toDataURL();
        
        // Get current bounds from simulation (if available and is PaperSimulation)
        let bounds = { minX: 0, maxX: SIM_SIZE, minY: 0, maxY: SIM_SIZE };
        if (simulationRef.current instanceof PaperSimulation) {
            bounds = {
                minX: simulationRef.current.minX,
                maxX: simulationRef.current.maxX,
                minY: simulationRef.current.minY,
                maxY: simulationRef.current.maxY
            };
        }

        setAnimationData({ image, dir, bounds });
        setIsAnimating(true);
    } else {
        // Fallback if ref is missing
        executeFold(dir);
    }
  };

  const handleAnimationComplete = () => {
      if (animationData) {
          executeFold(animationData.dir);
      }
      setAnimationData(null);
      setIsAnimating(false);
  };

  const handleResetFolds = () => {
    if (mode === 'custom') {
        simulationRef.current = new PaperSimulation(SIM_SIZE);
        setFoldCount(0);
        setFoldSequence([]);
    } else {
        simulationRef.current = new PresetSimulation(SIM_SIZE, selectedPreset);
    }
    
    setPreviewImage(null);
    setPhase('folding');
    setIsAnimating(false);
    setAnimationData(null);
    
    if (foldCanvasRef.current && simulationRef.current) {
        const ctx = foldCanvasRef.current.getContext('2d');
        ctx?.clearRect(0,0,VISUAL_SIZE, VISUAL_SIZE);
        setTimeout(() => simulationRef.current?.renderFoldedState(foldCanvasRef.current!, paperColor), 10);
    }
  };

  const handleFinishFolding = () => {
    setPhase('cutting');
    // Trigger initial preview generation
    setTimeout(updatePreview, 50);
  };

  const updatePreview = () => {
    const cutCanvas = canvasRef.current?.getCanvas();
    if (cutCanvas && simulationRef.current) {
        const texture = simulationRef.current.applyCutAndUnfold(cutCanvas, paperColor);
        setPreviewImage(texture);
    }
  };

  const handleDownload = async () => {
      const cutCanvas = canvasRef.current?.getCanvas();
      if (!cutCanvas || !simulationRef.current) return;

      // Generate Final High Res Result
      const finalResultImage = simulationRef.current.applyCutAndUnfold(cutCanvas, paperColor);
      const cutDataUrl = cutCanvas.toDataURL();

      const timestampStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const timestamp = Date.now();
      let nameInfo = '';
      if (mode === 'preset') {
          nameInfo = `${selectedPreset}-fold`;
      } else {
          nameInfo = foldSequence.length > 0 ? `custom-${foldSequence.join('-')}` : 'custom-blank';
      }
      
      // 1. Download Result Image
      const link = document.createElement('a');
      link.download = `jianzhi-result-${nameInfo}-${timestampStr}.png`;
      link.href = finalResultImage;
      link.click();

      // 2. Download Cut Pattern (if enabled)
      if (appSettings.saveCutPattern) {
          setTimeout(() => {
              const link2 = document.createElement('a');
              link2.download = `jianzhi-pattern-${nameInfo}-${timestampStr}.png`;
              link2.href = cutDataUrl;
              link2.click();
          }, 200);
      }

      // 3. Save to In-App Gallery
      await saveToGallery({
          id: timestamp.toString(),
          timestamp,
          resultImage: finalResultImage,
          cutImage: cutDataUrl,
          name: nameInfo,
          foldMode: mode === 'preset' ? `${selectedPreset}-Fold` : 'Custom Fold'
      });
  };

  const initCutCanvas = useCallback((ctx: CanvasRenderingContext2D) => {
      if (simulationRef.current) {
          simulationRef.current.renderActiveCutState(ctx, paperColor);
          // Trigger preview update on init
          setTimeout(updatePreview, 10);
      }
  }, [paperColor]); 

  const StepIndicator = ({ step, label, isActive }: { step: string, label: string, isActive: boolean }) => {
      const activeColorStyle = (isActive && appSettings.dynamicTheme) ? { color: paperColor } : {};
      const barStyle = (isActive && appSettings.dynamicTheme) ? { backgroundColor: paperColor } : {};

      return (
        <div 
          className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'opacity-100 text-red-600' : 'text-zinc-300 opacity-60'}`}
          style={isActive ? activeColorStyle : {}}
        >
          <div 
            className={`w-8 h-1.5 rounded-full ${isActive ? 'bg-red-600' : 'bg-zinc-200'}`}
            style={isActive ? barStyle : {}}
          ></div>
          <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </div>
      );
  };

  const dynamicThemeColor = appSettings.dynamicTheme ? paperColor : undefined;

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen bg-grid-pattern text-zinc-800 pb-20">
      <header className="bg-white border-b border-zinc-200 pt-4 pb-2 px-6 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
            {/* Left Spacer for centering */}
            <div className="w-20"></div>

            {/* Center Content */}
            <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3">
                    <div 
                        className={`w-10 h-10 ${!dynamicThemeColor && 'bg-red-600'} rounded-lg flex items-center justify-center text-white shadow-sm overflow-hidden`}
                        style={dynamicThemeColor ? { backgroundColor: dynamicThemeColor } : {}}
                    >
                        <Scissors size={18} strokeWidth={2.5} style={{ transform: 'rotate(-45deg)' }} />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                        {t.appTitle}
                    </h1>
                </div>
                
                <div className="flex gap-8">
                    <StepIndicator step="folding" label={t.step_fold} isActive={phase === 'folding'} />
                    <StepIndicator step="cutting" label={t.step_cut} isActive={phase === 'cutting'} />
                </div>
            </div>

            {/* Right Buttons */}
            <div className="w-20 flex justify-end gap-2">
                <button 
                    onClick={toggleLanguage}
                    className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
                    title={language === 'en' ? "Switch to Chinese" : "Switch to English"}
                >
                    <Languages size={24} />
                </button>
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
                    title={t.settingsTitle}
                >
                    <Settings size={24} />
                </button>
            </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto mt-8 px-4 flex flex-col items-center gap-8">
        
        {/* WORKSPACE */}
        <div className={`relative w-full transition-all duration-500 ${phase === 'cutting' ? 'max-w-5xl' : 'max-w-[600px]'}`}>
           
           {/* FOLDING VISUALIZER (PHASE 1) */}
           {phase === 'folding' && (
               <div className="relative w-full h-[600px] bg-white/50 rounded-xl border-2 border-dashed border-zinc-200 overflow-hidden flex items-center justify-center animate-in fade-in duration-500">
                   <div 
                      className="relative bg-white shadow-inner border border-zinc-100"
                      style={{ width: VISUAL_SIZE, height: VISUAL_SIZE }}
                   >
                       <div className="absolute inset-0 border border-zinc-100 bg-zinc-50 opacity-50"></div>
                       <canvas 
                            ref={foldCanvasRef}
                            width={VISUAL_SIZE}
                            height={VISUAL_SIZE}
                            className="absolute inset-0 w-full h-full"
                       />
                       
                       {/* 3D Animation Overlay with Faster Duration (300ms) */}
                       {isAnimating && animationData && (
                         <FoldAnimator 
                            image={animationData.image}
                            direction={animationData.dir}
                            onComplete={handleAnimationComplete}
                            bounds={animationData.bounds}
                            duration={300} 
                         />
                       )}
                   </div>
               </div>
           )}

           {/* CUTTING PHASE (PHASE 2) - SPLIT VIEW */}
           {phase === 'cutting' && (
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 animate-in slide-in-from-bottom-8 duration-500">
                    
                    {/* Left: Interactive Canvas */}
                    <div className="relative flex flex-col items-center gap-2">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t.step_cut}</span>
                        <div className="bg-white p-2 rounded-xl shadow-lg border border-zinc-100">
                             <JianzhiCanvas
                                ref={canvasRef}
                                width={SIM_SIZE}
                                height={SIM_SIZE}
                                tool={tool}
                                brushSize={brushSize}
                                onInit={initCutCanvas}
                                onInteractEnd={updatePreview} 
                            />
                        </div>
                    </div>

                    {/* Arrow Indicator */}
                    <div className="text-zinc-300 hidden md:block">
                        <ArrowRight size={32} />
                    </div>

                    {/* Right: Real-time Preview */}
                    <div className="relative flex flex-col items-center gap-2">
                         {/* We can use the text "SHOW" or "PREVIEW" here, user removed SHOW step but this is the show area */}
                         <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Preview</span>
                         <div className="bg-white p-2 rounded-xl shadow-lg border border-zinc-100 w-[500px] h-[500px] flex items-center justify-center overflow-hidden bg-zinc-50/50">
                            {previewImage ? (
                                <img 
                                    src={previewImage} 
                                    alt="Preview" 
                                    className="max-w-full max-h-full object-contain drop-shadow-md" 
                                />
                            ) : (
                                <div className="text-zinc-300 flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
                                        <Settings size={20} className="animate-spin-slow" />
                                    </div>
                                    <span className="text-sm">Generating Preview...</span>
                                </div>
                            )}
                         </div>
                    </div>
                </div>
           )}

        </div>

        {/* CONTROLS AREA */}
        <div className="w-full z-20 pb-10">
            {phase === 'folding' ? (
                <FoldingControls 
                    mode={mode}
                    onModeChange={handleModeChange}
                    onFold={handleFold}
                    canFold={canFold}
                    onPresetSelect={handlePresetSelect}
                    selectedPreset={selectedPreset}
                    onFinish={handleFinishFolding}
                    onReset={handleResetFolds}
                    foldCount={foldCount}
                    maxFolds={MAX_FOLDS}
                    paperColor={paperColor}
                    onColorChange={setPaperColor}
                    themeColor={dynamicThemeColor}
                    language={language}
                />
            ) : (
                <Controls 
                    tool={tool}
                    onToolChange={setTool}
                    brushSize={brushSize}
                    onBrushSizeChange={setBrushSize}
                    onUndo={() => { canvasRef.current?.undo(); updatePreview(); }}
                    onRedo={() => { canvasRef.current?.redo(); updatePreview(); }}
                    onClear={handleResetFolds}
                    onDownload={handleDownload}
                    themeColor={dynamicThemeColor}
                    language={language}
                />
            )}
        </div>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={appSettings}
        onUpdateSettings={(newSettings) => setAppSettings(prev => ({ ...prev, ...newSettings }))}
        language={language}
      />
    </div>
  );
};

export default App;
