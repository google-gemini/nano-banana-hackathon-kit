import React, { useState, useEffect, useRef } from 'react';
import { AssemblyStatus, AssemblyTaskInfo } from '../types';

interface AssemblingViewProps {
    status: AssemblyStatus;
    startTime: number | null;
}

const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
};

const Spinner = () => (
    <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
);

const Arrow = () => (
    <div className="text-3xl text-slate-500 font-light mx-4 my-2 animate-pulse">&rarr;</div>
);

const ProductionMonitor: React.FC<{ task?: AssemblyTaskInfo }> = ({ task }) => {
    const renderContent = () => {
        switch (task?.type) {
            case 'vfx':
                return (
                    <>
                        <div className="flex-1 space-y-2 text-left w-full">
                            <h4 className="font-bold text-slate-300 text-sm">INPUT: IMAGE</h4>
                            {task.imageBase64 ? (
                                <img src={`data:image/jpeg;base64,${task.imageBase64}`} alt="Scene to animate" className="rounded-md w-full aspect-video object-cover" />
                            ) : <div className="rounded-md w-full aspect-video bg-slate-700/50"></div>}
                            <div className="h-16">
                                <p className="text-xs text-slate-400 font-semibold">VFX PROMPT:</p>
                                <p className="text-xs text-slate-300 h-12 overflow-y-auto pr-2" title={task.prompt}>
                                    "{task.prompt || '...'}"
                                </p>
                            </div>
                        </div>
                        <Arrow />
                        <div className="flex-1 space-y-2 text-left w-full">
                            <h4 className="font-bold text-slate-300 text-sm">OUTPUT: VIDEO CLIP</h4>
                            <div className="rounded-md w-full aspect-video bg-slate-900 flex items-center justify-center">
                                <Spinner />
                            </div>
                             <div className="h-16">
                                <p className="text-xs text-slate-400">
                                    {`Animating scene ${task.currentSceneIndex !== undefined ? task.currentSceneIndex + 1 : '...'}`}
                                </p>
                            </div>
                        </div>
                    </>
                );
            case 'audio':
                 return (
                    <>
                        <div className="flex-1 space-y-2 w-full text-left">
                            <h4 className="font-bold text-slate-300 text-sm">INPUT: SCRIPT & VOICE</h4>
                            <div className="rounded-md w-full aspect-video bg-slate-700/50 p-3 overflow-y-auto">
                               <p className="text-xs text-slate-400 font-bold mb-1">VOICE: {task.voiceName || '...'}</p>
                               <p className="text-xs text-slate-300 italic">"{task.prompt || '...'}"</p>
                            </div>
                        </div>
                        <Arrow />
                        <div className="flex-1 space-y-2 w-full text-left">
                             <h4 className="font-bold text-slate-300 text-sm">OUTPUT: AUDIO TRACK</h4>
                             <div className="rounded-md w-full aspect-video bg-slate-900 flex items-center justify-center">
                                <Spinner />
                            </div>
                        </div>
                    </>
                );
            case 'edit':
                 return (
                    <div className="w-full text-center">
                         <h4 className="font-bold text-slate-300 text-sm mb-4">EDITING BAY</h4>
                         <div className="flex justify-around items-center h-full">
                            <div className="space-y-1">
                                <p className="text-xs text-slate-400">SCENES TO CUT</p>
                                <p className="text-2xl font-retro text-amber-400">{task.sceneCount || '...'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-400">AUDIO DURATION</p>
                                <p className="text-2xl font-retro text-amber-400">{task.audioDuration?.toFixed(2) || '...'}s</p>
                            </div>
                         </div>
                    </div>
                );
            default:
                return (
                    <div className="w-full flex flex-col items-center justify-center h-full">
                        <Spinner />
                        <p className="text-slate-400 mt-4">Initializing Production...</p>
                    </div>
                );
        }
    };

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 h-full flex flex-col sm:flex-row items-center justify-around">
           {renderContent()}
        </div>
    );
};


const AssemblingView: React.FC<AssemblingViewProps> = ({ status, startTime }) => {
  const [elapsedTime, setElapsedTime] = useState('00:00.00');
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: number;
    if (startTime) {
        interval = window.setInterval(() => {
            setElapsedTime(formatTime(Date.now() - startTime));
        }, 50); // Update every 50ms for smooth milliseconds
    }
    return () => clearInterval(interval);
  }, [startTime]);
  
  useEffect(() => {
    // Auto-scroll logs
    if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [status.logs]);

  const progress = Math.round(status.progress);

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 text-center min-h-[400px] animate-fade-in w-full max-w-5xl">
      <h2 className="text-2xl font-retro text-orange-300 mb-2 neon-glow-orange">Production In Progress</h2>
      <p className="text-slate-400 mb-6">Your AI production team is hard at work. Here's the live feed from the set:</p>
      
      <div className="w-full mb-6">
        <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold text-slate-300">{status.stage}</span>
            <span className="text-lg font-retro text-amber-400">{progress}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
             <ProductionMonitor task={status.currentTaskInfo} />
        </div>
        <div className="lg:col-span-2 flex flex-col">
            <div ref={logContainerRef} className="flex-grow h-64 lg:h-[24rem] bg-black/50 rounded-lg border border-slate-700 p-3 text-left font-mono text-xs overflow-y-auto">
                {status.logs.map((log, index) => (
                    <div key={index} className="flex justify-between items-start text-slate-300 animate-fade-in leading-snug">
                        <p className="flex-grow pr-2"><span className="text-amber-500 mr-2">&gt;</span>{log.message}</p>
                        <time className="text-slate-500 flex-shrink-0">{log.timestamp}</time>
                    </div>
                ))}
            </div>
            {/* Clock */}
            <div className="mt-4 text-left">
                <div className="inline-block bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider text-center">Production Time</div>
                    <div className="text-lg font-retro text-amber-400">{elapsedTime}</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AssemblingView;
