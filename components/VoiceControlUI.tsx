import React from 'react';

interface VoiceControlUIProps {
  isListening: boolean;
  onToggleListen: () => void;
  isSupported: boolean;
}

const VoiceControlUI: React.FC<VoiceControlUIProps> = ({ isListening, onToggleListen, isSupported }) => {
  if (!isSupported) {
    return null; // Don't render if not supported
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={onToggleListen}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg
                    ${isListening ? 'bg-red-500' : 'bg-cyan-500 hover:bg-cyan-400'}`}
        aria-label={isListening ? 'Stop voice control' : 'Start voice control'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>
      {isListening && (
        <>
            <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping -z-10 opacity-75"></div>
            <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-red-500/50 rounded-full -translate-x-1/2 -translate-y-1/2 -z-10"></div>
        </>
      )}
    </div>
  );
};

export default VoiceControlUI;
