import React, { useState } from 'react';
import { SceneImage } from '../types';
import { generateImagePromptVariation } from '../services/geminiService';

interface ImageReviewProps {
  images: SceneImage[];
  characterPrompt: string;
  onRegenerate: (index: number, customPrompt?: string) => void;
  onEdit: (index: number, editPrompt: string) => void;
  onAccept: () => void;
  onBack: () => void;
  error?: string | null;
  googleAiApiKey: string;
}

const RegenerateIcon = () => <span>[ 🔄 ]</span>;
const EditIcon = () => <span>[ ✏️ ]</span>;
const MagicWandIcon = () => <span>[ 🪄 ]</span>;
const SpinnerIcon = () => (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const ImageReview: React.FC<ImageReviewProps> = ({ images, characterPrompt, onRegenerate, onEdit, onAccept, onBack, error, googleAiApiKey }) => {
  const [activeAction, setActiveAction] = useState<{ type: 'edit' | 'regen', index: number } | null>(null);
  const [promptText, setPromptText] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const handleStartAction = (type: 'edit' | 'regen', index: number) => {
    setActiveAction({ type, index });
    setPromptText(type === 'regen' ? images[index].scene : '');
  };

  const handleCancelAction = () => {
    setActiveAction(null);
    setPromptText('');
  };

  const handleSubmitAction = () => {
    if (!activeAction) return;
    const { type, index } = activeAction;
    if (type === 'regen') {
        onRegenerate(index, promptText);
    } else {
        onEdit(index, promptText);
    }
    handleCancelAction();
  };
  
  const handleSuggestPrompt = async () => {
    if (!activeAction || activeAction.type !== 'regen') return;
    setIsSuggesting(true);
    try {
      const newPrompt = await generateImagePromptVariation(images[activeAction.index].scene, characterPrompt, googleAiApiKey);
      setPromptText(newPrompt);
    } catch (err) {
      console.error("Failed to suggest prompt variation:", err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const allImagesDone = images.every(img => img.status === 'done');

  const renderActionUI = (index: number) => {
    if (!activeAction || activeAction.index !== index) return null;
    
    const isRegen = activeAction.type === 'regen';

    return (
        <div className="w-full h-full bg-slate-900/95 p-2 flex flex-col justify-between text-xs absolute inset-0 z-20">
            <div>
                <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-300">{isRegen ? 'Regenerate Prompt:' : 'Edit Prompt:'}</label>
                    {isRegen && (
                        <button onClick={handleSuggestPrompt} disabled={isSuggesting} className="text-yellow-400 disabled:opacity-50" title="Suggest Variation">
                            {isSuggesting ? <SpinnerIcon /> : <MagicWandIcon />}
                        </button>
                    )}
                </div>
                <textarea 
                    value={promptText} 
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder={isRegen ? "Describe a new scene..." : "e.g., Make it nighttime, add a helmet..."}
                    className="w-full h-24 bg-slate-800 border border-slate-600 rounded p-1 mt-1 text-white text-[10px] resize-none" 
                />
            </div>
            <div className="flex justify-around mt-1">
                <button onClick={handleCancelAction} className="px-2 py-1 bg-slate-600 rounded">Cancel</button>
                <button onClick={handleSubmitAction} disabled={!promptText.trim()} className="px-2 py-1 bg-orange-600 rounded disabled:opacity-50">
                    {isRegen ? 'Regen' : 'Edit'}
                </button>
            </div>
        </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-retro text-orange-400 mb-2 neon-glow-orange tracking-tighter">Storyboard [ 🎞️ ]</h2>
      <p className="text-slate-400 mb-6">Review the AI-generated storyboard. You can edit the prompt and regenerate any image, or make small changes to an existing image.</p>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6" role="alert">
            <p className="font-bold">Image Generation Failed</p>
            <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((img, index) => (
          <div key={index} className="group relative aspect-video bg-slate-900 rounded-lg overflow-hidden border-2 border-slate-700 flex items-center justify-center">
            {renderActionUI(index)}
            {img.status === 'generating' && (
              <div className="flex flex-col items-center text-slate-400">
                <SpinnerIcon />
                <span className="text-xs mt-2">Generating...</span>
              </div>
            )}
            {img.status === 'error' && (
              <div className="text-center text-red-400 p-2">
                  <p className="font-bold text-sm">Error</p>
                  <p className="text-xs">Could not generate.</p>
              </div>
            )}
            {img.status === 'done' && img.imageBase64 && (
              <img src={`data:image/jpeg;base64,${img.imageBase64}`} alt={`Scene ${index + 1}`} className="w-full h-full object-cover"/>
            )}
            
            {img.status !== 'generating' && !activeAction && (
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 z-10">
                <p className="text-white text-center text-xs font-semibold mb-3">Scene {index + 1}</p>
                <div className="flex space-x-2">
                    <button
                      onClick={() => handleStartAction('edit', index)}
                      className="px-3 py-1.5 bg-slate-700/80 text-white rounded-full text-xs font-bold flex items-center space-x-1 hover:bg-amber-600/80 transition-colors"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => handleStartAction('regen', index)}
                      className="px-3 py-1.5 bg-slate-700/80 text-white rounded-full text-xs font-bold flex items-center space-x-1 hover:bg-orange-600/80 transition-colors"
                    >
                      <RegenerateIcon />
                    </button>
                </div>
              </div>
            )}
          </div>
        ))}
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
          onClick={onAccept}
          disabled={!allImagesDone}
          className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg btn-neon disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Design Sound
        </button>
      </div>
    </div>
  );
};

export default ImageReview;