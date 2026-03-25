import React from 'react';
import { useStore } from '../store';
import { RecommendationCard } from './RecommendationCard';

export function Feed() {
  const { recommendations } = useStore();

  return (
    <div className="max-w-md mx-auto bg-zinc-950 min-h-screen pb-20">
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 sticky top-0 z-10 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tight text-zinc-100">Indica</h1>
      </header>
      
      <div className="flex flex-col">
        {recommendations.map(rec => (
          <RecommendationCard key={rec.id} recommendation={rec} />
        ))}
        {recommendations.length === 0 && (
          <div className="p-8 text-center text-zinc-500">
            Nenhuma indicação ainda.
          </div>
        )}
      </div>
    </div>
  );
}
