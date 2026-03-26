import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { useStore } from '../store';
import { getTMDBDetails, LOGO_IMG, TMDBDetails } from '../services/tmdb';
import { Item } from '../types';
import { fetchItemById, fetchRecommendationCards, RecommendationCardData } from '../services/recommendations';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const W300 = 'https://image.tmdb.org/t/p/w300';

function posterUrl(src: string) {
  return src.startsWith(W300) ? src.replace(W300, POSTER_BASE) : src;
}

function TechRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-2 border-b border-zinc-800/40 last:border-0">
      <span className="text-[11px] text-zinc-600 w-24 shrink-0 leading-relaxed">{label}</span>
      <span className="text-[11px] text-zinc-400 flex-1 leading-relaxed">{value}</span>
    </div>
  );
}

export function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { users, currentUser, addItem } = useStore();

  const [item, setItem] = useState<Item | null>(((location.state as { item?: Item } | null)?.item) ?? null);
  const [tmdb, setTmdb] = useState<TMDBDetails | null>(null);
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [recommendationCards, setRecommendationCards] = useState<RecommendationCardData[]>([]);

  useEffect(() => {
    const navItem = (location.state as { item?: Item } | null)?.item;
    if (!navItem) return;

    setItem(navItem);
    void addItem(navItem);
  }, [location.state, addItem]);

  useEffect(() => {
    if (item || !id) return;

    let cancelled = false;
    const loadItem = async () => {
      const data = await fetchItemById(id);
      if (!cancelled) setItem(data);
    };

    void loadItem();
    return () => {
      cancelled = true;
    };
  }, [id, item]);

  useEffect(() => {
    if (!item?.id.startsWith('tmdb_')) {
      setTmdb(null);
      return;
    }

    let cancelled = false;
    const tmdbId = Number(item.id.replace('tmdb_', ''));
    const mediaType = item.type === 'movie' ? 'movie' : 'tv';

    getTMDBDetails(tmdbId, mediaType).then(details => {
      if (!cancelled) setTmdb(details);
    });

    return () => {
      cancelled = true;
    };
  }, [item?.id, item?.type]);

  useEffect(() => {
    if (!item || item.year || !tmdb?.year) return;

    const hydratedItem = { ...item, year: tmdb.year };
    setItem(hydratedItem);
    void addItem(hydratedItem);
  }, [item, tmdb?.year, addItem]);

  useEffect(() => {
    if (!item || users.length === 0 || !currentUser.id) return;

    let cancelled = false;
    const loadRecommendations = async () => {
      const data = await fetchRecommendationCards(users, {
        itemId: item.id,
        toUserId: currentUser.id,
      });
      if (!cancelled) setRecommendationCards(data);
    };

    void loadRecommendations();
    return () => {
      cancelled = true;
    };
  }, [item, users, currentUser.id]);

  if (!item) return <div className="p-8 text-center text-zinc-500">Item nao encontrado</div>;

  const displayYear = item.year ?? tmdb?.year;
  const relevantCard = recommendationCards[0] ?? null;
  const relevantRec = relevantCard?.recommendation ?? null;
  const fromUser = relevantCard?.fromUser ?? null;

  const typeLabel: Record<string, string> = { movie: 'Filme', series: 'Serie', anime: 'Anime' };

  const techRows: { label: string; value: string }[] = [];
  if (tmdb?.director) techRows.push({ label: 'Direcao', value: tmdb.director });
  if (tmdb?.creators?.length) techRows.push({ label: 'Criacao', value: tmdb.creators.join(', ') });
  if (tmdb?.cast?.length) techRows.push({ label: 'Elenco', value: tmdb.cast.join(', ') });
  if (tmdb?.genres?.length) techRows.push({ label: 'Generos', value: tmdb.genres.join(', ') });
  if (item.type) techRows.push({ label: 'Tipo', value: typeLabel[item.type] ?? item.type });
  if (displayYear) techRows.push({ label: 'Ano', value: String(displayYear) });
  if (tmdb?.country) techRows.push({ label: 'Pais', value: tmdb.country });
  if (tmdb?.runtime) techRows.push({ label: 'Duracao', value: `${tmdb.runtime} min` });
  if (tmdb?.seasons) techRows.push({ label: 'Temporadas', value: String(tmdb.seasons) });
  if (tmdb?.vote_average) techRows.push({ label: 'Nota TMDB', value: `${tmdb.vote_average} / 10` });

  const backdropSrc = tmdb?.backdrop ?? posterUrl(item.image);

  return (
    <div className="max-w-md mx-auto bg-zinc-950 min-h-screen pb-8 lg:max-w-3xl">
      <div className="relative w-full h-56 overflow-hidden lg:rounded-b-3xl">
        <img
          src={backdropSrc}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.55) saturate(1.2)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-zinc-950/50 backdrop-blur-md rounded-full text-zinc-100"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="flex justify-center -mt-24 relative z-10 mb-4">
        <img
          src={posterUrl(item.image)}
          alt={item.title}
          className="w-32 rounded-xl object-cover ring-1 ring-white/10 shadow-2xl"
          style={{ aspectRatio: '2/3' }}
        />
      </div>

      <div className="px-4 text-center mb-4">
        {fromUser && (
          <div className="flex items-center justify-center gap-1.5 mb-2 mx-auto bg-white/10 backdrop-blur-sm w-fit px-2.5 py-1 rounded-full border border-white/10">
            <img src={fromUser.avatar} alt={fromUser.name} className="w-4 h-4 rounded-full object-cover shrink-0" />
            <span className="text-[11px] font-medium text-zinc-200">Indicado por {fromUser.name}</span>
          </div>
        )}
        <h1 className="text-xl font-black text-zinc-100 leading-snug">{item.title}</h1>
        <p className="text-sm text-zinc-400 mt-1">
          {[displayYear, tmdb?.country].filter(Boolean).join(' · ')}
        </p>
      </div>

      <div className="px-4 pb-5">
        <button
          onClick={() => navigate('/create', { state: { item } })}
          className="w-full flex items-center justify-center gap-2 bg-zinc-100 text-zinc-950 font-bold py-3 rounded-xl text-sm hover:bg-white transition-colors active:scale-[0.98]"
        >
          <Send size={15} /> Indicar para alguem
        </button>
      </div>

      {tmdb?.overview && (
        <div className="px-4 pb-5">
          <p className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider mb-2">Sinopse</p>
          <p className={`text-sm text-zinc-400 leading-relaxed ${overviewExpanded ? '' : 'line-clamp-3'}`}>
            {tmdb.overview}
          </p>
          <button
            onClick={() => setOverviewExpanded(value => !value)}
            className="mt-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {overviewExpanded ? 'Resumir' : 'Ver mais'}
          </button>
        </div>
      )}

      {techRows.length > 0 && (
        <div className="px-4 pb-6">
          <p className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider mb-1">Ficha tecnica</p>
          <div>
            {techRows.map(row => (
              <TechRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </div>
      )}

      {relevantRec?.message && (
        <div className="px-4 pb-4">
          <p className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider mb-2">Mensagem</p>
          <p className="text-sm text-zinc-400 italic">"{relevantRec.message}"</p>
        </div>
      )}

      {tmdb?.provider_logos && tmdb.provider_logos.length > 0 && (
        <div className="px-4 pb-8 pt-2">
          <p className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider mb-3">Disponivel em</p>
          <div className="flex gap-2.5 flex-wrap">
            {tmdb.provider_logos.map(provider => (
              <div key={provider.name} className="relative">
                <button
                  onClick={() => setActiveProvider(previous => previous === provider.name ? null : provider.name)}
                  className="block"
                >
                  <img
                    src={`${LOGO_IMG}${provider.logo_path}`}
                    alt={provider.name}
                    className="w-11 h-11 rounded-xl object-cover"
                  />
                </button>
                {activeProvider === provider.name && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded-lg whitespace-nowrap z-10 shadow-lg">
                    <span className="text-xs text-zinc-200 font-medium">{provider.name}</span>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-zinc-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
