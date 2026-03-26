import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Sparkles } from 'lucide-react';
import { useStore } from '../store';
import { RecommendationCard } from './RecommendationCard';
import { cn } from '../lib/utils';
import { fetchRecommendationCards, RecommendationCardData } from '../services/recommendations';

type Tab = 'descobrir' | 'circulo' | 'para-mim';

export function Feed() {
  const { currentUser, connections, users, onboardingPreferences } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('descobrir');
  const [cards, setCards] = useState<RecommendationCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser.id || users.length === 0) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const data = await fetchRecommendationCards(users);
      if (!cancelled) {
        setCards(data);
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [currentUser.id, users]);

  const myConnectionIds = useMemo(() => new Set(
    connections
      .filter(connection => connection.requester_id === currentUser.id || connection.receiver_id === currentUser.id)
      .map(connection => connection.requester_id === currentUser.id ? connection.receiver_id : connection.requester_id)
  ), [connections, currentUser.id]);

  const filtered = cards.filter(card => {
    const { recommendation } = card;
    const isOwn = recommendation.from_user_id === currentUser.id || recommendation.to_user_id === currentUser.id;
    const isConnection =
      myConnectionIds.has(recommendation.from_user_id) ||
      myConnectionIds.has(recommendation.to_user_id);

    if (activeTab === 'para-mim') return recommendation.to_user_id === currentUser.id;
    if (activeTab === 'circulo') return isOwn || (isConnection && recommendation.visibility !== 'private');
    return recommendation.visibility === 'public';
  });

  const emptyMessages: Record<Tab, string> = {
    descobrir: 'Nenhuma indicação pública ainda.',
    circulo: 'Nenhuma indicação no seu círculo ainda.',
    'para-mim': 'Nenhuma indicação para você ainda.',
  };

  return (
    <div className="max-w-md mx-auto bg-zinc-950 min-h-screen pb-20 lg:max-w-none lg:px-6">
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 sticky top-0 z-10 lg:max-w-3xl lg:mx-auto">
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

      <div className="flex flex-col lg:max-w-3xl lg:mx-auto lg:mt-4">
        {connections.length === 0 && (
          <div className="border-b border-zinc-800/50 p-4 lg:px-0 lg:py-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-zinc-100/10 p-2 text-zinc-100 lg:bg-transparent lg:p-0">
                <Sparkles size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-zinc-100">Seu feed melhora muito com primeiros sinais.</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                  {onboardingPreferences
                    ? 'Voce ja salvou seu gosto inicial. Agora vale seguir alguns perfis para destravar o circulo.'
                    : 'Personalize seus gostos e siga algumas pessoas para destravar recomendacoes mais certeiras.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to="/explore" className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-950">
                    <Compass size={14} />
                    Abrir Explore
                  </Link>
                  <Link to={`/profile/${currentUser.id}`} className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-200">
                    Ver perfil
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        {loading && (
          <div className="p-10 text-center text-zinc-600 text-sm">
            Carregando indicações...
          </div>
        )}
        {!loading && filtered.map(card => (
          <RecommendationCard key={card.recommendation.id} card={card} />
        ))}
        {!loading && filtered.length === 0 && (
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
        'flex-1 py-2.5 text-xs font-bold border-b-2 transition-colors',
        active ? 'border-zinc-100 text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-300'
      )}
    >
      {children}
    </button>
  );
}
