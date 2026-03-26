import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

    void load();
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
    <div className="mx-auto min-h-screen max-w-md bg-zinc-950 pb-20 lg:max-w-none lg:pb-10">
      <header className="sticky top-0 z-10 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl lg:static lg:border-b-0 lg:bg-transparent lg:backdrop-blur-none">
        <div className="px-4 py-3 lg:px-0 lg:py-0">
          <p className="hidden text-[11px] uppercase tracking-[0.22em] text-zinc-500 lg:block">Feed</p>
          <div className="lg:mt-3 lg:flex lg:items-end lg:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-100 lg:text-[32px] lg:leading-tight">FilmOrion</h1>
              <p className="hidden max-w-2xl text-sm leading-relaxed text-zinc-500 lg:mt-2 lg:block">
                Acompanhe o que está circulando no catálogo aberto, no seu círculo e nas indicações feitas para você.
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-t border-zinc-800/40 lg:mt-6 lg:border-t-0 lg:border-b lg:border-zinc-800/50">
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

      <div className="flex flex-col lg:max-w-[860px] lg:pr-6">
        {connections.length === 0 && (
          <div className="border-b border-zinc-800/50 px-4 py-4 lg:px-0 lg:py-6">
            <p className="text-sm font-medium text-zinc-100 lg:text-base">Seu feed melhora bastante com contexto.</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
              {onboardingPreferences
                ? 'Seu gosto inicial já está salvo. Agora vale seguir alguns perfis para abrir melhor o seu círculo.'
                : 'Personalize seus gostos e siga algumas pessoas para receber recomendações mais certeiras.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-5 text-sm">
              <Link to="/explore" className="font-medium text-zinc-200 transition-colors hover:text-white">
                Abrir explorar
              </Link>
              <Link to={`/profile/${currentUser.id}`} className="text-zinc-500 transition-colors hover:text-zinc-300">
                Ver perfil
              </Link>
            </div>
          </div>
        )}

        {loading && (
          <div className="p-10 text-center text-sm text-zinc-600 lg:px-0 lg:py-16">
            Carregando indicações...
          </div>
        )}

        {!loading && filtered.map(card => (
          <RecommendationCard key={card.recommendation.id} card={card} />
        ))}

        {!loading && filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-zinc-600 lg:px-0 lg:py-16">
            {emptyMessages[activeTab]}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 border-b-2 py-2.5 text-xs font-semibold transition-colors lg:flex-none lg:mr-8 lg:px-0 lg:py-3 lg:text-sm lg:font-medium',
        active ? 'border-zinc-100 text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-300'
      )}
    >
      {children}
    </button>
  );
}
