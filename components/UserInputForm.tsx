import React, { useState } from 'react';
import { UserInput } from '../types';
import { generateRandomSuggestion } from '../services/geminiService';

interface UserInputFormProps {
  onSubmit: (data: UserInput) => void;
  googleAiApiKey: string;
}

const genres = ['Action', 'Sci-Fi', 'Horror', 'Comedy', 'Drama', 'Fantasy'];
const MAX_MOVIE_TITLE_LENGTH = 80;
const MAX_CONCEPT_LENGTH = 150;
const MAX_CREATOR_NAME_LENGTH = 50;


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

const UserInputForm: React.FC<UserInputFormProps> = ({ onSubmit, googleAiApiKey }) => {
  const [movieTitle, setMovieTitle] = useState('');
  const [sequelConcept, setSequelConcept] = useState('');
  const [genre, setGenre] = useState(genres[0]);
  const [creatorName, setCreatorName] = useState('');
  const [isRandomizing, setIsRandomizing] = useState<'movie' | 'concept' | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (movieTitle.trim() && sequelConcept.trim() && creatorName.trim()) {
      onSubmit({ movieTitle, sequelConcept, genre, language: 'English', creatorName });
    }
  };

  const handleRandomize = async (fieldType: 'movie' | 'concept') => {
    setIsRandomizing(fieldType);
    try {
        const suggestion = await generateRandomSuggestion(fieldType, googleAiApiKey);
        if (fieldType === 'movie') {
            setMovieTitle(suggestion);
        } else {
            setSequelConcept(suggestion);
        }
    } catch (error) {
        console.error(`Failed to generate suggestion for ${fieldType}:`, error);
    } finally {
        setIsRandomizing(null);
    }
  };


  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-retro text-orange-400 mb-4 neon-glow-orange tracking-tighter">The Pitch [ ✒️ ]</h2>
      <p className="text-slate-400 mb-6">Provide the core elements of your movie sequel. What's the original film, its genre, and your concept for the next chapter?</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Genre Selector */}
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Genre</label>
            <div className="flex flex-wrap gap-2">
                {genres.map(g => (
                    <button
                        key={g}
                        type="button"
                        onClick={() => setGenre(g)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border-2 ${genre === g ? 'bg-amber-500 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 hover:border-amber-500/50 hover:text-amber-400'}`}
                    >
                        {g}
                    </button>
                ))}
            </div>
        </div>

        {/* Creator Name Input */}
        <div>
            <div className="flex justify-between items-center mb-2">
                <label htmlFor="creatorName" className="block text-sm font-medium text-slate-300">
                Creator Name
                </label>
                <span className="text-xs text-slate-500">{creatorName.length}/{MAX_CREATOR_NAME_LENGTH}</span>
            </div>
            <input
                type="text"
                id="creatorName"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                placeholder="e.g., Your Name or Pseudonym"
                className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500 focus:border-amber-500 transition-all"
                required
                maxLength={MAX_CREATOR_NAME_LENGTH}
            />
        </div>

        {/* Movie Title Input */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="movieTitle" className="block text-sm font-medium text-slate-300">
              Original Movie Title
            </label>
            <span className="text-xs text-slate-500">{movieTitle.length}/{MAX_MOVIE_TITLE_LENGTH}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button type="button" onClick={() => handleRandomize('movie')} disabled={!!isRandomizing} className="p-2 text-slate-400 hover:text-yellow-400 disabled:opacity-50">
              {isRandomizing === 'movie' ? <SpinnerIcon /> : <MagicWandIcon />}
            </button>
            <input
                type="text"
                id="movieTitle"
                value={movieTitle}
                onChange={(e) => setMovieTitle(e.target.value)}
                placeholder="e.g., Blade Runner"
                className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500 focus:border-amber-500 transition-all"
                required
                maxLength={MAX_MOVIE_TITLE_LENGTH}
            />
          </div>
        </div>
        
        {/* Sequel Concept Input */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="sequelConcept" className="block text-sm font-medium text-slate-300">
              Sequel Concept
            </label>
            <span className="text-xs text-slate-500">{sequelConcept.length}/{MAX_CONCEPT_LENGTH}</span>
          </div>
           <div className="flex items-start space-x-2">
             <button type="button" onClick={() => handleRandomize('concept')} disabled={!!isRandomizing} className="p-2 mt-1 text-slate-400 hover:text-yellow-400 disabled:opacity-50">
              {isRandomizing === 'concept' ? <SpinnerIcon /> : <MagicWandIcon />}
            </button>
            <textarea
                id="sequelConcept"
                value={sequelConcept}
                onChange={(e) => setSequelConcept(e.target.value)}
                placeholder="e.g., A rogue replicant becomes a detective in the off-world colonies."
                rows={3}
                className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500 focus:border-amber-500 transition-all resize-none"
                required
                maxLength={MAX_CONCEPT_LENGTH}
            />
          </div>
        </div>

        <div className="flex justify-end items-center pt-6 border-t border-slate-700/50">
          <button
            type="submit"
            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg btn-neon disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!movieTitle.trim() || !sequelConcept.trim() || !creatorName.trim()}
          >
            Next: Script
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserInputForm;