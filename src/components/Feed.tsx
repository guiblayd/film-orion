import React, { useState } from 'react';
import { useStore } from '../store';
import { RecommendationCard } from './RecommendationCard';
import { cn } from '../lib/utils';

type Tab = 'descobrir' | 'circulo' | 'para-mim';

export function Feed() {
  const { recommendations, currentUser, connections } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('descobrir');

  const myConnectionIds = new Set(
    connections
      .filter(c => c.requester_id === currentUser.id || c.receiver_id === currentUser.id)
      .map(c => c.requester_id === currentUser.id ? c.receiver_id : c.requester_id)
  );

  const filtered = recommendations.filter(r => {
    const isOwn = r.from_user_id === currentUser.id || r.to_user_id === currentUser.id;
    const isConnection = myConnectionIds.has(r.from_user_id) || myConnectionIds.has(r.to_user_id);

    if (activeTab === 'para-mim') return r.to_user_id === currentUser.id;

    if (activeTab === 'circulo') {
      if (isOwn) return true;
      if (isConnection && r.visibility !== 'private') return true;
      return false;
    }

    // descobrir — conteúdo público global
    return r.visibility === 'public';
  });

  const emptyMessages: Record<Tab, string> = {
    descobrir: 'Nenhuma indicação pública ainda.',
    circulo:   'Nenhuma indicação no seu círculo ainda.',
    'para-mim': 'Nenhuma indicação para você ainda.',
  };

  return (
    <div className="max-w-md mx-auto bg-zinc-950 min-h-screen pb-20">
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 sticky top-0 z-10">
        <div className="px-4 py-3">
          <h1 className="text-xl font-black tracking-tight text-zinc-100">FilmOrion</h1>
        </div>
        <div className="flex border-t border-zinc-800/40">
          <TabButton active={activeTab === 'descobrir'} onClick={() => setActiveTab('descobrir')}>
            Descobrir
          </TabButton>
          <TabButton active={activeTab === 'circulo'} onClick={() => setActiveTab('circulo')}>
            Círculo
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
            {emptyMessages[activeTab]}
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
