import React, { useState, useEffect, useRef } from 'react';
import { generateCinematicScorePrompt } from '../services/geminiService';
import { generateBackgroundSound } from '../services/elevenLabsService';
import { UserInput } from '../types';

interface SoundDesignProps {
  userInput: UserInput;
  onSoundGenerated: (soundUrl: string) => void;
  onBack: () => void;
  elevenLabsApiKey: string;
  googleAiApiKey: string;
}

// Icons
const MagicWandIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.568 2.568A.75.75 0 014.25 2h1.569a.75.75 0 01.682.432l.5 1.001a.75.75 0 001.364 0l.5-1.001A.75.75 0 019.568 2h1.57a.75.75 0 01.682.432l.5 1.001a.75.75 0 001.364 0l.5-1.001a.75.75 0 01.682-.432h1.569a.75.75 0 01.593 1.156l-3.044 4.87a.75.75 0 000 .848l3.044 4.87a.75.75 0 01-.593 1.156h-1.569a.75.75 0 01-.682-.432l-.5-1.001a.75.75 0 00-1.364 0l-.5 1.001a.75.75 0 01-.682.432h-1.57a.75.75 0 01-.682-.432l-.5-1.001a.75.75 0 00-1.364 0l-.5 1.001a.75.75 0 01-.682.432H4.25a.75.75 0 01-.593-1.156l3.044-4.87a.75.75 0 000-.848L3.659 3.724A.75.75 0 013.568 2.568z" clipRule="evenodd" /></svg>);
const SpinnerIcon = () => ( <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);
const PlayIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>);
const PauseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>);


const SoundDesign: React.FC<SoundDesignProps> = ({ userInput, onSoundGenerated, onBack, elevenLabsApiKey, googleAiApiKey }) => {
  const [prompt, setPrompt] = useState('');
  const [soundUrl, setSoundUrl] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const getSuggestion = async () => {
    setIsSuggesting(true);
    setError(null);
    try {
      const result = await generateCinematicScorePrompt(userInput.genre, userInput.sequelConcept, googleAiApiKey);
      setPrompt(result);
    } catch (err) {
      setError("Failed to get a suggestion from the AI. Please write a prompt manually.");
      console.error("Failed to get sound prompt suggestion:", err);
    } finally {
      setIsSuggesting(false);
    }
  };
  
  useEffect(() => {
    getSuggestion();
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (soundUrl) {
        URL.revokeObjectURL(soundUrl);
      }
    };
  }, [userInput]);

  const handleGenerateSound = async () => {
    if (!prompt.trim()) {
      setError("Prompt cannot be empty.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    setSoundUrl(null); // Clear previous sound
    if (audioRef.current) audioRef.current.pause();

    try {
      const generatedUrl = await generateBackgroundSound(prompt, elevenLabsApiKey);
      setSoundUrl(generatedUrl);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred during sound generation.");
      console.error("Failed to generate background sound:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePreview = () => {
    if (!soundUrl) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current || audioRef.current.src !== soundUrl) {
        audioRef.current = new Audio(soundUrl);
        audioRef.current.loop = true;
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onerror = () => { setIsPlaying(false); setError("Could not play audio file."); };
      }
      audioRef.current.play().catch(() => { setIsPlaying(false); setError("Could not play audio file."); });
      setIsPlaying(true);
    }
  };

  const handleAccept = () => {
    if (soundUrl) {
      if (audioRef.current) audioRef.current.pause();
      onSoundGenerated(soundUrl);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-retro text-orange-400 mb-4 neon-glow-orange tracking-tighter">Phase 4: Sound Design [🎵]</h2>
      <p className="text-slate-400 mb-6">Describe the cinematic score for your trailer. The AI has provided a suggestion for an impactful theme.</p>
      
       <div className="space-y-4">
        <div>
          <label htmlFor="soundPrompt" className="block text-sm font-medium text-slate-300 mb-2">
            Cinematic Score Prompt
          </label>
           <div className="relative">
            <textarea
                id="soundPrompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., An epic and suspenseful orchestral score with powerful drums..."
                rows={3}
                className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg pl-4 pr-12 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500 focus:border-amber-500 transition-all resize-none"
                disabled={isSuggesting || isGenerating}
            />
            <button
              onClick={getSuggestion}
              disabled={isSuggesting || isGenerating}
              className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-slate-400 hover:text-yellow-400 disabled:opacity-50"
              title="Get new suggestion"
            >
              {isSuggesting ? <SpinnerIcon /> : <MagicWandIcon />}
            </button>
          </div>
        </div>
        
        <button
          onClick={handleGenerateSound}
          disabled={isGenerating || isSuggesting || !prompt.trim()}
          className="w-full px-6 py-2.5 bg-orange-600 text-white font-bold rounded-lg btn-neon hover:bg-orange-500 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center space-x-2"
        >
          {isGenerating && <SpinnerIcon />}
          <span>{isGenerating ? 'Generating Score...' : 'Generate Score'}</span>
        </button>

        {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm" role="alert">
                {error}
            </div>
        )}

        {soundUrl && !isGenerating && (
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex items-center justify-between animate-fade-in">
            <p className="text-slate-300 font-semibold">Preview Score</p>
            <button onClick={togglePreview} className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-colors">
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-700/50">
        <button onClick={onBack} className="px-6 py-2 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 transition-colors">
          Back
        </button>
        <button
          onClick={handleAccept}
          disabled={!soundUrl || isGenerating}
          className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg btn-neon disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Finalize & Create Trailer
        </button>
      </div>
    </div>
  );
};

export default SoundDesign;