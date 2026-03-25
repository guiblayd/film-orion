import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Item } from '../types';
import { useStore } from '../store';
import { getTrending, getPopularMovies, getPopularTV, getTopRatedMovies } from '../services/tmdb';

function useItemNav() {
  const navigate = useNavigate();
  const { addItem } = useStore();
  return (item: Item) => {
    addItem(item);
    navigate(`/item/${item.id}`, { state: { item } });
  };
}

type Section = { label: string; items: Item[] };

export function Explore() {
  const { items: storeItems, recommendations, users } = useStore();
  const goToItem = useItemNav();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  // Items recommended by friends (from store), sorted by count
  const friendRecs = [...storeItems]
    .map(item => ({ item, count: recommendations.filter(r => r.item_id === item.id).length }))
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count)
    .map(s => s.item);

  const recommenders = (itemId: string) => {
    const ids = [...new Set(recommendations.filter(r => r.item_id === itemId).map(r => r.from_user_id))];
    return ids.map(id => users.find(u => u.id === id)).filter(Boolean).slice(0, 3);
  };

  useEffect(() => {
    Promise.all([
      getTrending(),
      getPopularMovies(),
      getTopRatedMovies(),
      getPopularTV(),
    ]).then(([trending, popular, topRated, popularTV]) => {
      setSections([
        { label: 'Em alta essa semana', items: trending },
        { label: 'Filmes populares',    items: popular },
        { label: 'Melhores avaliados',  items: topRated },
        { label: 'Séries populares',    items: popularTV },
      ]);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-md mx-auto bg-zinc-950 min-h-screen pb-20">
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 px-4 py-3">
        <h1 className="text-xl font-black tracking-tight text-zinc-100">Explorar</h1>
      </header>

      <div className="py-4 space-y-6">
        {/* Friends' recommendations — from store */}
        {friendRecs.length > 0 && (
          <Carousel
            label="Indicados por amigos"
            items={friendRecs}
            renderOverlay={item => {
              const recs = recommenders(item.id);
              return recs.length > 0 ? (
                <div className="absolute bottom-1.5 left-1.5 flex -space-x-1.5">
                  {recs.map(u => (
                    <img key={u!.id} src={u!.avatar} alt={u!.name} className="w-5 h-5 rounded-full object-cover ring-1 ring-zinc-950" />
                  ))}
                </div>
              ) : null;
            }}
            onPress={item => goToItem(item)}
          />
        )}

        {/* TMDB sections */}
        {loading ? (
          <SkeletonCarousels />
        ) : (
          sections.map(s => (
            <Carousel
              key={s.label}
              label={s.label}
              items={s.items}
              onPress={item => goToItem(item)}
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
      <h2 className="px-4 text-sm font-bold text-zinc-100 mb-2.5">{label}</h2>
      <div className="flex gap-2.5 overflow-x-auto hide-scrollbar px-4 pb-1">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onPress(item)}
            className="shrink-0 w-28 flex flex-col text-left group"
          >
            <div className="relative w-28 aspect-[2/3] rounded-lg overflow-hidden bg-zinc-900 ring-1 ring-white/10 mb-1.5">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-active:opacity-80 transition-opacity"
              />
              {renderOverlay?.(item)}
            </div>
            <p className="text-[11px] font-semibold text-zinc-300 leading-snug line-clamp-2 group-hover:text-zinc-100 transition-colors">
              {item.title}
            </p>
            {item.year && (
              <p className="text-[10px] text-zinc-600 mt-0.5">{item.year}</p>
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
      {['Em alta essa semana', 'Filmes populares', 'Melhores avaliados', 'Séries populares'].map(label => (
        <div key={label}>
          <div className="px-4 mb-2.5 h-5 w-36 bg-zinc-800 rounded animate-pulse" />
          <div className="flex gap-2.5 px-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shrink-0 w-28">
                <div className="w-28 aspect-[2/3] rounded-lg bg-zinc-800 animate-pulse mb-1.5" />
                <div className="h-3 bg-zinc-800 rounded animate-pulse w-full mb-1" />
                <div className="h-3 bg-zinc-800 rounded animate-pulse w-2/3" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
