import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: () => void;
  onOpenSettings: () => void;
}

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const InfoModal: React.FC<{onClose: () => void}> = ({ onClose }) => (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700/50 p-6 w-full max-w-sm text-center container-glow"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest">A</h3>
        <h2 className="text-2xl font-semibold text-slate-200 mt-1">Tuesday Cinema Club</h2>
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest">Presentation</h3>
        <button
            onClick={onClose}
            className="mt-6 w-full px-5 py-2 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 transition-colors text-sm"
        >
            Close
        </button>
      </div>
    </div>
);

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onOpenSettings }) => {
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-full text-center animate-fade-in p-4 w-full">
       <div className="absolute bottom-6 left-6 z-10 flex space-x-2">
        <button
          onClick={() => setIsInfoOpen(true)}
          className="p-3 bg-slate-800/50 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/70 transition-colors"
          aria-label="Information"
        >
          <InfoIcon />
        </button>
        <button
          onClick={onOpenSettings}
          className="p-3 bg-slate-800/50 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/70 transition-colors"
          aria-label="API Key Settings"
        >
          <SettingsIcon />
        </button>
      </div>

      <div className="max-w-3xl">
        <h1 className="text-5xl md:text-6xl font-retro text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-400 neon-glow leading-relaxed">
          TrailerCraft AI
        </h1>
        <p className="mt-6 text-lg md:text-xl text-slate-300">
          Your Personal A.I. Movie Sequel Generator.
        </p>
        <p className="mt-2 text-slate-400 max-w-lg mx-auto">
          Imagine the next chapter for any movie. Create a custom character and let a team of AI agents generate a unique trailer concept for you.
        </p>
        <div className="mt-12 flex justify-center">
            <button
                onClick={onLogin}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg text-lg btn-neon"
            >
                Start Creating
            </button>
        </div>
      </div>
      {isInfoOpen && <InfoModal onClose={() => setIsInfoOpen(false)} />}
    </div>
  );
};

export default LoginPage;