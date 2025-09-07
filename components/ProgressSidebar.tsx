import React from 'react';
import { AppStep } from '../types';

interface ProgressSidebarProps {
  currentStep: AppStep;
}

const steps = [
    { id: '[ ✒️ ] Pitch', steps: [AppStep.INPUT, AppStep.SCRIPT_GENERATION, AppStep.SCRIPT_REVIEW] },
    { id: '[ 👤 ] Character', steps: [AppStep.CHARACTER_INPUT] },
    { id: '[ 🎞️ ] Storyboard', steps: [AppStep.IMAGE_REVIEW] },
    { id: '[ 🎧 ] Sound', steps: [AppStep.SOUND_DESIGN] },
    { id: '[ ⚙️ ] Render', steps: [AppStep.VIDEO_GENERATION, AppStep.ASSEMBLING] },
    { id: '[ 🎬 ] Final Cut', steps: [AppStep.RESULT] },
    { id: '[ ⬛ ] Gallery', steps: [AppStep.GALLERY] }
];

const ProgressSidebar: React.FC<ProgressSidebarProps> = ({ currentStep }) => {
  
  const isStepActive = (step: typeof steps[0]) => {
    return step.steps.includes(currentStep);
  };

  const isStepCompleted = (step: typeof steps[0]) => {
      const highestIndexInStep = Math.max(...step.steps);
      return currentStep > highestIndexInStep;
  }

  return (
    <aside className="hidden md:block p-4 sticky top-8 self-start">
        <nav>
            <ul className="space-y-4">
                {steps.map((step, index) => {
                    const isActive = isStepActive(step);
                    const isCompleted = isStepCompleted(step);
                    
                    return (
                        <li key={step.id} className="flex items-center space-x-3">
                           <div className="flex flex-col items-center">
                             <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                ${isActive ? 'bg-orange-500 ring-4 ring-orange-500/30' : ''}
                                ${isCompleted ? 'bg-amber-500' : ''}
                                ${!isActive && !isCompleted ? 'bg-slate-700' : ''}
                             `}>
                                 {isCompleted && !isActive && (
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-900" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                     </svg>
                                 )}
                             </div>
                             {index < steps.length - 1 && <div className={`w-0.5 h-6 mt-1 transition-colors ${isCompleted ? 'bg-amber-500' : 'bg-slate-700'}`}></div>}
                           </div>
                           <span className={`font-semibold transition-colors ${isActive ? 'text-orange-400' : isCompleted ? 'text-amber-400' : 'text-slate-500'}`}>{step.id}</span>
                        </li>
                    )
                })}
            </ul>
        </nav>
    </aside>
  );
};

export default ProgressSidebar;