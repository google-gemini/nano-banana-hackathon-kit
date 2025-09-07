import React, { useState, useCallback, useEffect } from 'react';
import { AppStep, UserInput, CharacterSettings, TrailerData, SavedTrailer, AssemblyStatus, EditDecisionList, ApiKeys, SceneImage } from './types';
import UserInputForm from './components/UserInputForm';
import CharacterInput from './components/AvatarBuilder';
import AssemblingView from './components/AssemblingView';
import ResultView from './components/ResultView';
import LoginPage from './components/LoginPage';
import GalleryView from './components/GalleryView';
import VoiceControlUI from './components/VoiceControlUI';
import ScriptReview from './components/ScriptReview';
import ScriptwritingView from './components/ScriptwritingView';
import ImageReview from './components/ImageReview';
import SoundDesign from './components/SoundDesign';
import ProgressSidebar from './components/ProgressSidebar';
import SettingsModal from './components/SettingsModal';
import { useVoiceControl } from './hooks/useVoiceControl';
import * as dbService from './services/dbService';
import { generateTrailerScript, generateSceneImage, generateCharacterPromptFromInput, generateEditDecisionList, selectVoice, generateFakeReviews, generateImagePromptVariation, generateVideoFromImage, editSceneImage, generateVideoPromptVariation, generateCinematicVideoPrompt } from './services/geminiService';
import { generateVoiceover } from './services/elevenLabsService';
import { mixAudio } from './services/audioService';
import { assembleTrailer } from './services/videoService';

const ELEVENLABS_DEFAULT_KEY = 'sk_dfcc6ffc443433198e5dbabfa9fa03a89f57018fbd5b3f0e';
const GOOGLE_AI_DEFAULT_KEY = 'DEFAULT_DEMO_KEY'; // This is a placeholder

const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
};

const App: React.FC = () => {
  const [appStep, setAppStep] = useState<AppStep>(AppStep.LOGIN);
  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [characterSettings, setCharacterSettings] = useState<CharacterSettings | null>(null);
  const [trailerData, setTrailerData] = useState<TrailerData | null>(null);
  const [savedTrailers, setSavedTrailers] = useState<SavedTrailer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [assemblyStatus, setAssemblyStatus] = useState<AssemblyStatus>({ stage: '', progress: 0, logs: [] });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    elevenLabs: ELEVENLABS_DEFAULT_KEY,
    googleAI: GOOGLE_AI_DEFAULT_KEY, // Cannot be empty, but will be overridden by env var if present
  });

  useEffect(() => {
    // Load keys from localStorage
    const savedKeys = localStorage.getItem('apiKeys');
    if (savedKeys) {
      try {
        const parsedKeys = JSON.parse(savedKeys);
        if (parsedKeys.elevenLabs && parsedKeys.googleAI) {
            setApiKeys(parsedKeys);
        }
      } catch (e) {
        console.error("Failed to parse saved API keys", e);
        setApiKeys({ elevenLabs: ELEVENLABS_DEFAULT_KEY, googleAI: GOOGLE_AI_DEFAULT_KEY });
      }
    }

    // Load saved trailers from IndexedDB on initial load
    const loadTrailers = async () => {
        await dbService.initDB();
        const trailers = await dbService.getAllTrailers();
        setSavedTrailers(trailers);
    };
    loadTrailers();
  }, []);

  const getGoogleAIKey = useCallback(() => {
    // The environment variable from the execution context has the highest priority.
    // If it's not present, we fall back to the user-configured key.
    return process.env.API_KEY || apiKeys.googleAI;
  }, [apiKeys.googleAI]);

  const handleSaveKeys = (newKeys: ApiKeys) => {
    setApiKeys(newKeys);
    localStorage.setItem('apiKeys', JSON.stringify(newKeys));
    setIsSettingsOpen(false);
  };

  const handleCommand = useCallback((command: string) => {
    console.log("Voice command received:", command);
    if ((command.includes('gallery') || command.includes('show me my trailers')) && appStep > AppStep.LOGIN) {
      handleViewGallery();
    } else if (command.includes('restart') || command.includes('new trailer')) {
      if (appStep >= AppStep.RESULT) handleRestart();
    } else if (command.includes('save')) {
      if (appStep === AppStep.RESULT) handleSaveToGallery();
    } else if (command.includes('start')) {
        if (appStep === AppStep.LOGIN) handleStart();
    }
  }, [appStep]);

  const { isListening, startListening, stopListening, isSupported } = useVoiceControl(handleCommand);

  const handleStart = () => setAppStep(AppStep.INPUT);
  
  const handleInputSubmit = async (data: UserInput) => {
    setUserInput(data);
    setError(null);
    setAppStep(AppStep.SCRIPT_GENERATION);
    setStartTime(Date.now()); // Start the production clock
    try {
      const scriptResult = await generateTrailerScript(data, getGoogleAIKey());
      setTrailerData({
          ...scriptResult,
          sceneImages: scriptResult.keyScenes.map(scene => ({ scene, imageBase64: '', status: 'pending', videoStatus: 'pending' })),
      });
      setAppStep(AppStep.SCRIPT_REVIEW);
    } catch (err) {
      handleError(err, AppStep.INPUT);
    }
  };

  const handleScriptAccept = (editedNarrative: string, editedKeyScenes: string[]) => {
    if (!trailerData) return;
    setTrailerData({
      ...trailerData,
      narrative: editedNarrative,
      keyScenes: editedKeyScenes,
      sceneImages: editedKeyScenes.map(scene => ({ scene, imageBase64: '', status: 'pending', videoStatus: 'pending' })),
    });
    setAppStep(AppStep.CHARACTER_INPUT);
  };
  
  const handleCharacterSubmit = async (settings: CharacterSettings) => {
    setAppStep(AppStep.IMAGE_REVIEW); 
    setError(null);
    setCharacterSettings(settings);
    generateAllSceneImages(settings);
  };

  const tryGenerateImage = async (scenePrompt: string, characterPrompt: string, title: string, movieTitle: string): Promise<string> => {
    let success = false;
    let attempts = 0;
    let currentScenePrompt = scenePrompt;
    let lastError: any = new Error("Image generation failed after multiple attempts.");

    while(!success && attempts < 2) {
        try {
            const imageBase64 = await generateSceneImage({ title, keyScenes: [currentScenePrompt], narrative: '', sceneImages: [] }, characterPrompt, movieTitle, getGoogleAIKey());
            success = true;
            return imageBase64;
        } catch (err) {
            lastError = err;
            attempts++;
            if (attempts < 2) {
                console.warn(`Attempt ${attempts} failed for scene. Rewriting prompt and retrying.`);
                currentScenePrompt = await generateImagePromptVariation(currentScenePrompt, characterPrompt, getGoogleAIKey());
            }
        }
    }
    throw lastError;
  };
  
  const generateAllSceneImages = async (settings: CharacterSettings) => {
    if (!trailerData || !userInput) return;
    
    setTrailerData(prev => prev ? ({ ...prev, sceneImages: prev.sceneImages.map(img => ({...img, status: 'generating'})) }) : null);

    try {
      const refinedCharacterPrompt = await generateCharacterPromptFromInput(settings, getGoogleAIKey());

      const imagePromises = trailerData.keyScenes.map((scene, i) => 
        tryGenerateImage(scene, refinedCharacterPrompt, trailerData.title, userInput.movieTitle)
          .then(imageBase64 => {
            setTrailerData(prev => {
                if (!prev) return null;
                const newImages = [...prev.sceneImages];
                newImages[i] = { ...newImages[i], imageBase64, status: 'done' };
                return { ...prev, sceneImages: newImages };
            });
          })
          .catch(err => {
            console.error(`Failed to generate image for scene ${i}:`, err);
            setTrailerData(prev => {
                if (!prev) return null;
                const newImages = [...prev.sceneImages];
                newImages[i] = { ...newImages[i], status: 'error' };
                return { ...prev, sceneImages: newImages };
            });
            throw err; // Propagate to Promise.all
          })
      );
      await Promise.all(imagePromises);

    } catch (err) {
       handleError(err, AppStep.CHARACTER_INPUT);
    }
  };

  const handleRegenerateImage = async (index: number, customPrompt?: string) => {
    if (!trailerData || !userInput || !characterSettings) return;

    setTrailerData(prev => {
      if (!prev) return null;
      const newImages = [...prev.sceneImages];
      newImages[index].status = 'generating';
      return { ...prev, sceneImages: newImages };
    });

    try {
        const refinedCharacterPrompt = await generateCharacterPromptFromInput(characterSettings, getGoogleAIKey());
        const sceneToGenerate = customPrompt || trailerData.keyScenes[index];
        const imageBase64 = await tryGenerateImage(sceneToGenerate, refinedCharacterPrompt, trailerData.title, userInput.movieTitle);
        
        setTrailerData(prev => {
            if (!prev) return null;
            const newImages: SceneImage[] = [...prev.sceneImages];
            const newKeyScenes: string[] = [...prev.keyScenes];
            
            newImages[index] = { ...newImages[index], scene: sceneToGenerate, imageBase64, status: 'done' };
            newKeyScenes[index] = sceneToGenerate;

            return { ...prev, sceneImages: newImages, keyScenes: newKeyScenes };
        });

    } catch (err) {
        console.error(`Failed to regenerate image for scene ${index}:`, err);
        setTrailerData(prev => {
             if (!prev) return null;
            const newImages = [...prev.sceneImages];
            newImages[index] = { ...newImages[index], status: 'error' };
            return { ...prev, sceneImages: newImages };
        });
    }
  };

  const handleEditImage = async (index: number, editPrompt: string) => {
    if (!trailerData) return;

    const originalImage = trailerData.sceneImages[index].imageBase64;
    if (!originalImage) {
        console.error("Cannot edit image: No base image available.");
        return;
    }

    setTrailerData(prev => {
        if (!prev) return null;
        const newImages = [...prev.sceneImages];
        newImages[index].status = 'generating';
        return { ...prev, sceneImages: newImages };
    });

    try {
        const newImageBase64 = await editSceneImage(originalImage, editPrompt, getGoogleAIKey());
        setTrailerData(prev => {
            if (!prev) return null;
            const newImages = [...prev.sceneImages];
            newImages[index] = { ...newImages[index], imageBase64: newImageBase64, status: 'done' };
            return { ...prev, sceneImages: newImages };
        });
    } catch (err) {
        console.error(`Failed to edit image for scene ${index}:`, err);
        setTrailerData(prev => {
            if (!prev) return null;
            const newImages = [...prev.sceneImages];
            newImages[index] = { ...newImages[index], status: 'error' }; // Revert to old image but show error
            return { ...prev, sceneImages: newImages };
        });
    }
  };
  
  const handleSoundDesignSubmit = (musicUrl: string) => {
      if (!trailerData) return;
      setTrailerData({ ...trailerData, musicUrl });
      handleFinalize(musicUrl);
  };

  const handleFinalize = async (musicUrl: string) => {
    if (!trailerData || !userInput || !characterSettings) return;
    setAppStep(AppStep.ASSEMBLING);
    setError(null);

    const updateLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setAssemblyStatus(prev => ({ ...prev, logs: [...prev.logs, { message, timestamp }] }));
    };
    
    setAssemblyStatus({ stage: "Initializing production...", progress: 0, logs: [{ message: "[PROD] Production started.", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }], currentTaskInfo: { type: 'init' } });

    try {
      // --- VFX PIPELINE (VEO Generation) ---
      const vfxStartProgress = 5;
      const vfxEndProgress = 25;
      const vfxTotalProgress = vfxEndProgress - vfxStartProgress;

      setAssemblyStatus(prev => ({ ...prev, stage: "VFX Pipeline...", progress: vfxStartProgress, currentTaskInfo: { type: 'vfx' } }));
      updateLog("[VFX] Generating video clips for each scene...");
      
      const finalImages: SceneImage[] = [...trailerData.sceneImages];
      const progressPerVideo = vfxTotalProgress / finalImages.length;

      for (let i = 0; i < finalImages.length; i++) {
        const image = finalImages[i];
        let videoPrompt = image.scene;
        try {
            updateLog(`[VFX] Directing cinematic prompt for scene ${i + 1}...`);
            videoPrompt = await generateCinematicVideoPrompt(image.scene, trailerData.narrative, getGoogleAIKey());
            updateLog(`[VFX] Animating scene ${i + 1}...`);

            setAssemblyStatus(prev => ({ ...prev, stage: `Animating scene ${i+1} of ${finalImages.length}...`, currentTaskInfo: {type: 'vfx', imageBase64: image.imageBase64, prompt: videoPrompt, currentSceneIndex: i }}));
            
            const videoUrl = await generateVideoFromImage(image.imageBase64, videoPrompt, getGoogleAIKey());
            updateLog(`[VFX] Scene ${i + 1} animation complete.`);
            finalImages[i] = { ...image, scene: videoPrompt, videoUrl, videoStatus: 'done' };

        } catch (err: any) {
             if (err.message?.includes('usage guidelines') || err.message?.includes('blocked')) {
                updateLog(`[VFX] WARN: Prompt for scene ${i + 1} was blocked. Rewriting and retrying...`);
                try {
                    videoPrompt = await generateVideoPromptVariation(videoPrompt, getGoogleAIKey());
                    setAssemblyStatus(prev => ({ ...prev, currentTaskInfo: { type: 'vfx', imageBase64: image.imageBase64, prompt: videoPrompt, currentSceneIndex: i } }));
                    const videoUrl = await generateVideoFromImage(image.imageBase64, videoPrompt, getGoogleAIKey());
                    updateLog(`[VFX] Scene ${i + 1} animation complete on second attempt.`);
                    finalImages[i] = { ...image, scene: videoPrompt, videoUrl, videoStatus: 'done' };
                } catch (retryErr: any) {
                    updateLog(`[VFX] WARN: Retry for scene ${i + 1} failed. Falling back to image animation. Reason: ${retryErr.message}`);
                    finalImages[i] = { ...image, videoStatus: 'error' };
                }
            } else {
                updateLog(`[VFX] WARN: Animation for scene ${i + 1} failed. Falling back to image animation. Reason: ${err.message}`);
                finalImages[i] = { ...image, videoStatus: 'error' };
            }
        }
        setTrailerData(prev => prev ? { ...prev, sceneImages: [...finalImages] } : null);
        setAssemblyStatus(prev => ({ ...prev, progress: prev.progress + progressPerVideo }));
      }
      updateLog("[VFX] VFX pipeline complete.");


      // --- AUDIO PIPELINE ---
      setAssemblyStatus(prev => ({ ...prev, stage: "Casting voice actor...", progress: 30, currentTaskInfo: { type: 'audio', prompt: userInput.sequelConcept } }));
      updateLog("[CASTING] Director reviewing voice talent...");
      const { voiceId, reason, voiceName } = await selectVoice(userInput.genre, userInput.sequelConcept, getGoogleAIKey());
      updateLog(`[CASTING] Voice selected: ${voiceName}. ${reason}`);
      
      setAssemblyStatus(prev => ({ ...prev, stage: "Recording voiceover...", progress: 35, currentTaskInfo: { type: 'audio', voiceName, prompt: trailerData.narrative }}));
      updateLog("[VO] Recording voiceover...");
      const voiceoverUrl = await generateVoiceover(trailerData.narrative, apiKeys.elevenLabs, voiceId);
      updateLog("[VO] Voiceover recorded.");

      updateLog("[EDITING] Analyzing voiceover duration...");
      const audioEl = new Audio(voiceoverUrl);
      const audioDuration = await new Promise<number>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Voiceover metadata loading timed out.")), 5000);
        audioEl.onloadedmetadata = () => {
          clearTimeout(timer);
          if (audioEl.duration === Infinity || isNaN(audioEl.duration) || audioEl.duration === 0) {
            reject(new Error("Could not determine a valid duration from the voiceover."));
          } else {
            resolve(audioEl.duration);
          }
        };
        audioEl.onerror = () => { clearTimeout(timer); reject(new Error("Could not load voiceover audio.")); };
      });
      updateLog(`[EDITING] Voiceover duration locked: ${audioDuration.toFixed(2)}s.`);

      setAssemblyStatus(prev => ({ ...prev, stage: "Mixing audio tracks...", progress: 45, currentTaskInfo: { type: 'audio', prompt: 'Mixing voice & music...' }}));
      updateLog("[SOUND] Mixing final audio...");
      const mixedAudioUrl = await mixAudio(voiceoverUrl, musicUrl);
      setTrailerData(prev => prev ? { ...prev, audioUrl: mixedAudioUrl } : null);
      updateLog("[SOUND] Audio mix complete.");

      // --- EDITING PIPELINE ---
      setAssemblyStatus(prev => ({ ...prev, stage: "Generating reviews...", progress: 50, currentTaskInfo: { type: 'edit' }}));
      updateLog("[MARKETING] Consulting focus groups...");
      const reviews = await generateFakeReviews(userInput.genre, trailerData.title, getGoogleAIKey());
      reviews.forEach(r => updateLog(`[MARKETING] Generated review: "${r}"`));
      
      setAssemblyStatus(prev => ({ ...prev, stage: "Creating edit decision list...", progress: 60, currentTaskInfo: { type: 'edit', sceneCount: finalImages.length, audioDuration }}));
      updateLog("[EDITING] Director is making the final cut...");
      const edl: EditDecisionList = await generateEditDecisionList(finalImages, trailerData.narrative, audioDuration, trailerData.title, reviews, getGoogleAIKey());
      updateLog("[EDITING] Edit Decision List locked.");

      // --- FINAL ASSEMBLY ---
      setAssemblyStatus(prev => ({ ...prev, stage: "Assembling final trailer...", progress: 70, currentTaskInfo: { type: 'finalizing' }}));
      updateLog("[EDITING] Assembling final cut...");
      
      const finalVideoUrl = await assembleTrailer(finalImages, mixedAudioUrl, edl,
          (p) => {
            const stageText = p.currentShot ? `Rendering shot ${p.currentShot} of ${p.totalShots}...` : "Compositing shots...";
            setAssemblyStatus(prev => ({ 
              ...prev, 
              stage: stageText,
              progress: 70 + (p.percent * 0.3), // Assembly is 30% of the progress
              shotProgress: p.currentShot ? { currentShot: p.currentShot, totalShots: p.totalShots || 0 } : prev.shotProgress
            }))
          },
          getGoogleAIKey()
      );
      updateLog("[EDITING] Final render complete.");
      
      const finalProductionTime = startTime ? formatTime(Date.now() - startTime) : undefined;
      setTrailerData(prev => prev ? { ...prev, videoUrl: finalVideoUrl, productionTime: finalProductionTime } : null);
      setAppStep(AppStep.RESULT);
      
    } catch (err) {
      handleError(err, AppStep.SOUND_DESIGN);
    }
  };

  const handleSaveToGallery = async () => {
    if (userInput && characterSettings && trailerData && trailerData.videoUrl) {
      try {
        const response = await fetch(trailerData.videoUrl);
        const videoBlob = await response.blob();
        
        const newSavedTrailer: SavedTrailer = {
          id: new Date().toISOString(),
          userInput,
          characterSettings,
          trailerData, // This now includes productionTime
          videoBlob,
        };

        await dbService.saveTrailer(newSavedTrailer);
        const allTrailers = await dbService.getAllTrailers();
        setSavedTrailers(allTrailers);
        setAppStep(AppStep.GALLERY);
      } catch (err) {
        console.error("Failed to save trailer to DB:", err);
        setError("Could not save the trailer video.");
      }
    }
  };

  const handleViewGallery = () => setAppStep(AppStep.GALLERY);
  
  const handleSelectFromGallery = (item: SavedTrailer) => {
    setUserInput(item.userInput);
    setCharacterSettings(item.characterSettings);
    // Create a new blob URL from the stored blob for playback
    const videoUrl = item.videoBlob ? URL.createObjectURL(item.videoBlob) : undefined;
    setTrailerData({ ...item.trailerData, videoUrl });
    setAppStep(AppStep.RESULT);
  };

  const handleRestart = () => {
    setAppStep(AppStep.INPUT);
    setUserInput(null);
    setCharacterSettings(null);
    setTrailerData(null);
    setError(null);
    setStartTime(null);
  };

  const handleError = (err: any, returnStep: AppStep) => {
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during generation.";
    console.error("Error during generation:", err);
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setAssemblyStatus(prev => ({...prev, logs: [...prev.logs, { message: `[ERROR] ${errorMessage}`, timestamp }]}));
    setError(errorMessage);
    setAppStep(returnStep);
  };

  const renderContent = () => {
    switch (appStep) {
      case AppStep.LOGIN:
        return <LoginPage onLogin={handleStart} onOpenSettings={() => setIsSettingsOpen(true)} />;
      // All other steps are wrapped in the sidebar layout
      default:
        return (
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
              <ProgressSidebar currentStep={appStep} />
              <main className="w-full bg-slate-900/50 rounded-xl p-6 sm:p-8 border border-slate-700/50 container-glow">
                  {
                    (() => {
                        switch (appStep) {
                            case AppStep.INPUT:
                                return <UserInputForm onSubmit={handleInputSubmit} googleAiApiKey={getGoogleAIKey()} />;
                            case AppStep.SCRIPT_GENERATION:
                                return <ScriptwritingView />;
                            case AppStep.SCRIPT_REVIEW:
                                return trailerData && <ScriptReview trailerData={trailerData} onAccept={handleScriptAccept} onBack={() => setAppStep(AppStep.INPUT)} error={error} />;
                            case AppStep.CHARACTER_INPUT:
                                return <CharacterInput onSubmit={handleCharacterSubmit} onBack={() => setAppStep(AppStep.SCRIPT_REVIEW)} googleAiApiKey={getGoogleAIKey()} />;
                            case AppStep.IMAGE_REVIEW:
                                return trailerData && characterSettings && userInput && <ImageReview images={trailerData.sceneImages} onRegenerate={handleRegenerateImage} onEdit={handleEditImage} onAccept={() => setAppStep(AppStep.SOUND_DESIGN)} onBack={() => setAppStep(AppStep.CHARACTER_INPUT)} error={error} googleAiApiKey={getGoogleAIKey()} characterPrompt={characterSettings.characterPrompt} />;
                            case AppStep.SOUND_DESIGN:
                                return userInput && <SoundDesign userInput={userInput} onSoundGenerated={handleSoundDesignSubmit} onBack={() => setAppStep(AppStep.IMAGE_REVIEW)} elevenLabsApiKey={apiKeys.elevenLabs} googleAiApiKey={getGoogleAIKey()} />;
                            case AppStep.VIDEO_GENERATION:
                            case AppStep.ASSEMBLING:
                                return <AssemblingView status={assemblyStatus} startTime={startTime} />;
                            case AppStep.RESULT:
                                return trailerData && userInput && <ResultView trailerData={trailerData} userInput={userInput} onRestart={handleRestart} onSave={handleSaveToGallery} onGallery={handleViewGallery} />;
                            case AppStep.GALLERY:
                                return <GalleryView items={savedTrailers} onSelect={handleSelectFromGallery} onBack={handleRestart} />;
                            default:
                                return <p>Loading...</p>;
                        }
                    })()
                  }
              </main>
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {appStep > AppStep.LOGIN && (
        <header className="w-full max-w-7xl mb-8">
          <h1 
            className="text-3xl font-retro text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-400 neon-glow cursor-pointer"
            onClick={() => appStep > AppStep.INPUT ? handleRestart() : null}
          >
            TrailerCraft AI
          </h1>
        </header>
      )}
      {renderContent()}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSave={handleSaveKeys} 
        currentKeys={apiKeys} 
      />
      <VoiceControlUI isListening={isListening} onToggleListen={() => isListening ? stopListening() : startListening()} isSupported={isSupported} />
    </div>
  );
};

export default App;
