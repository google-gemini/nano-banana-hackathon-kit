import React from 'react';
import { SavedTrailer } from '../types';

interface GalleryViewProps {
  items: SavedTrailer[];
  onSelect: (item: SavedTrailer) => void;
  onBack: () => void;
}

const GalleryView: React.FC<GalleryViewProps> = ({ items, onSelect, onBack }) => {
  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-bold text-orange-400 mb-6 neon-glow-orange">My Saved Trailers</h2>
      
      {items.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-400">Your gallery is empty.</p>
            <p className="text-slate-500 text-sm mt-2">Create and save a trailer to see it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div 
              key={item.id} 
              className="group relative overflow-hidden rounded-lg shadow-lg cursor-pointer transform hover:-translate-y-1 transition-transform duration-300 border border-slate-700 hover:border-amber-500/50"
              onClick={() => onSelect(item)}
            >
              <img 
                src={`data:image/jpeg;base64,${item.trailerData.sceneImages[0]?.imageBase64}`} 
                alt={item.trailerData.title} 
                className="w-full h-96 object-cover object-center group-hover:scale-105 transition-transform duration-300" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-4 text-white">
                <h4 className="font-bold text-lg">{item.trailerData.title}</h4>
                <p className="text-sm text-slate-300">Based on "{item.userInput.movieTitle}"</p>
                <p className="text-xs text-slate-400 mt-2">By: {item.userInput.creatorName}</p>
                {item.trailerData.productionTime && (
                    <p className="text-xs text-amber-500 font-mono mt-1">Edition: {item.trailerData.productionTime}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
       <div className="flex justify-end mt-8 pt-6 border-t border-slate-700">
          <button
            onClick={onBack}
            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg btn-neon"
          >
            Create New Trailer
          </button>
        </div>
    </div>
  );
};

export default GalleryView;