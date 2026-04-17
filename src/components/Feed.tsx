import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Share2, Copy, Check, X } from 'lucide-react';
import { useStore } from '../store';
import { RecommendationCard } from './RecommendationCard';
import { DesktopPage, DesktopPageHeader } from './DesktopFrame';
import { cn } from '../lib/utils';
import { fetchRecommendationCards, RecommendationCardData } from '../services/recommendations';

type Tab = 'descobrir' | 'circulo' | 'para-mim';

export function Feed() {
  const { currentUser, connections, users } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('descobrir');
  const [cards, setCards] = useState<RecommendationCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);

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
    return () => {
      cancelled = true;
    };
  }, [currentUser.id, users]);

  const myConnectionIds = useMemo(() => new Set(
    connections
      .filter(connection => connection.requester_id === currentUser.id || connection.receiver_id === currentUser.id)
      .map(connection => connection.requester_id === currentUser.id ? connection.receiver_id : connection.requester_id)
  ), [connections, currentUser.id]);

  const filtered = useMemo(() => cards.filter(card => {
    const { recommendation } = card;
    const isOwn = recommendation.from_user_id === currentUser.id || recommendation.to_user_id === currentUser.id;
    const isConnection =
      myConnectionIds.has(recommendation.from_user_id) ||
      myConnectionIds.has(recommendation.to_user_id);

    if (activeTab === 'para-mim') return recommendation.to_user_id === currentUser.id;
    if (activeTab === 'circulo') return isOwn || (isConnection && recommendation.visibility !== 'private');
    return recommendation.visibility === 'public';
  }), [cards, activeTab, currentUser.id, myConnectionIds]);

  const emptyMessages: Record<Tab, string> = {
    descobrir: 'Ainda n\u00e3o apareceu nenhuma indica\u00e7\u00e3o p\u00fablica por aqui.',
    circulo: connections.length === 0 ? 'Seu c\u00edrculo ainda est\u00e1 vazio.' : 'Seu c\u00edrculo ainda n\u00e3o movimentou o feed.',
    'para-mim': 'Nada novo para voc\u00ea ainda.',
  };

  return (
    <>
    <DesktopPage width="stream" className="mx-auto min-h-screen max-w-md bg-zinc-950 pb-20 lg:min-h-0 lg:bg-transparent lg:pb-0">
      <header className="sticky top-0 z-10 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl lg:static lg:border-b-0 lg:bg-transparent lg:backdrop-blur-none">
        <div className="px-4 py-3 lg:px-0 lg:py-0">
          <div className="lg:hidden relative flex items-center justify-center">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">FilmOrion</h1>
            <button
              onClick={() => setShowShare(true)}
              className="absolute right-0 p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label="Compartilhar aplicação"
            >
              <Share2 size={18} />
            </button>
          </div>
          <DesktopPageHeader
            title={'In\u00edcio'}
            className="hidden lg:block lg:pb-0"
          />
        </div>
        <div className="flex border-t border-zinc-800/40 lg:border-b lg:border-zinc-800/50">
          <TabButton active={activeTab === 'descobrir'} onClick={() => setActiveTab('descobrir')}>
            Descobrir
          </TabButton>
          <TabButton active={activeTab === 'circulo'} onClick={() => setActiveTab('circulo')}>
            {'C\u00edrculo'}
          </TabButton>
          <TabButton active={activeTab === 'para-mim'} onClick={() => setActiveTab('para-mim')}>
            Para mim
          </TabButton>
        </div>
      </header>

      <div className="flex flex-col">
        {loading ? (
          <div className="p-10 text-center text-sm text-zinc-600 lg:px-0 lg:py-16">
            {'Carregando indica\u00e7\u00f5es...'}
          </div>
        ) : null}

        {!loading && filtered.map(card => (
          <RecommendationCard key={card.recommendation.id} card={card} />
        ))}

        {!loading && filtered.length === 0 ? (
          <EmptyFeedState
            message={emptyMessages[activeTab]}
            actionLabel={activeTab === 'circulo' ? 'Explorar pessoas e t\u00edtulos' : undefined}
            actionTo={activeTab === 'circulo' ? '/explore' : undefined}
          />
        ) : null}
      </div>
    </DesktopPage>
    {showShare && <ShareModal onClose={() => setShowShare(false)} />}
    </>
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
        'flex-1 border-b-2 py-2.5 text-xs font-semibold transition-colors lg:flex-none lg:mr-10 lg:px-0 lg:py-4 lg:text-[15px] lg:font-medium',
        active ? 'border-zinc-100 text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-300'
      )}
    >
      {children}
    </button>
  );
}

function EmptyFeedState({
  message,
  actionLabel,
  actionTo,
}: {
  message: string;
  actionLabel?: string;
  actionTo?: string;
}) {
  return (
    <div className="px-6 py-12 text-center lg:px-0 lg:py-16">
      <p className="text-sm text-zinc-600 lg:text-[15px]">{message}</p>
      {actionLabel && actionTo ? (
        <Link to={actionTo} className="mt-4 inline-flex text-sm font-medium text-zinc-300 transition-colors hover:text-zinc-100">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function ShareModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const appUrl = window.location.origin;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FilmOrion',
          text: 'Descubra e compartilhe indicações de filmes e séries com quem você gosta!',
          url: appUrl,
        });
        onClose();
      } catch {
        // user cancelled
      }
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center lg:items-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-t-2xl bg-zinc-900 border border-zinc-800/60 p-6 pb-8 lg:rounded-2xl lg:pb-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <p className="text-[15px] font-semibold text-zinc-100">Indicar o FilmOrion</p>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-zinc-400 mb-5">
          Chame um amigo para descobrir e compartilhar indicações de filmes e séries.
        </p>
        <div className="flex flex-col gap-3">
          {typeof navigator.share === 'function' && (
            <button
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-zinc-100 text-zinc-950 text-sm font-semibold hover:bg-white transition-colors"
            >
              <Share2 size={16} />
              Compartilhar
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-100 text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            {copied ? 'Link copiado!' : 'Copiar link'}
          </button>
        </div>
      </div>
    </div>
  );
}
