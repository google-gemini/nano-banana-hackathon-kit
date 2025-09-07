import React from 'react';
import { TrailerData, UserInput } from '../types';

interface ResultViewProps {
  trailerData: TrailerData;
  userInput: UserInput;
  onRestart: () => void;
  onSave: () => void;
  onGallery: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ trailerData, userInput, onRestart, onSave, onGallery }) => {

  const handleShare = async () => {
    if (!trailerData.videoUrl) {
      alert("Video not available for sharing.");
      return;
    }

    try {
      // Fetch the video blob from its URL
      const response = await fetch(trailerData.videoUrl);
      const videoBlob = await response.blob();
      const videoFile = new File([videoBlob], `${trailerData.title}.webm`, { type: videoBlob.type });

      const shareData = {
        files: [videoFile],
        title: `TrailerCraft AI: ${trailerData.title}`,
        text: `Check out my AI-generated trailer for "${userInput.movieTitle}": ${trailerData.title}! Created with #TrailerCraftAI.`,
      };

      // Check if the browser supports sharing files
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support file sharing
        throw new Error("File sharing not supported by this browser.");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      // Fallback: download the file
      try {
        const a = document.createElement('a');
        a.href = trailerData.videoUrl;
        a.download = `${trailerData.title}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (downloadError) {
        console.error("Download fallback failed:", downloadError);
        alert("Sharing failed. You can try downloading the video from your gallery.");
      }
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
        <div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">{trailerData.title}</h2>
            <p className="text-lg text-slate-400">A sequel concept for: {userInput.movieTitle}</p>
            <p className="text-md text-slate-500">A concept by: {userInput.creatorName}</p>
            {trailerData.productionTime && (
                <p className="text-sm text-amber-400 font-mono mt-1">Edition: {trailerData.productionTime}</p>
            )}
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Media Player Section */}
        <div className="lg:col-span-2 bg-black rounded-lg shadow-lg flex flex-col items-center justify-center relative aspect-video border border-slate-700 overflow-hidden">
            {trailerData.videoUrl ? (
                <video src={trailerData.videoUrl} controls autoPlay loop className="w-full h-full object-cover"></video>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                    <p className="text-slate-400">Video not available for this saved trailer. Re-generate to view the video.</p>
                </div>
            )}
        </div>

        {/* Narrative and Citations */}
        <div className="lg:col-span-1 bg-slate-800/50 p-4 rounded-lg max-h-[calc(100vh-20rem)] lg:max-h-[35rem] overflow-y-auto border border-slate-700">
            <h3 className="text-xl font-semibold text-orange-400 border-b border-slate-700 pb-2 mb-3">Voiceover Script</h3>
            <p className="text-slate-300 whitespace-pre-wrap font-serif leading-relaxed text-sm">
              {trailerData.narrative}
            </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-slate-700">
        <div className="flex space-x-2 mb-4 sm:mb-0">
            <button
                onClick={onSave}
                className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors text-sm font-semibold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3.13L5 18V4z" />
              </svg>
              <span>Save & View Gallery</span>
            </button>
             <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors text-sm font-semibold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.875-5.059l-4.94-2.47a3.027 3.027 0 00-.001-1.078l4.94-2.47A3 3 0 0015 8z" />
              </svg>
              <span>Share</span>
            </button>
        </div>
        <button
            onClick={onRestart}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg btn-neon"
        >
          Create Another Trailer
        </button>
      </div>
    </div>
  );
};

export default ResultView;