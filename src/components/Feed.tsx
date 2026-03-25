import React, { useState } from 'react';
import { useStore } from '../store';
import { RecommendationCard } from './RecommendationCard';
import { cn } from '../lib/utils';

type Tab = 'todos' | 'para-mim';

export function Feed() {
  const { recommendations, currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('todos');

  const filtered = activeTab === 'para-mim'
    ? recommendations.filter(r => r.to_user_id === currentUser.id)
    : recommendations;

  return (
    <div className="max-w-md mx-auto bg-zinc-950 min-h-screen pb-20">
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 sticky top-0 z-10">
        <div className="px-4 py-3">
          <h1 className="text-xl font-black tracking-tight text-zinc-100">Indica</h1>
        </div>
        <div className="flex border-t border-zinc-800/40">
          <TabButton active={activeTab === 'todos'} onClick={() => setActiveTab('todos')}>
            Todos
          </TabButton>
          <TabButton active={activeTab === 'para-mim'} onClick={() => setActiveTab('para-mim')}>
            Para mim
          </TabButton>
        </div>
      </header>

      <div className="flex flex-col">
        {filtered.map(rec => (
          <RecommendationCard key={rec.id} recommendation={rec} />
        ))}
        {filtered.length === 0 && (
          <div className="p-10 text-center text-zinc-600 text-sm">
            {activeTab === 'para-mim' ? 'Nenhuma indicação para você ainda.' : 'Nenhuma indicação ainda.'}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 py-2.5 text-xs font-bold border-b-2 transition-colors",
        active ? "border-zinc-100 text-zinc-100" : "border-transparent text-zinc-500 hover:text-zinc-300"
      )}
    >
      {children}
    </button>
  );
}
