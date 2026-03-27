import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { useStore } from '../store';
import { getTMDBDetails, LOGO_IMG, TMDBDetails } from '../services/tmdb';
import { Item } from '../types';
import { DesktopFrame, DesktopPage } from './DesktopFrame';
import { fetchItemById, fetchRecommendationCards, RecommendationCardData } from '../services/recommendations';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const W300 = 'https://image.tmdb.org/t/p/w300';

const COPY = {
  notFound: 'Item n\u00e3o encontrado',
  series: 'S\u00e9rie',
  direction: 'Dire\u00e7\u00e3o',
  creation: 'Cria\u00e7\u00e3o',
  genres: 'G\u00eaneros',
  country: 'Pa\u00eds',
  duration: 'Dura\u00e7\u00e3o',
  recommendedBy: 'Indicado por',
  visitorReadOnly: 'No modo visitante, esta tela fica apenas para consulta.',
  recommendToSomeone: 'Indicar para algu\u00e9m',
  synopsis: 'Sinopse',
  technicalSheet: 'Ficha t\u00e9cnica',
  message: 'Mensagem',
  availableOn: 'Dispon\u00edvel em',
  resume: 'Resumir',
  expand: 'Ver mais',
  back: 'Voltar',
} as const;

function posterUrl(src: string) {
  return src.startsWith(W300) ? src.replace(W300, POSTER_BASE) : src;
}

function TechRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 border-b border-zinc-800/40 py-2 last:border-0 lg:grid lg:grid-cols-[120px_minmax(0,1fr)] lg:gap-5 lg:py-3">
      <span className="w-24 shrink-0 text-[11px] leading-relaxed text-zinc-600">{label}</span>
      <span className="flex-1 text-[11px] leading-relaxed text-zinc-400 lg:text-sm">{value}</span>
    </div>
  );
}

export function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { users, currentUser, addItem, isReadOnly } = useStore();

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
    return () => { cancelled = true; };
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

    return () => { cancelled = true; };
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
    return () => { cancelled = true; };
  }, [item, users, currentUser.id]);

  if (!item) return <div className="p-8 text-center text-zinc-500">{COPY.notFound}</div>;

  const displayYear = item.year ?? tmdb?.year;
  const relevantCard = recommendationCards[0] ?? null;
  const relevantRec = relevantCard?.recommendation ?? null;
  const fromUser = relevantCard?.fromUser ?? null;

  const typeLabel: Record<string, string> = {
    movie: 'Filme',
    series: COPY.series,
    anime: 'Anime',
  };

  const techRows: { label: string; value: string }[] = [];
  if (tmdb?.director) techRows.push({ label: COPY.direction, value: tmdb.director });
  if (tmdb?.creators?.length) techRows.push({ label: COPY.creation, value: tmdb.creators.join(', ') });
  if (tmdb?.cast?.length) techRows.push({ label: 'Elenco', value: tmdb.cast.join(', ') });
  if (tmdb?.genres?.length) techRows.push({ label: COPY.genres, value: tmdb.genres.join(', ') });
  if (item.type) techRows.push({ label: 'Tipo', value: typeLabel[item.type] ?? item.type });
  if (displayYear) techRows.push({ label: 'Ano', value: String(displayYear) });
  if (tmdb?.country) techRows.push({ label: COPY.country, value: tmdb.country });
  if (tmdb?.runtime) techRows.push({ label: COPY.duration, value: `${tmdb.runtime} min` });
  if (tmdb?.seasons) techRows.push({ label: 'Temporadas', value: String(tmdb.seasons) });
  if (tmdb?.vote_average) techRows.push({ label: 'Nota TMDB', value: `${tmdb.vote_average} / 10` });

  const backdropSrc = tmdb?.backdrop ?? posterUrl(item.image);

  return (
    <DesktopFrame>
      <DesktopPage width="detail" className="mx-auto min-h-screen max-w-md bg-zinc-950 pb-8 lg:pb-12">
        <div className="relative h-56 w-full overflow-hidden lg:hidden">
          <img src={backdropSrc} alt="" className="h-full w-full object-cover" style={{ filter: 'brightness(0.55) saturate(1.2)' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950" />
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 top-4 rounded-full bg-zinc-950/50 p-2 text-zinc-100 backdrop-blur-md"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="relative z-10 mb-4 -mt-24 flex justify-center lg:hidden">
          <img
            src={posterUrl(item.image)}
            alt={item.title}
            className="w-32 rounded-xl object-cover ring-1 ring-white/10 shadow-2xl"
            style={{ aspectRatio: '2/3' }}
          />
        </div>

        <div className="hidden items-start justify-between lg:flex">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-100">
            <ArrowLeft size={18} />
            {COPY.back}
          </button>
        </div>

        <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10 lg:pt-8">
          <div className="hidden lg:block lg:sticky lg:top-8 lg:self-start">
            <img
              src={posterUrl(item.image)}
              alt={item.title}
              className="w-full rounded-2xl object-cover ring-1 ring-white/10"
              style={{ aspectRatio: '2/3' }}
            />
          </div>

          <div className="min-w-0">
            <div className="mb-4 px-4 text-center lg:px-0 lg:text-left">
              {fromUser ? (
                <div className="mx-auto mb-3 flex w-fit items-center gap-1.5 rounded-full border border-zinc-800 px-2.5 py-1 lg:mx-0">
                  <img src={fromUser.avatar} alt={fromUser.name} className="h-4 w-4 shrink-0 rounded-full object-cover" />
                  <span className="text-[11px] font-medium text-zinc-200">
                    {COPY.recommendedBy} {fromUser.name}
                  </span>
                </div>
              ) : null}
              <h1 className="text-xl font-semibold leading-snug text-zinc-100 lg:text-[34px] lg:leading-tight">{item.title}</h1>
              <p className="mt-1 text-sm text-zinc-400 lg:text-base">
                {[displayYear, tmdb?.country].filter(Boolean).join(' \u00b7 ')}
              </p>
            </div>

            {tmdb?.backdrop ? (
              <div className="hidden overflow-hidden rounded-3xl lg:mb-8 lg:block">
                <img src={backdropSrc} alt="" className="h-64 w-full object-cover opacity-80" />
              </div>
            ) : null}

            <div className="px-4 pb-5 lg:px-0 lg:pb-8">
              {isReadOnly ? (
                <p className="text-sm leading-relaxed text-zinc-500">{COPY.visitorReadOnly}</p>
              ) : (
                <button
                  onClick={() => navigate('/create', { state: { item } })}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-white active:scale-[0.98] lg:w-auto lg:px-6"
                >
                  <Send size={15} /> {COPY.recommendToSomeone}
                </button>
              )}
            </div>

            {tmdb?.overview ? (
              <div className="px-4 pb-5 lg:px-0 lg:pb-8">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-600">{COPY.synopsis}</p>
                <p className={`text-sm leading-relaxed text-zinc-400 lg:text-[15px] lg:leading-8 ${overviewExpanded ? '' : 'line-clamp-3 lg:line-clamp-4'}`}>
                  {tmdb.overview}
                </p>
                <button
                  onClick={() => setOverviewExpanded(value => !value)}
                  className="mt-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  {overviewExpanded ? COPY.resume : COPY.expand}
                </button>
              </div>
            ) : null}

            {techRows.length > 0 ? (
              <div className="px-4 pb-6 lg:px-0 lg:pb-8">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-zinc-600">{COPY.technicalSheet}</p>
                <div>{techRows.map(row => <TechRow key={row.label} label={row.label} value={row.value} />)}</div>
              </div>
            ) : null}

            {relevantRec?.message ? (
              <div className="px-4 pb-4 lg:px-0 lg:pb-8">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-600">{COPY.message}</p>
                <p className="text-sm italic text-zinc-400 lg:text-[15px]">"{relevantRec.message}"</p>
              </div>
            ) : null}

            {tmdb?.provider_logos && tmdb.provider_logos.length > 0 ? (
              <div className="px-4 pb-8 pt-2 lg:px-0">
                <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-zinc-600">{COPY.availableOn}</p>
                <div className="flex flex-wrap gap-2.5">
                  {tmdb.provider_logos.map(provider => (
                    <div key={provider.name} className="relative">
                      <button onClick={() => setActiveProvider(previous => previous === provider.name ? null : provider.name)} className="block">
                        <img src={`${LOGO_IMG}${provider.logo_path}`} alt={provider.name} className="h-11 w-11 rounded-xl object-cover" />
                      </button>
                      {activeProvider === provider.name ? (
                        <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 shadow-lg">
                          <span className="text-xs font-medium text-zinc-200">{provider.name}</span>
                          <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-zinc-700" />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DesktopPage>
    </DesktopFrame>
  );
}
