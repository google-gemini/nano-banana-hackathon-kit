import React, { useState } from 'react';
import { CharacterSettings } from '../types';
import { generateRandomSuggestion } from '../services/geminiService';

interface CharacterInputProps {
  onSubmit: (settings: CharacterSettings) => void;
  onBack: () => void;
  googleAiApiKey: string;
}

const MAX_PROMPT_LENGTH = 200;

const MagicWandIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3.568 2.568A.75.75 0 014.25 2h1.569a.75.75 0 01.682.432l.5 1.001a.75.75 0 001.364 0l.5-1.001A.75.75 0 019.568 2h1.57a.75.75 0 01.682.432l.5 1.001a.75.75 0 001.364 0l.5-1.001a.75.75 0 01.682-.432h1.569a.75.75 0 01.593 1.156l-3.044 4.87a.75.75 0 000 .848l3.044 4.87a.75.75 0 01-.593 1.156h-1.569a.75.75 0 01-.682-.432l-.5-1.001a.75.75 0 00-1.364 0l-.5 1.001a.75.75 0 01-.682.432h-1.57a.75.75 0 01-.682-.432l-.5-1.001a.75.75 0 00-1.364 0l-.5 1.001a.75.75 0 01-.682.432H4.25a.75.75 0 01-.593-1.156l3.044-4.87a.75.75 0 000-.848L3.659 3.724A.75.75 0 013.568 2.568z" clipRule="evenodd" />
    </svg>
);

const SpinnerIcon = () => (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const CharacterInput: React.FC<CharacterInputProps> = ({ onSubmit, onBack, googleAiApiKey }) => {
  const [characterPrompt, setCharacterPrompt] = useState('');
  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState('');
  const [clothing, setClothing] = useState('');
  const [isRandomizing, setIsRandomizing] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (characterPrompt.trim()) {
      onSubmit({ characterPrompt, age, occupation, clothing });
    }
  };

  const handleRandomize = async () => {
    setIsRandomizing(true);
    try {
        const suggestionJson = await generateRandomSuggestion('character', googleAiApiKey);
        const suggestion = JSON.parse(suggestionJson);
        setCharacterPrompt(suggestion.characterPrompt || '');
        setAge(suggestion.age || '');
        setOccupation(suggestion.occupation || '');
        setClothing(suggestion.clothing || '');
    } catch (error) {
        console.error(`Failed to generate suggestion for character:`, error);
        setCharacterPrompt("A mysterious hero with a hidden power"); // Fallback
    } finally {
        setIsRandomizing(false);
    }
  };

  return (
    <div className="animate-fade-in">
        <h2 className="text-2xl font-retro text-orange-400 mb-4 neon-glow-orange tracking-tighter">Character [ 👤 ]</h2>
        <p className="text-slate-400 mb-6">Describe the main character for your sequel. You can be descriptive (e.g., "a grizzled space marine with a robotic eye") or name a real person (e.g., "Keanu Reeves"). This will guide the visual style.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="characterPrompt" className="block text-sm font-medium text-slate-300">
                  Character Description
                </label>
                <span className="text-xs text-slate-500">{characterPrompt.length}/{MAX_PROMPT_LENGTH}</span>
              </div>
              <div className="flex items-start space-x-2">
                <button type="button" onClick={handleRandomize} disabled={isRandomizing} className="p-2 mt-1 text-slate-400 hover:text-yellow-400 disabled:opacity-50">
                    {isRandomizing ? <SpinnerIcon /> : <MagicWandIcon />}
                </button>
                <textarea
                    id="characterPrompt"
                    value={characterPrompt}
                    onChange={(e) => setCharacterPrompt(e.target.value)}
                    placeholder="e.g., A photo of Zendaya as a futuristic desert warrior"
                    rows={3}
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500 focus:border-amber-500 transition-all resize-none"
                    required
                    maxLength={MAX_PROMPT_LENGTH}
                />
              </div>
            </div>

            {/* Optional Details */}
            <div className="pt-4 space-y-4">
                 <h3 className="text-lg font-medium text-slate-300 border-b border-slate-700 pb-2">Optional Details</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="age" className="block text-xs font-medium text-slate-400 mb-1">Age</label>
                        <input type="text" id="age" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g., late 20s" className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"/>
                    </div>
                     <div>
                        <label htmlFor="occupation" className="block text-xs font-medium text-slate-400 mb-1">Occupation</label>
                        <input type="text" id="occupation" value={occupation} onChange={e => setOccupation(e.target.value)} placeholder="e.g., Rogue Pilot" className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"/>
                    </div>
                     <div>
                        <label htmlFor="clothing" className="block text-xs font-medium text-slate-400 mb-1">Clothing Style</label>
                        <input type="text" id="clothing" value={clothing} onChange={e => setClothing(e.target.value)} placeholder="e.g., Cyberpunk gear" className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"/>
                    </div>
                 </div>
            </div>

            <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-700/50">
                <button
                    type="button"
                    onClick={onBack}
                    className="px-6 py-2 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 transition-colors"
                >
                    Back
                </button>
                <button
                    type="submit"
                    disabled={!characterPrompt.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg btn-neon disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next: Storyboard
                </button>
            </div>
        </form>
    </div>
  );
};

export default CharacterInput;