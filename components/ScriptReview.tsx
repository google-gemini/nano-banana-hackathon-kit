import React, { useState } from 'react';
import { TrailerData } from '../types';

interface ScriptReviewProps {
  trailerData: Omit<TrailerData, 'sceneImages'>;
  onAccept: (editedNarrative: string, editedKeyScenes: string[]) => void;
  onBack: () => void;
  error?: string | null;
}

const ScriptReview: React.FC<ScriptReviewProps> = ({ trailerData, onAccept, onBack, error }) => {
  const [narrative, setNarrative] = useState(trailerData.narrative);
  const [keyScenes, setKeyScenes] = useState(trailerData.keyScenes.join('\n'));

  const handleAccept = () => {
    const scenesArray = keyScenes.split('\n').map(s => s.trim()).filter(Boolean);
    if (narrative.trim() && scenesArray.length > 0) {
      onAccept(narrative, scenesArray);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-retro text-orange-400 mb-2 neon-glow-orange tracking-tighter">Script Review [ ✒️ ]</h2>
      <p className="text-slate-400 mb-6">The AI has generated a script. Review and edit the voiceover and key scenes below to match your vision.</p>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6" role="alert">
            <p className="font-bold">Script Generation Failed</p>
            <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Sequel Title: <span className="text-yellow-400">{trailerData.title}</span></h3>
        </div>
        <div>
          <label htmlFor="narrative" className="block text-sm font-medium text-slate-300 mb-2">
            Voiceover Script
          </label>
          <textarea
            id="narrative"
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            rows={5}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-amber-500 focus:border-amber-500 transition-shadow"
          />
        </div>
        <div>
          <label htmlFor="keyScenes" className="block text-sm font-medium text-slate-300 mb-2">
            Key Scenes (one per line)
          </label>
          <textarea
            id="keyScenes"
            value={keyScenes}
            onChange={(e) => setKeyScenes(e.target.value)}
            rows={6}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-amber-500 focus:border-amber-500 transition-shadow"
          />
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
          type="button"
          onClick={handleAccept}
          disabled={!narrative.trim() || !keyScenes.trim()}
          className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg btn-neon disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Character
        </button>
      </div>
    </div>
  );
};

export default ScriptReview;
