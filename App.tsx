
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Scissors, Settings, Languages, ArrowRight, Hand, Eye, Download, Brush } from 'lucide-react';
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
  
  // Language State (Default: zh)
  const [language, setLanguage] = useState<Language>('zh');

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
    dynamicTheme: false
  });

  // Interactive Guide State Sequence
  // FOLD: fold_up -> fold_right -> fold_br -> fold_finish
  // CUT: cut_tool -> cut_canvas -> cut_thickness -> cut_shapes -> cut_preview -> cut_save -> cut_reset
  const [activeGuideStep, setActiveGuideStep] = useState<string | null>(null);
  
  // Track completion to ensure we don't show it every time
  const guideHistory = useRef({ 
      foldStarted: false,
      cutStarted: false
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

  // Logic to trigger guides
  useEffect(() => {
      // Trigger Fold Guide Sequence
      if (phase === 'folding' && mode === 'custom' && !guideHistory.current.foldStarted) {
          const timer = setTimeout(() => {
              setActiveGuideStep('fold_up');
              guideHistory.current.foldStarted = true;
          }, 500);
          return () => clearTimeout(timer);
      }
      
      // Trigger Cut Guide Sequence
      if (phase === 'cutting' && !guideHistory.current.cutStarted) {
          const timer = setTimeout(() => {
              setActiveGuideStep('cut_tool');
              guideHistory.current.cutStarted = true;
          }, 500);
          return () => clearTimeout(timer);
      }
  }, [phase, mode]);

  // General dismiss
  const dismissGuide = (stepToDismiss: string) => {
      if (activeGuideStep === stepToDismiss) {
          setActiveGuideStep(null);
      }
  };

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
          // If switching back to custom and haven't finished guide, maybe restart? 
          // For now, let's reset if it was interrupted
          if (!guideHistory.current.foldStarted) {
             setTimeout(() => setActiveGuideStep('fold_up'), 500);
             guideHistory.current.foldStarted = true;
          }
      } else {
          simulationRef.current = new PresetSimulation(SIM_SIZE, selectedPreset);
          setActiveGuideStep(null); // No guide for preset
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

  const executeFold = useCallback((dir: FoldDirection) => {
    if (simulationRef.current?.fold(dir)) {
        setFoldCount(prev => prev + 1);
        setFoldSequence(prev => [...prev, dir]);
    }
  }, []);

  const handleFold = (dir: FoldDirection) => {
    // Advance Guide Sequence
    if (activeGuideStep === 'fold_up' && dir === 'UP') {
        setActiveGuideStep('fold_right');
    } else if (activeGuideStep === 'fold_right' && dir === 'RIGHT') {
        setActiveGuideStep('fold_br');
    } else if (activeGuideStep === 'fold_br' && dir === 'BR') {
        setActiveGuideStep('fold_finish');
    } else {
        // If user deviates, we might want to dismiss or adapt. 
        // For strict tutorial, let's just dismiss if they do something else.
        if (activeGuideStep) setActiveGuideStep(null);
    }

    if (mode === 'preset' || !simulationRef.current || isAnimating) return;
    
    if (foldCanvasRef.current) {
        const image = foldCanvasRef.current.toDataURL();
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
    setActiveGuideStep(null);
    
    if (foldCanvasRef.current && simulationRef.current) {
        const ctx = foldCanvasRef.current.getContext('2d');
        ctx?.clearRect(0,0,VISUAL_SIZE, VISUAL_SIZE);
        setTimeout(() => simulationRef.current?.renderFoldedState(foldCanvasRef.current!, paperColor), 10);
    }
  };

  const handleFinishFolding = () => {
    if (activeGuideStep === 'fold_finish') {
        setActiveGuideStep(null); // Will trigger cut sequence on phase change
    } else {
        setActiveGuideStep(null);
    }
    
    setPhase('cutting');
    setTimeout(updatePreview, 50);
  };

  const updatePreview = () => {
    const cutCanvas = canvasRef.current?.getCanvas();
    if (cutCanvas && simulationRef.current) {
        const texture = simulationRef.current.applyCutAndUnfold(cutCanvas, paperColor);
        setPreviewImage(texture);
        
        // Advance Cut Guide from Canvas -> Thickness -> Shapes -> Preview
        if (activeGuideStep === 'cut_canvas') {
            setActiveGuideStep('cut_thickness');
        }
    }
  };

  const handleNextGuide = () => {
      if (activeGuideStep === 'cut_thickness') {
          setActiveGuideStep('cut_shapes');
      } else if (activeGuideStep === 'cut_shapes') {
          setActiveGuideStep('cut_preview');
      } else if (activeGuideStep === 'cut_reset') {
          setActiveGuideStep(null); // Finish
      }
  };

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
      if (activeGuideStep === 'cut_save') {
          setActiveGuideStep('cut_reset');
      } else {
          setActiveGuideStep(null);
      }

      if (!simulationRef.current || !previewImage) return;

      // Ensure high res result
      const cutCanvas = canvasRef.current?.getCanvas();
      let finalResultImage = previewImage;
      const cutImage = cutCanvas ? cutCanvas.toDataURL() : undefined;

      if (cutCanvas) {
          finalResultImage = simulationRef.current.applyCutAndUnfold(cutCanvas, paperColor);
      }
      
      const ts = getTimestamp();
      const name = getNameInfo();
      
      const link = document.createElement('a');
      link.download = `jianzhi-result-${name}-${ts.str}.png`;
      link.href = finalResultImage;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Always save to gallery including cut pattern if available
      await saveToGallery({
          id: ts.val.toString(),
          timestamp: ts.val,
          resultImage: finalResultImage,
          cutImage: cutImage,
          name: name,
          foldMode: mode === 'preset' ? `${selectedPreset}-Fold` : 'Custom Fold'
      });
  };

  const initCutCanvas = useCallback((ctx: CanvasRenderingContext2D) => {
      if (simulationRef.current) {
          simulationRef.current.renderActiveCutState(ctx, paperColor);
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

  // Guide Components
  const GuideOverlay = ({ 
      text, 
      subtext, 
      icon: Icon, 
      onClick, 
      passThrough = false,
      placement = 'center',
      targetPos
  }: { 
      text: string, 
      subtext: string, 
      icon: any, 
      onClick?: () => void,
      passThrough?: boolean,
      placement?: 'center' | 'top' | 'bottom',
      targetPos?: { x: number, y: number }
  }) => {
      let alignClass = 'items-center justify-center';
      if (placement === 'top') alignClass = 'items-start justify-center pt-12';
      if (placement === 'bottom') alignClass = 'items-end justify-center pb-12';

      const isTargeted = !!targetPos;

      return (
        <div 
            className={`absolute inset-0 z-50 ${isTargeted ? '' : 'flex ' + alignClass} ${passThrough ? 'pointer-events-none' : 'cursor-pointer'}`}
            onClick={passThrough ? undefined : onClick}
        >
            <div 
                className={isTargeted ? "absolute flex flex-col items-center justify-center" : "relative flex flex-col items-center justify-center"}
                style={isTargeted ? { left: targetPos!.x, top: targetPos!.y, transform: 'translate(-50%, -50%)' } : {}}
            >
                {/* Pulse Ring */}
                {isTargeted ? (
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-4 border-red-400 rounded-full animate-pulse opacity-40 pointer-events-none"></div>
                ) : (
                     <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
                         <div className="w-full h-full border-4 border-red-400 rounded-xl animate-pulse opacity-20"></div>
                     </div>
                )}
            
                {/* Tooltip */}
                <div className={`bg-red-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 animate-in fade-in zoom-in-90 duration-300 pointer-events-auto relative z-10 ${passThrough ? 'pointer-events-none opacity-90' : ''}`}>
                    <Icon size={20} className="animate-bounce" />
                    <div className="flex flex-col whitespace-nowrap">
                        <span className="font-bold text-sm">{text}</span>
                        <span className="text-[10px] opacity-90">{subtext}</span>
                    </div>
                </div>
            </div>
        </div>
      );
  };

  const isSaveGuide = activeGuideStep === 'cut_save';

  const getCutGuidePos = () => {
      if (activeGuideStep !== 'cut_canvas') return undefined;
      
      // Offset calculation:
      // Padding of bg-white container (p-2) = 0.5rem = 8px
      // Border of JianzhiCanvas (border-2) = 2px
      // Border of bg-white (border) = 1px
      // Total approx offset to Canvas (0,0) from Container (0,0) = 11px
      const OFFSET = 11; 

      if (mode === 'custom' && simulationRef.current instanceof PaperSimulation) {
          const sim = simulationRef.current;
          return {
              x: (sim.minX + sim.maxX) / 2 + OFFSET,
              y: (sim.minY + sim.maxY) / 2 + OFFSET
          };
      } else if (mode === 'preset') {
          // Preset always centers at canvas center, pointing up
          // A good spot is roughly up the wedge.
          // Wedge centroid Y approx (2/3) * Radius from center.
          const r = (SIM_SIZE / 2) * 0.95;
          const centroidDist = r * 0.6; 
          return {
              x: SIM_SIZE / 2 + OFFSET,
              y: SIM_SIZE / 2 - centroidDist + OFFSET
          };
      }
      return undefined;
  };
  const cutGuidePos = getCutGuidePos();

  return (
    <div className="min-h-screen bg-grid-pattern text-zinc-800 pb-20">
      <header className="bg-white border-b border-zinc-200 pt-4 pb-2 px-6 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="w-20"></div>

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

            <div className="w-20 flex justify-end gap-2">
                <button 
                    onClick={toggleLanguage}
                    className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
                >
                    <Languages size={24} />
                </button>
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
                >
                    <Settings size={24} />
                </button>
            </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-8 px-4 flex flex-col items-center gap-8">
        
        <div className={`relative w-full transition-all duration-500`}>
           
           {phase === 'folding' && (
             <div className="flex flex-col items-center gap-8 animate-in fade-in duration-500 max-w-lg mx-auto">
               <div className="relative w-full h-[600px] bg-white/50 rounded-xl border-2 border-dashed border-zinc-200 overflow-hidden flex items-center justify-center">
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
               
               <div className="w-full z-20 pb-10">
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
                        activeGuideStep={activeGuideStep}
                   />
               </div>
             </div>
           )}

           {phase === 'cutting' && (
                <div className="flex flex-col lg:flex-row items-start justify-center gap-12 animate-in slide-in-from-bottom-8 duration-500">
                    
                    {/* Left Column: Canvas + Controls */}
                    <div className="flex flex-col gap-6 w-[500px]">
                        
                        <div className="flex items-center justify-between px-2">
                             <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t.step_cut}</span>
                             <button 
                                onClick={handleSaveCut}
                                className="text-zinc-500 hover:text-red-600 flex items-center gap-1 text-xs font-bold uppercase transition-colors"
                             >
                                <Download size={14} />
                                {t.savePattern}
                             </button>
                        </div>
                        
                        <div className="relative">
                            <div 
                                className="bg-white p-2 rounded-xl shadow-lg border border-zinc-100 z-10 overflow-hidden"
                                onClick={() => {
                                    if(activeGuideStep === 'cut_tool') setActiveGuideStep('cut_canvas');
                                }}
                            >
                                <JianzhiCanvas
                                    ref={canvasRef}
                                    width={SIM_SIZE}
                                    height={SIM_SIZE}
                                    tool={tool}
                                    brushSize={brushSize}
                                    onInit={initCutCanvas}
                                    onInteractEnd={updatePreview} 
                                    onInteractStart={() => {}}
                                />
                            </div>

                            {/* Intelligent Cut Guides */}
                            {activeGuideStep === 'cut_tool' && (
                                <GuideOverlay 
                                    text={t.guide_cut_tool} 
                                    subtext={t.guide_cut_tool_sub}
                                    icon={Brush}
                                    placement="center"
                                    onClick={() => setActiveGuideStep('cut_canvas')}
                                />
                            )}
                            {activeGuideStep === 'cut_canvas' && (
                                <GuideOverlay 
                                    text={t.guide_cut_canvas} 
                                    subtext={t.guide_cut_canvas_sub}
                                    icon={Hand}
                                    passThrough={true}
                                    targetPos={cutGuidePos}
                                    onClick={() => {}} 
                                />
                            )}
                        </div>

                        {/* Vertically aligned Controls under the Canvas */}
                        <Controls 
                            tool={tool}
                            onToolChange={setTool}
                            brushSize={brushSize}
                            onBrushSizeChange={setBrushSize}
                            onUndo={() => { canvasRef.current?.undo(); updatePreview(); }}
                            onRedo={() => { canvasRef.current?.redo(); updatePreview(); }}
                            onClear={handleResetFolds}
                            themeColor={dynamicThemeColor}
                            language={language}
                            activeGuideStep={activeGuideStep}
                            onNextGuide={handleNextGuide}
                        />
                    </div>

                    <div className="text-zinc-300 hidden lg:block self-center pt-32">
                        <ArrowRight size={32} />
                    </div>

                    {/* Right Column: Preview */}
                    <div className="flex flex-col gap-6 w-[500px]">
                         <div className="flex items-center justify-between px-2">
                             <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Preview</span>
                         </div>
                         
                         <div className="relative bg-white p-2 rounded-xl shadow-lg border border-zinc-100 w-[500px] h-[500px] flex items-center justify-center overflow-hidden bg-zinc-50/50">
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

                             {/* Preview Guide Overlay */}
                            {activeGuideStep === 'cut_preview' && (
                                <GuideOverlay 
                                    text={t.guide_cut_preview} 
                                    subtext={t.guide_cut_preview_sub}
                                    icon={Eye}
                                    onClick={() => setActiveGuideStep('cut_save')}
                                />
                            )}
                         </div>

                         {/* Separate Save Result Button */}
                         <div className="relative">
                            <button 
                                onClick={handleSaveResult}
                                className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-white shadow-lg ${
                                    dynamicThemeColor ? '' : 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                                }`}
                                style={dynamicThemeColor ? { backgroundColor: dynamicThemeColor } : {}}
                            >
                                <Download size={24} />
                                {t.saveResult}
                            </button>

                            {isSaveGuide && (
                                <>
                                    <div className="absolute inset-0 -m-1 border-4 border-red-500 rounded-xl animate-pulse pointer-events-none"></div>
                                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 bg-red-600 text-white text-xs p-2 rounded-lg shadow-xl text-center pointer-events-none z-50">
                                        <div className="font-bold mb-0.5">{t.guide_cut_save}</div>
                                        <div className="opacity-90 text-[10px]">{t.guide_cut_save_sub}</div>
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rotate-45"></div>
                                    </div>
                                </>
                            )}
                         </div>
                    </div>
                </div>
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
