import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Item, User } from '../types';
import { useStore } from '../store';
import { getTrending, getPopularMovies, getPopularTV, getTopRatedMovies } from '../services/tmdb';
import { fetchRecommendationCards, RecommendationCardData } from '../services/recommendations';

function useItemNav() {
  const navigate = useNavigate();
  const { addItem } = useStore();

  return async (item: Item) => {
    await addItem(item);
    navigate(`/item/${item.id}`, { state: { item } });
  };
}

type Section = { label: string; items: Item[] };

export function Explore() {
  const { users, connections, currentUser } = useStore();
  const goToItem = useItemNav();
  const [socialCards, setSocialCards] = useState<RecommendationCardData[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser.id || users.length === 0) {
      setSocialCards([]);
      return;
    }

    let cancelled = false;

    const loadSocial = async () => {
      const cards = await fetchRecommendationCards(users);
      if (!cancelled) setSocialCards(cards);
    };

    void loadSocial();

    return () => {
      cancelled = true;
    };
  }, [currentUser.id, users]);

  useEffect(() => {
    let cancelled = false;

    const loadSections = async () => {
      const [trending, popular, topRated, popularTV] = await Promise.all([
        getTrending(),
        getPopularMovies(),
        getTopRatedMovies(),
        getPopularTV(),
      ]);

      if (cancelled) return;

      setSections([
        { label: 'Em alta essa semana', items: trending },
        { label: 'Filmes populares', items: popular },
        { label: 'Melhores avaliados', items: topRated },
        { label: 'Series populares', items: popularTV },
      ]);
      setLoading(false);
    };

    void loadSections();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentConnectionIds = useMemo(() => new Set(
    connections
      .filter(connection => connection.status === 'accepted')
      .filter(connection => connection.requester_id === currentUser.id || connection.receiver_id === currentUser.id)
      .map(connection => connection.requester_id === currentUser.id ? connection.receiver_id : connection.requester_id)
  ), [connections, currentUser.id]);

  const friendCards = useMemo(() => (
    socialCards.filter(card => currentConnectionIds.has(card.recommendation.from_user_id))
  ), [socialCards, currentConnectionIds]);

  const friendRecs = useMemo(() => {
    const counts = new Map<string, { item: Item; count: number }>();

    friendCards.forEach(card => {
      const existing = counts.get(card.item.id);
      if (existing) existing.count += 1;
      else counts.set(card.item.id, { item: card.item, count: 1 });
    });

    return [...counts.values()]
      .sort((left, right) => right.count - left.count)
      .map(entry => entry.item);
  }, [friendCards]);

  const recommenders = (itemId: string) => {
    const ids = [...new Set(
      friendCards
        .filter(card => card.item.id === itemId)
        .map(card => card.fromUser.id)
    )];

    return ids
      .map(id => users.find(user => user.id === id))
      .filter((user): user is User => Boolean(user))
      .slice(0, 3);
  };

  return (
    <div className="mx-auto max-w-md min-h-screen bg-zinc-950 pb-20">
      <header className="border-b border-zinc-800/50 bg-zinc-950/80 px-4 py-3 backdrop-blur-xl">
        <h1 className="text-xl font-black tracking-tight text-zinc-100">Explorar</h1>
      </header>

      <div className="space-y-6 py-4">
        {friendRecs.length > 0 && (
          <Carousel
            label="Indicados por amigos"
            items={friendRecs}
            renderOverlay={item => {
              const itemRecommenders = recommenders(item.id);
              return itemRecommenders.length > 0 ? (
                <div className="absolute bottom-1.5 left-1.5 flex -space-x-1.5">
                  {itemRecommenders.map(user => (
                    <img
                      key={user.id}
                      src={user.avatar}
                      alt={user.name}
                      className="h-5 w-5 rounded-full object-cover ring-1 ring-zinc-950"
                    />
                  ))}
                </div>
              ) : null;
            }}
            onPress={item => void goToItem(item)}
          />
        )}

        {loading ? (
          <SkeletonCarousels />
        ) : (
          sections.map(section => (
            <Carousel
              key={section.label}
              label={section.label}
              items={section.items}
              onPress={item => void goToItem(item)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function Carousel({
  label,
  items,
  onPress,
  renderOverlay,
}: {
  label: string;
  items: Item[];
  onPress: (item: Item) => void;
  renderOverlay?: (item: Item) => React.ReactNode;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="mb-2.5 px-4 text-sm font-bold text-zinc-100">{label}</h2>
      <div className="hide-scrollbar flex gap-2.5 overflow-x-auto px-4 pb-1">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onPress(item)}
            className="group flex w-28 shrink-0 flex-col text-left"
          >
            <div className="relative mb-1.5 aspect-[2/3] w-28 overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/10">
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover transition-opacity group-active:opacity-80"
              />
              {renderOverlay?.(item)}
            </div>
            <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-zinc-300 transition-colors group-hover:text-zinc-100">
              {item.title}
            </p>
            {item.year && (
              <p className="mt-0.5 text-[10px] text-zinc-600">{item.year}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function SkeletonCarousels() {
  return (
    <>
      {['Em alta essa semana', 'Filmes populares', 'Melhores avaliados', 'Series populares'].map(label => (
        <div key={label}>
          <div className="mb-2.5 h-5 w-36 rounded bg-zinc-800 animate-pulse" />
          <div className="flex gap-2.5 px-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="w-28 shrink-0">
                <div className="mb-1.5 aspect-[2/3] w-28 rounded-lg bg-zinc-800 animate-pulse" />
                <div className="mb-1 h-3 w-full rounded bg-zinc-800 animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-zinc-800 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
