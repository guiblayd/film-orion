import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Sparkles, SlidersHorizontal, UserPlus2 } from 'lucide-react';
import { Item, User } from '../types';
import { useStore } from '../store';
import {
  discoverTMDB,
  getPopularMovies,
  getPopularTV,
  getTopRatedMovies,
  getTrending,
  searchTMDB,
  TMDB_GENRES,
  TMDB_PROVIDERS,
} from '../services/tmdb';
import { fetchItemsByIds, fetchRecommendationCards, RecommendationCardData } from '../services/recommendations';
import { cn } from '../lib/utils';
import { formatUsername } from '../lib/username';

function useItemNav() {
  const navigate = useNavigate();
  const { addItem } = useStore();
  return async (item: Item) => {
    await addItem(item);
    navigate(`/item/${item.id}`, { state: { item } });
  };
}

type Section = { label: string; items: Item[] };
type MediaFilter = 'all' | 'movie' | 'tv';

export function Explore() {
  const {
    users,
    connections,
    currentUser,
    userItemStatuses,
    onboardingPreferences,
    toggleFollow,
  } = useStore();

  const goToItem = useItemNav();
  const [socialCards, setSocialCards] = useState<RecommendationCardData[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [personalizedItems, setPersonalizedItems] = useState<Item[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [loadingSocial, setLoadingSocial] = useState(true);
  const [loadingPersonalized, setLoadingPersonalized] = useState(true);
  const [loadingLists, setLoadingLists] = useState(true);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [genreFilter, setGenreFilter] = useState<string>('');
  const [providerFilter, setProviderFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [searching, setSearching] = useState(false);
  const [savedItems, setSavedItems] = useState<Item[]>([]);
  const [watchedItems, setWatchedItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!onboardingPreferences) return;
    if (onboardingPreferences.favoriteTypes.length === 1) {
      const favoriteType = onboardingPreferences.favoriteTypes[0];
      setMediaFilter(favoriteType === 'movie' ? 'movie' : 'tv');
    }
    if (onboardingPreferences.favoriteGenres[0]) {
      const matchingGenre = TMDB_GENRES.find(genre => genre.label === onboardingPreferences.favoriteGenres[0]);
      if (matchingGenre) setGenreFilter(matchingGenre.id);
    }
    if (onboardingPreferences.favoriteProviders[0]) {
      const matchingProvider = TMDB_PROVIDERS.find(provider => provider.label === onboardingPreferences.favoriteProviders[0]);
      if (matchingProvider) setProviderFilter(matchingProvider.id);
    }
  }, [onboardingPreferences]);

  useEffect(() => {
    if (!currentUser.id || users.length === 0) return;

    let cancelled = false;
    const loadSocial = async () => {
      setLoadingSocial(true);
      const data = await fetchRecommendationCards(users);
      if (!cancelled) {
        setSocialCards(data);
        setLoadingSocial(false);
      }
    };

    void loadSocial();
    return () => { cancelled = true; };
  }, [currentUser.id, users]);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      getTrending(),
      getPopularMovies(),
      getTopRatedMovies(),
      getPopularTV(),
    ]).then(([trending, popular, topRated, popularTV]) => {
      if (cancelled) return;
      setSections([
        { label: 'Em alta essa semana', items: trending },
        { label: 'Filmes populares', items: popular },
        { label: 'Melhores avaliados', items: topRated },
        { label: 'Series populares', items: popularTV },
      ]);
      setLoadingSections(false);
    });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadPersonalized = async () => {
      setLoadingPersonalized(true);
      const items = await discoverTMDB({
        mediaType: mediaFilter,
        genreId: genreFilter || undefined,
        providerId: providerFilter || undefined,
        year: yearFilter || undefined,
      });
      if (!cancelled) {
        setPersonalizedItems(items);
        setLoadingPersonalized(false);
      }
    };

    void loadPersonalized();
    return () => { cancelled = true; };
  }, [mediaFilter, genreFilter, providerFilter, yearFilter]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);

    const timeoutId = window.setTimeout(() => {
      void searchTMDB(query).then(items => {
        if (cancelled) return;
        setSearchResults(items);
        setSearching(false);
      });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  useEffect(() => {
    const savedIds = [...new Set(
      userItemStatuses
        .filter(status => status.status === 'saved')
        .map(status => status.item_id)
    )];
    const watchedIds = [...new Set(
      userItemStatuses
        .filter(status => status.status === 'watched')
        .map(status => status.item_id)
    )];
    const itemIds = [...new Set([...savedIds, ...watchedIds])];

    if (itemIds.length === 0) {
      setSavedItems([]);
      setWatchedItems([]);
      setLoadingLists(false);
      return;
    }

    let cancelled = false;
    const loadLists = async () => {
      setLoadingLists(true);
      const items = await fetchItemsByIds(itemIds);
      if (cancelled) return;

      const itemsById = new Map(items.map(item => [item.id, item] as const));
      setSavedItems(savedIds.map(itemId => itemsById.get(itemId)).filter((item): item is Item => Boolean(item)));
      setWatchedItems(watchedIds.map(itemId => itemsById.get(itemId)).filter((item): item is Item => Boolean(item)));
      setLoadingLists(false);
    };

    void loadLists();
    return () => { cancelled = true; };
  }, [userItemStatuses]);

  const currentConnectionIds = useMemo(() => new Set(
    connections
      .filter(connection => connection.requester_id === currentUser.id || connection.receiver_id === currentUser.id)
      .map(connection => connection.requester_id === currentUser.id ? connection.receiver_id : connection.requester_id)
  ), [connections, currentUser.id]);

  const friendCards = socialCards.filter(card => currentConnectionIds.has(card.recommendation.from_user_id));
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

  const socialReasons = friendCards
    .filter(card => card.recommendation.message)
    .sort((left, right) => (
      (right.comments.length + right.interactions.length) - (left.comments.length + left.interactions.length)
    ))
    .slice(0, 3);

  const suggestedUsers = users
    .filter(user => user.id !== currentUser.id && !currentConnectionIds.has(user.id))
    .slice(0, 4);

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
    <div className="mx-auto max-w-md min-h-screen bg-zinc-950 pb-20 lg:max-w-none">
      <header className="border-b border-zinc-800/50 bg-zinc-950/80 px-4 py-3 backdrop-blur-xl lg:rounded-b-3xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Descoberta</p>
            <h1 className="mt-1 text-xl font-black tracking-tight text-zinc-100">Explore melhor o que vale seu tempo.</h1>
          </div>
          <div className="hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs font-semibold text-zinc-300 sm:flex sm:items-center sm:gap-2">
            <SlidersHorizontal size={14} />
            Filtros ativos
          </div>
        </div>
      </header>

      <div className="space-y-6 py-4">
        <section className="px-4">
          <div className="rounded-[28px] border border-zinc-800/60 bg-zinc-900/50 p-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <Sparkles size={16} />
              <span className="text-xs font-semibold uppercase tracking-[0.22em]">Personalizado</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Ajuste os filtros para combinar streaming, ano e genero com o seu momento atual.
            </p>

            <label className="mt-4 block">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Buscar titulo
              </span>
              <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3">
                <Search size={16} className="text-zinc-500" />
                <input
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder="Filme, serie ou anime"
                  className="w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
                />
              </div>
            </label>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <FilterGroup label="Formato">
                {[
                  { value: 'all', label: 'Tudo' },
                  { value: 'movie', label: 'Filmes' },
                  { value: 'tv', label: 'Series e animes' },
                ].map(option => (
                  <FilterChip
                    key={option.value}
                    active={mediaFilter === option.value}
                    onClick={() => setMediaFilter(option.value as MediaFilter)}
                  >
                    {option.label}
                  </FilterChip>
                ))}
              </FilterGroup>

              <FilterGroup label="Ano">
                {[
                  { value: '', label: 'Qualquer ano' },
                  { value: '2025', label: '2025' },
                  { value: '2024', label: '2024' },
                  { value: '2023', label: '2023' },
                  { value: '2022', label: '2022' },
                ].map(option => (
                  <FilterChip
                    key={option.label}
                    active={yearFilter === option.value}
                    onClick={() => setYearFilter(option.value)}
                  >
                    {option.label}
                  </FilterChip>
                ))}
              </FilterGroup>

              <FilterGroup label="Genero">
                {TMDB_GENRES.map(genre => (
                  <FilterChip
                    key={genre.id}
                    active={genreFilter === genre.id}
                    onClick={() => setGenreFilter(current => current === genre.id ? '' : genre.id)}
                  >
                    {genre.label}
                  </FilterChip>
                ))}
              </FilterGroup>

              <FilterGroup label="Streaming">
                {TMDB_PROVIDERS.map(provider => (
                  <FilterChip
                    key={provider.id}
                    active={providerFilter === provider.id}
                    onClick={() => setProviderFilter(current => current === provider.id ? '' : provider.id)}
                  >
                    {provider.label}
                  </FilterChip>
                ))}
              </FilterGroup>
            </div>
          </div>
        </section>

        {(searching || searchQuery.trim().length > 0) && (
          <section className="px-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-100">Resultados da busca</h2>
              <span className="text-xs text-zinc-500">
                {searching ? 'Buscando...' : `${searchResults.length} encontrados`}
              </span>
            </div>
            {searching ? (
              <div className="rounded-[28px] border border-zinc-800/60 bg-zinc-900/40 p-8 text-center text-sm text-zinc-500">
                Procurando titulos para voce...
              </div>
            ) : (
              <PosterGrid items={searchResults} onPress={item => void goToItem(item)} />
            )}
          </section>
        )}

        <section className="px-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-100">Para o seu gosto agora</h2>
            {onboardingPreferences && (
              <span className="text-xs text-zinc-500">
                Baseado em {onboardingPreferences.favoriteGenres[0] || 'suas preferencias'}
              </span>
            )}
          </div>
          {loadingPersonalized ? (
            <div className="rounded-[28px] border border-zinc-800/60 bg-zinc-900/40 p-8 text-center text-sm text-zinc-500">
              Montando sua trilha personalizada...
            </div>
          ) : (
            <PosterGrid items={personalizedItems} onPress={item => void goToItem(item)} />
          )}
        </section>

        {!loadingLists && savedItems.length > 0 && (
          <Carousel
            label="Sua watchlist"
            items={savedItems}
            onPress={item => void goToItem(item)}
          />
        )}

        {!loadingLists && watchedItems.length > 0 && (
          <Carousel
            label="Assistidos por voce"
            items={watchedItems}
            onPress={item => void goToItem(item)}
          />
        )}

        {!loadingSocial && friendRecs.length > 0 && (
          <Carousel
            label="Indicados por amigos"
            items={friendRecs}
            renderOverlay={item => {
              const itemRecommenders = recommenders(item.id);
              return itemRecommenders.length > 0 ? (
                <div className="absolute bottom-1.5 left-1.5 flex -space-x-1.5">
                  {itemRecommenders.map(user => (
                    <img key={user.id} src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full object-cover ring-1 ring-zinc-950" />
                  ))}
                </div>
              ) : null;
            }}
            onPress={item => void goToItem(item)}
          />
        )}

        {!loadingSocial && socialReasons.length > 0 && (
          <section className="px-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-100">Porque seu circulo curtiu</h2>
              <span className="text-xs text-zinc-500">Sinais sociais mais fortes</span>
            </div>
            <div className="space-y-3">
              {socialReasons.map(card => (
                <Link
                  key={card.recommendation.id}
                  to={`/recommendation/${card.recommendation.id}`}
                  className="block rounded-[24px] border border-zinc-800/60 bg-zinc-900/40 p-4 hover:bg-zinc-900/70"
                >
                  <div className="flex gap-3">
                    <img src={card.item.image} alt={card.item.title} className="h-20 w-14 rounded-xl object-cover ring-1 ring-zinc-800" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-100">{card.item.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {card.fromUser.name} ({formatUsername(card.fromUser.username)}) indicou para {card.toUser.name} ({formatUsername(card.toUser.username)})
                      </p>
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-300">
                        "{card.recommendation.message}"
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {suggestedUsers.length > 0 && connections.length === 0 && (
          <section className="px-4">
            <div className="mb-3 flex items-center gap-2 text-zinc-400">
              <UserPlus2 size={16} />
              <h2 className="text-sm font-bold text-zinc-100">Perfis para destravar seu feed</h2>
            </div>
            <div className="space-y-3">
              {suggestedUsers.map(user => (
                <div key={user.id} className="flex items-center gap-3 rounded-[24px] border border-zinc-800/60 bg-zinc-900/40 p-4">
                  <img src={user.avatar} alt={user.name} className="h-12 w-12 rounded-full object-cover ring-1 ring-zinc-800" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-zinc-100">{user.name}</p>
                    <p className="truncate text-xs text-zinc-500">{formatUsername(user.username)}</p>
                    <p className="truncate text-xs text-zinc-600">{user.bio || 'Descubra titulos e troque indicacoes.'}</p>
                  </div>
                  <button
                    onClick={() => void toggleFollow(user.id)}
                    className="rounded-full border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
                  >
                    Seguir
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {loadingSections ? (
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
    <section>
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
            {item.year && <p className="mt-0.5 text-[10px] text-zinc-600">{item.year}</p>}
          </button>
        ))}
      </div>
    </section>
  );
}

function PosterGrid({ items, onPress }: { items: Item[]; onPress: (item: Item) => void }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[28px] border border-zinc-800/60 bg-zinc-900/40 p-8 text-center text-sm text-zinc-500">
        Nenhum titulo encontrado com esses filtros. Tente combinar outro genero ou streaming.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {items.map(item => (
        <button key={item.id} onClick={() => onPress(item)} className="text-left">
          <div className="overflow-hidden rounded-[18px] border border-zinc-800/60 bg-zinc-900">
            <img src={item.image} alt={item.title} className="aspect-[2/3] w-full object-cover" />
          </div>
          <p className="mt-2 line-clamp-2 text-xs font-semibold text-zinc-200">{item.title}</p>
          {item.year && <p className="mt-1 text-[11px] text-zinc-500">{item.year}</p>}
        </button>
      ))}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
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
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-zinc-100 bg-zinc-100 text-zinc-950'
          : 'border-zinc-800 bg-zinc-950/70 text-zinc-300 hover:bg-zinc-800/80'
      )}
    >
      {children}
    </button>
  );
}

function SkeletonCarousels() {
  return (
    <>
      {['Em alta essa semana', 'Filmes populares', 'Melhores avaliados', 'Series populares'].map(label => (
        <div key={label}>
          <div className="mb-2.5 h-5 w-36 rounded bg-zinc-800 px-4 animate-pulse" />
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
