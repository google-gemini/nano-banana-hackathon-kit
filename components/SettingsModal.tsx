import React, { useState, useEffect } from 'react';
import { ApiKeys } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (keys: ApiKeys) => void;
  currentKeys: ApiKeys;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentKeys }) => {
  const [keys, setKeys] = useState<ApiKeys>(currentKeys);

  useEffect(() => {
    if (isOpen) {
        setKeys(currentKeys);
    }
  }, [currentKeys, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(keys);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setKeys(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700/50 p-6 w-full max-w-md container-glow"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-orange-400">API Key Settings</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
        </div>
        <p className="text-sm text-slate-400 mb-6">
            Provide your API keys below. The Google AI key provided by the execution environment will always take priority over the one saved here.
        </p>
        
        <div className="space-y-4">
           <div>
              <label htmlFor="googleAI" className="block text-sm font-medium text-slate-300 mb-2">
                Google AI API Key
              </label>
              <input
                type="password"
                id="googleAI"
                name="googleAI"
                value={keys.googleAI}
                onChange={handleChange}
                placeholder="Enter your Google AI API key"
                className="w-full bg-slate-900 border-2 border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-amber-500 focus:border-amber-500 transition-all"
              />
           </div>
           <div>
              <label htmlFor="elevenLabs" className="block text-sm font-medium text-slate-300 mb-2">
                ElevenLabs API Key
              </label>
              <input
                type="password"
                id="elevenLabs"
                name="elevenLabs"
                value={keys.elevenLabs}
                onChange={handleChange}
                placeholder="Enter your ElevenLabs API key"
                className="w-full bg-slate-900 border-2 border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-amber-500 focus:border-amber-500 transition-all"
              />
           </div>
        </div>

        <div className="flex justify-end mt-6 pt-6 border-t border-slate-700/50 space-x-4">
             <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={handleSave}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg btn-neon"
            >
                Save Keys
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;