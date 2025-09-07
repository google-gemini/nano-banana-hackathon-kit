import React, { useState, useEffect, useRef } from 'react';
// FIX: The function generateMusicSuggestion does not exist. It has been replaced with generateCinematicScorePrompt.
import { generateCinematicScorePrompt } from '../services/geminiService';
import { UserInput } from '../types';

interface MusicSelectionProps {
  userInput: UserInput;
  onSelectMusic: (musicUrl: string) => void;
  onBack: () => void;
  // FIX: Added googleAiApiKey to props to allow calling the Gemini service.
  googleAiApiKey: string;
}

interface MusicTrack {
    name: string;
    style: 'Epic' | 'Suspense' | 'Emotional' | 'Action' | 'Synthwave' | 'Horror';
    url: string;
    artist: string;
}

const musicLibrary: MusicTrack[] = [
    { name: "Epic Trailer", style: "Epic", url: "https://storage.googleapis.com/web-stories-wp/1/2020/09/Epic-Trailer-Uplifting-02.mp3", artist: "Web Stories" },
    { name: "Dark Intro", style: "Suspense", url: "https://storage.googleapis.com/web-stories-wp/1/2020/09/Dark-and-Serious-Trailer-Intro-10-seconds.mp3", artist: "Web Stories" },
    { name: "Emotional Piano", style: "Emotional", url: "https://storage.googleapis.com/web-stories-wp/1/2020/09/Emotional-Piano-Uplifting.mp3", artist: "Web Stories" },
    { name: "Aggressive Trailer", style: "Action", url: "https://storage.googleapis.com/web-stories-wp/1/2020/09/Aggressive-and-Upbeat-Trailer.mp3", artist: "Web Stories" },
    { name: "80s Retro", style: "Synthwave", url: "https://storage.googleapis.com/web-stories-wp/1/2020/09/80s-Retro-Synthwave-Trailer.mp3", artist: "Web Stories" },
    { name: "Horror Effects", style: "Horror", url: "https://storage.googleapis.com/web-stories-wp/1/2020/09/Horror-Trailer-Sound-Effects.mp3", artist: "Web Stories" }
];

const MusicSelection: React.FC<MusicSelectionProps> = ({ userInput, onSelectMusic, onBack, googleAiApiKey }) => {
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack>(musicLibrary[0]);
  const [suggestion, setSuggestion] = useState<{style: string, description: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchSuggestion = async () => {
      setIsLoading(true);
      try {
        // FIX: Call the existing generateCinematicScorePrompt and handle its string output.
        const description = await generateCinematicScorePrompt(userInput.genre, userInput.sequelConcept, googleAiApiKey);
        
        let style: MusicTrack['style'] = 'Epic'; // Default style
        const lowerDesc = description.toLowerCase();

        if (lowerDesc.includes('action') || lowerDesc.includes('aggressive')) {
            style = 'Action';
        } else if (lowerDesc.includes('suspense') || lowerDesc.includes('tense')) {
            style = 'Suspense';
        } else if (lowerDesc.includes('emotional') || lowerDesc.includes('piano')) {
            style = 'Emotional';
        } else if (lowerDesc.includes('synthwave') || lowerDesc.includes('retro')) {
            style = 'Synthwave';
        } else if (lowerDesc.includes('horror') || lowerDesc.includes('dark')) {
            style = 'Horror';
        }

        const result = { style, description };
        setSuggestion(result);
        const suggestedTrack = musicLibrary.find(t => t.style === result.style) || musicLibrary[0];
        setSelectedTrack(suggestedTrack);
      } catch (error) {
        console.error("Failed to get music suggestion:", error);
        setSuggestion({style: 'Epic', description: 'Could not get AI suggestion. Using default track.'});
        setSelectedTrack(musicLibrary[0]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSuggestion();

    return () => { // Cleanup on unmount
        if (audioRef.current) {
            audioRef.current.pause();
        }
    }
  }, [userInput, googleAiApiKey]);

  const handleSelect = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onSelectMusic(selectedTrack.url);
  };

  const togglePreview = (track: MusicTrack) => {
    if (audioRef.current && isPlaying && audioRef.current.src === track.url) {
        audioRef.current.pause();
        setIsPlaying(false);
    } else {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        audioRef.current = new Audio(track.url);
        audioRef.current.volume = 0.3;
        audioRef.current.play().catch(e => {
            console.error("Error playing audio:", e)
            setIsPlaying(false);
        });
        setIsPlaying(true);
        setSelectedTrack(track);
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onerror = () => setIsPlaying(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-semibold text-cyan-300 mb-4 neon-glow-cyan">Phase 4: Select The Score 🔊</h2>
      <p className="text-slate-400 mb-8">The AI has suggested a musical style. Preview and select a track to set the mood for your trailer.</p>
      
       <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 mb-6">
            <h3 className="text-sm font-semibold text-slate-400">AI Music Supervisor</h3>
            {isLoading ? (
                 <div className="h-12 flex items-center">
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="text-slate-400">Analyzing script for musical theme...</span>
                </div>
            ) : suggestion && (
                <div>
                    <p className="text-lg font-bold text-yellow-400">{suggestion.style}</p>
                    <p className="text-slate-300 text-sm italic">"{suggestion.description}"</p>
                </div>
            )}
       </div>

      <div className="space-y-3">
        {musicLibrary.map((track) => {
            const isSelected = track.url === selectedTrack.url;
            const isPlayingThisTrack = isPlaying && audioRef.current?.src === track.url;
            return (
                <div 
                    key={track.name}
                    className={`p-3 rounded-lg flex items-center justify-between transition-all border-2 ${isSelected ? 'bg-slate-700/80 border-pink-500' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}
                >
                    <div>
                        <p className={`font-semibold ${isSelected ? 'text-pink-400' : 'text-slate-200'}`}>{track.name}</p>
                        <p className="text-xs text-slate-400">{track.style} - by {track.artist}</p>
                    </div>
                    <button onClick={() => togglePreview(track)} className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-colors">
                        {isPlayingThisTrack ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                        )}
                    </button>
                </div>
            );
        })}
      </div>

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-700/50">
        <button onClick={onBack} className="px-6 py-2 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 transition-colors">
          Back
        </button>
        <button onClick={handleSelect} className="px-6 py-2 bg-gradient-to-r from-pink-500 to-yellow-500 text-white font-bold rounded-lg btn-neon">
          Finalize & Create Trailer
        </button>
      </div>
    </div>
  );
};

export default MusicSelection;
