import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Scissors, Settings, Languages, ArrowRight, Hand, Eye, Download, Brush, Scroll } from 'lucide-react';
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

// Hook for responsive display size
const useDisplaySize = (baseSize: number, margin: number = 48) => {
    const [displaySize, setDisplaySize] = useState(baseSize);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            // Ensure it fits within width minus margin, but max out at baseSize
            // Also consider height to avoid scroll on landscape if needed, but width is primary constraint here
            const size = Math.min(width - margin, baseSize);
            setDisplaySize(Math.floor(size));
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check

        return () => window.removeEventListener('resize', handleResize);
    }, [baseSize, margin]);

    return displaySize;
};

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
  const [paperColor, setPaperColor] = useState('#C23531'); // Traditional China Red

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    dynamicTheme: false
  });

  // Interactive Guide State Sequence
  const [activeGuideStep, setActiveGuideStep] = useState<string | null>(null);
  
  // Track completion
  const guideHistory = useRef({ 
      foldStarted: false,
      cutStarted: false
  });

  const SIM_SIZE = 500;
  const displaySize = useDisplaySize(SIM_SIZE);
  const scaleFactor = displaySize / SIM_SIZE;

  const simulationRef = useRef<SimulationEngine | null>(null);
  const foldCanvasRef = useRef<HTMLCanvasElement>(null);
  
  if (!simulationRef.current) {
      simulationRef.current = new PaperSimulation(SIM_SIZE);
  }

  const MAX_FOLDS = 5;
  
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
  }, [phase, paperColor, isAnimating, displaySize]); // Re-render when size changes

  const handleModeChange = (newMode: FoldingMode) => {
      setMode(newMode);
      if (newMode === 'custom') {
          simulationRef.current = new PaperSimulation(SIM_SIZE);
          setFoldCount(0);
          setFoldSequence([]);
          if (!guideHistory.current.foldStarted) {
             setTimeout(() => setActiveGuideStep('fold_up'), 500);
             guideHistory.current.foldStarted = true;
          }
      } else {
          simulationRef.current = new PresetSimulation(SIM_SIZE, selectedPreset);
          setActiveGuideStep(null); 
      }
      
      if (foldCanvasRef.current && simulationRef.current) {
          const ctx = foldCanvasRef.current.getContext('2d');
          ctx?.clearRect(0, 0, displaySize, displaySize);
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
        ctx?.clearRect(0,0,displaySize, displaySize);
        setTimeout(() => simulationRef.current?.renderFoldedState(foldCanvasRef.current!, paperColor), 10);
    }
  };

  const handleFinishFolding = () => {
    if (activeGuideStep === 'fold_finish') {
        setActiveGuideStep(null); 
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
          setActiveGuideStep(null);
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
      
      return (
        <div 
          className={`flex flex-col items-center gap-2 transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-50'}`}
          style={isActive ? activeColorStyle : {}}
        >
          <div className="relative flex items-center justify-center w-8 h-8">
             <div className={`w-full h-full border-2 transform rotate-45 transition-colors ${isActive ? 'border-red-800 bg-red-50' : 'border-zinc-300'}`}></div>
             <div className={`absolute w-2 h-2 rounded-full ${isActive ? 'bg-red-700' : 'bg-zinc-300'}`}></div>
          </div>
          <span className={`text-xs font-serif font-bold tracking-widest ${isActive ? 'text-red-900' : 'text-zinc-400'}`}>{label}</span>
        </div>
      );
  };

  const dynamicThemeColor = appSettings.dynamicTheme ? paperColor : undefined;

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

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
                {/* Pulse Ring - Gold style for chinese theme */}
                {isTargeted ? (
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-yellow-500 rounded-full animate-pulse opacity-60 pointer-events-none" style={{ boxShadow: '0 0 15px rgba(234, 179, 8, 0.4)' }}></div>
                ) : (
                     <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
                         <div className="w-full h-full border-4 border-yellow-600/30 rounded-xl animate-pulse"></div>
                     </div>
                )}
            
                {/* Tooltip - Scroll Style */}
                <div className={`bg-[#fffbf0] text-red-900 px-6 py-3 border border-[#d4c4b0] shadow-xl flex items-center gap-3 animate-in fade-in zoom-in-90 duration-300 pointer-events-auto relative z-10 ${passThrough ? 'pointer-events-none opacity-90' : ''}`} style={{ boxShadow: '4px 4px 0 rgba(185, 28, 28, 0.1)' }}>
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-red-800"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-red-800"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-red-800"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-red-800"></div>

                    <Icon size={20} className="animate-bounce text-red-700" />
                    <div className="flex flex-col whitespace-nowrap">
                        <span className="font-serif font-bold text-sm tracking-wide">{text}</span>
                        <span className="text-[10px] opacity-80 text-zinc-600">{subtext}</span>
                    </div>
                </div>
            </div>
        </div>
      );
  };

  const isSaveGuide = activeGuideStep === 'cut_save';

  const getCutGuidePos = () => {
      if (activeGuideStep !== 'cut_canvas') return undefined;
      // Padding (16) + Border (1) = 17 offset. 
      // Need to scale this offset because the canvas is scaled visually, but the coordinate system of the overlay is usually 1:1 with container.
      // However, our logic maps logic coordinates.
      // We will project coordinates to the visual size.
      const OFFSET = 17; 
      
      let logicalX = 0, logicalY = 0;

      if (mode === 'custom' && simulationRef.current instanceof PaperSimulation) {
          const sim = simulationRef.current;
          logicalX = (sim.minX + sim.maxX) / 2;
          logicalY = (sim.minY + sim.maxY) / 2;
      } else if (mode === 'preset') {
          const r = (SIM_SIZE / 2) * 0.95;
          const centroidDist = r * 0.6; 
          logicalX = SIM_SIZE / 2;
          logicalY = SIM_SIZE / 2 - centroidDist;
      }
      
      // Map to visual coordinates
      return {
          x: logicalX * scaleFactor + OFFSET,
          y: logicalY * scaleFactor + OFFSET
      };
  };
  const cutGuidePos = getCutGuidePos();

  return (
    <div className="min-h-screen bg-pattern-lattice text-[#2C2C2C] pb-20 font-serif">
      {/* Global Dark Backdrop for Guides */}
      {activeGuideStep && (
          <div className="fixed inset-0 bg-black/50 z-45 animate-in fade-in duration-300"></div>
      )}

      {/* Header: Traditional wooden plaque style */}
      <header className="bg-[#fffbf0] border-b border-[#d4c4b0] pt-3 pb-3 px-6 sticky top-0 z-40 shadow-sm">
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-red-800/20 to-transparent"></div>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="w-20 hidden md:block"></div>

            <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3 border-b-2 border-red-800/10 pb-2 px-6">
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
                
                <div className="flex gap-8 md:gap-12 mt-1">
                    <StepIndicator step="folding" label={t.step_fold} isActive={phase === 'folding'} />
                    <div className="text-zinc-300 pt-1">
                        <Scroll size={16} className="rotate-90" />
                    </div>
                    <StepIndicator step="cutting" label={t.step_cut} isActive={phase === 'cutting'} />
                </div>
            </div>

            <div className="w-20 flex justify-end gap-2">
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

      <main className="max-w-6xl mx-auto mt-8 px-2 md:px-4 flex flex-col items-center gap-8">
        
        <div className={`relative w-full transition-all duration-500`}>
           
           {phase === 'folding' && (
             <div className="flex flex-col items-center gap-8 animate-in fade-in duration-500 max-w-lg mx-auto">
               
               {/* Folding Canvas Frame */}
               <div className="relative p-3 bg-white border border-[#d4c4b0] shadow-lg rounded-sm chinese-card">
                   {/* Mounting Silk Border Effect */}
                   <div className="bg-[#f0ece2] p-4 border border-[#e5dcd1]">
                       <div className="relative bg-white border border-zinc-200 overflow-hidden flex items-center justify-center shadow-inner" style={{ width: displaySize, height: displaySize }}>
                           <div 
                              className="relative"
                              style={{ width: displaySize, height: displaySize }}
                           >
                               <div className="absolute inset-0 border border-zinc-100 bg-zinc-50/50"></div>
                               <canvas 
                                    ref={foldCanvasRef}
                                    width={SIM_SIZE}
                                    height={SIM_SIZE}
                                    style={{ width: displaySize, height: displaySize }}
                                    className="absolute inset-0"
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
                <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 animate-in slide-in-from-bottom-8 duration-500">
                    
                    {/* Left Column: Canvas + Controls */}
                    <div className="flex flex-col gap-5 relative w-full lg:w-auto items-center" style={activeGuideStep === 'cut_canvas' ? {zIndex: 50} : {}}>
                        
                        <div className="flex items-center justify-between w-full max-w-[500px] px-2 border-b border-[#d4c4b0] pb-1">
                             <span className="text-sm font-bold text-[#8c7b6c] font-serif tracking-widest">{t.step_cut}</span>
                             <button 
                                onClick={handleSaveCut}
                                className="text-[#8c7b6c] hover:text-red-800 flex items-center gap-1 text-xs font-bold uppercase transition-colors"
                             >
                                <Download size={14} />
                                {t.savePattern}
                             </button>
                        </div>
                        
                        <div className="relative">
                            {/* Canvas Frame */}
                            <div 
                                className="bg-white p-4 border border-[#d4c4b0] shadow-md z-10 overflow-hidden chinese-card inline-block"
                                onClick={() => {
                                    if(activeGuideStep === 'cut_tool') setActiveGuideStep('cut_canvas');
                                }}
                            >
                                <JianzhiCanvas
                                    ref={canvasRef}
                                    width={SIM_SIZE}
                                    height={SIM_SIZE}
                                    displaySize={displaySize}
                                    tool={tool}
                                    brushSize={brushSize}
                                    onInit={initCutCanvas}
                                    onInteractEnd={updatePreview} 
                                    onInteractStart={() => {}}
                                />
                            </div>

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

                        <div className="relative w-full max-w-[500px]" style={activeGuideStep ? {zIndex: 50} : {}}>
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
                    </div>

                    <div className="text-[#d4c4b0] hidden lg:block self-center pt-32">
                        <ArrowRight size={32} />
                    </div>

                    {/* Right Column: Preview */}
                    <div className="flex flex-col gap-5 w-full lg:w-auto items-center">
                         <div className="flex items-center justify-between w-full max-w-[500px] px-2 border-b border-[#d4c4b0] pb-1">
                             <span className="text-sm font-bold text-[#8c7b6c] font-serif tracking-widest">PREVIEW</span>
                         </div>
                         
                         {/* Preview Frame */}
                         <div className="relative bg-white p-4 border border-[#d4c4b0] shadow-md flex items-center justify-center overflow-hidden chinese-card inline-block">
                            {/* Inner container sized exactly to displaySize to match Canvas visual */}
                            <div 
                                style={{ width: displaySize, height: displaySize }}
                                className="relative flex items-center justify-center bg-[#f9f7f2]"
                            >
                                <div className="absolute inset-0 bg-[#f9f7f2] opacity-50 pointer-events-none"></div>
                                {previewImage ? (
                                    <img 
                                        src={previewImage} 
                                        alt="Preview" 
                                        className="max-w-full max-h-full object-contain drop-shadow-md z-10" 
                                    />
                                ) : (
                                    <div className="text-[#d4c4b0] flex flex-col items-center gap-2 z-10">
                                        <div className="w-12 h-12 rounded-full bg-[#f0ece2] flex items-center justify-center border border-[#e5dcd1]">
                                            <Settings size={20} className="animate-spin-slow" />
                                        </div>
                                        <span className="text-sm font-serif">Generating...</span>
                                    </div>
                                )}
                            </div>

                            {activeGuideStep === 'cut_preview' && (
                                <GuideOverlay 
                                    text={t.guide_cut_preview} 
                                    subtext={t.guide_cut_preview_sub}
                                    icon={Eye}
                                    onClick={() => setActiveGuideStep('cut_save')}
                                />
                            )}
                         </div>

                         <div className="relative w-full max-w-[500px]">
                            <button 
                                onClick={handleSaveResult}
                                className={`w-full py-4 rounded-sm font-serif font-bold transition-all flex items-center justify-center gap-2 text-white shadow-lg border-2 border-[#a02622] btn-seal ${
                                    dynamicThemeColor ? '' : 'bg-[#C23531] hover:bg-[#b91c1c]'
                                }`}
                                style={dynamicThemeColor ? { backgroundColor: dynamicThemeColor } : {}}
                            >
                                <Download size={24} />
                                {t.saveResult}
                            </button>

                            {isSaveGuide && (
                                <>
                                    <div className="absolute inset-0 -m-1 border-4 border-yellow-500 rounded-sm animate-pulse pointer-events-none"></div>
                                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 bg-[#fffbf0] text-red-900 border border-[#d4c4b0] p-2 rounded-sm shadow-xl text-center pointer-events-none z-50">
                                        <div className="font-bold mb-0.5 font-serif">{t.guide_cut_save}</div>
                                        <div className="opacity-90 text-[10px]">{t.guide_cut_save_sub}</div>
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#fffbf0] border-r border-b border-[#d4c4b0] rotate-45"></div>
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