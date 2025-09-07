import React, { useState, useEffect } from 'react';

const messages = [
  "Contacting scriptwriting AI...",
  "Analyzing your concept...",
  "Brainstorming sequel titles...",
  "Drafting the narrative...",
  "Outlining key scenes...",
  "Polishing the dialogue...",
];

const ScriptwritingView: React.FC = () => {
  const [currentMessage, setCurrentMessage] = useState(messages[0]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setCurrentMessage(messages[index]);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
      <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-6"></div>
      <h2 className="text-2xl font-retro text-orange-300 mb-4 neon-glow-orange">Writing The Script</h2>
      <p className="text-slate-400 mb-6 transition-opacity duration-500">{currentMessage}</p>
    </div>
  );
};

export default ScriptwritingView;
