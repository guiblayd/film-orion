import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Item, User } from '../types';
import { useStore } from '../store';
import { DesktopPage, DesktopPageHeader } from './DesktopFrame';
import { getPopularMovies, getPopularTV, getTopRatedMovies, getTrending } from '../services/tmdb';
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
    return () => { cancelled = true; };
  }, [currentUser.id, users]);

  useEffect(() => {
    let cancelled = false;

    const loadSections = async () => {
      const [trending, popularMovies, popularTV, topRated] = await Promise.all([
        getTrending(),
        getPopularMovies(),
        getPopularTV(),
        getTopRatedMovies(),
      ]);

      if (cancelled) return;

      setSections([
        { label: 'Em alta esta semana', items: trending },
        { label: 'Filmes populares', items: popularMovies },
        { label: 'Séries populares', items: popularTV },
        { label: 'Melhores avaliados', items: topRated },
      ]);
      setLoading(false);
    };

    void loadSections();
    return () => { cancelled = true; };
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
    <DesktopPage width="wide" className="mx-auto min-h-screen max-w-md bg-zinc-950 pb-20 lg:min-h-0 lg:bg-transparent lg:pb-0">
      <header className="border-b border-zinc-800/50 bg-zinc-950/80 px-4 py-3 backdrop-blur-xl lg:border-b-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
        <div className="lg:hidden">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Explorar</h1>
        </div>
        <DesktopPageHeader
          title="Explorar"
          className="hidden lg:block lg:pb-0"
        />
      </header>

      <div className="space-y-8 py-4 lg:space-y-12 lg:py-4">
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
          <SkeletonSections />
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
    </DesktopPage>
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
    <section>
      <div className="mb-3 flex items-end justify-between px-4 lg:mb-5 lg:px-0">
        <h2 className="text-sm font-medium text-zinc-100 lg:text-[22px]">{label}</h2>
      </div>

      <div className="hide-scrollbar flex gap-2.5 overflow-x-auto px-4 pb-1 lg:grid lg:grid-cols-3 lg:gap-x-7 lg:gap-y-10 lg:overflow-visible lg:px-0 xl:grid-cols-4 2xl:grid-cols-5">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onPress(item)}
            className="group flex w-28 shrink-0 flex-col text-left lg:w-auto"
          >
            <div className="relative mb-2 aspect-[2/3] w-28 overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/10 lg:w-full lg:rounded-2xl">
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              {renderOverlay?.(item)}
            </div>
            <p className="line-clamp-2 text-[11px] font-medium leading-snug text-zinc-300 transition-colors group-hover:text-zinc-100 lg:text-[16px] lg:leading-7">
              {item.title}
            </p>
            {item.year && (
              <p className="mt-0.5 text-[10px] text-zinc-600 lg:text-[13px]">{item.year}</p>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

function SkeletonSections() {
  const labels = ['Em alta esta semana', 'Filmes populares', 'Séries populares', 'Melhores avaliados'];

  return (
    <>
      {labels.map(label => (
        <section key={label}>
          <div className="mb-4 h-5 w-40 rounded bg-zinc-800/70 px-4 lg:px-0" />
          <div className="flex gap-2.5 px-4 lg:grid lg:grid-cols-3 lg:gap-7 lg:px-0 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="w-28 shrink-0 lg:w-auto">
                <div className="mb-2 aspect-[2/3] w-28 animate-pulse rounded-lg bg-zinc-800 lg:w-full lg:rounded-2xl" />
                <div className="mb-1 h-3 w-full animate-pulse rounded bg-zinc-800" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-800" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
