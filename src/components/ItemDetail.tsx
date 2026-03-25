import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { useStore } from '../store';
import { getTMDBDetails, LOGO_IMG, TMDBDetails } from '../services/tmdb';
import { Item } from '../types';

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

  const { items, recommendations, users, currentUser, addItem } = useStore();
  const [tmdb, setTmdb] = useState<TMDBDetails | null>(null);
  const [overviewExpanded, setOverviewExpanded] = useState(false);

  const navItem = (location.state as any)?.item as Item | undefined;
  const item = items.find(i => i.id === id) ?? navItem;

  useEffect(() => {
    if (navItem && !items.find(i => i.id === navItem.id)) {
      addItem(navItem);
    }
  }, []);

  useEffect(() => {
    if (!item?.id.startsWith('tmdb_')) return;
    const tmdbId = Number(item.id.replace('tmdb_', ''));
    const mediaType = item.type === 'movie' ? 'movie' : 'tv';
    getTMDBDetails(tmdbId, mediaType).then(setTmdb);
  }, [item?.id]);

  if (!item) return <div className="p-8 text-center text-zinc-500">Item não encontrado</div>;

  const relevantRec = recommendations.find(r => r.item_id === item.id && r.to_user_id === currentUser.id);
  const fromUser = relevantRec ? users.find(u => u.id === relevantRec.from_user_id) : null;

  const TYPE_LABEL: Record<string, string> = { movie: 'Filme', series: 'Série', anime: 'Anime' };

  const techRows: { label: string; value: string }[] = [];
  if (tmdb?.director) techRows.push({ label: 'Direção', value: tmdb.director });
  if (tmdb?.creators?.length) techRows.push({ label: 'Criação', value: tmdb.creators.join(', ') });
  if (tmdb?.cast?.length) techRows.push({ label: 'Elenco', value: tmdb.cast.join(', ') });
  if (tmdb?.genres?.length) techRows.push({ label: 'Gêneros', value: tmdb.genres.join(', ') });
  if (item.type) techRows.push({ label: 'Tipo', value: TYPE_LABEL[item.type] ?? item.type });
  if (item.year) techRows.push({ label: 'Ano', value: String(item.year) });
  if (tmdb?.country) techRows.push({ label: 'País', value: tmdb.country });
  if (tmdb?.runtime) techRows.push({ label: 'Duração', value: `${tmdb.runtime} min` });
  if (tmdb?.seasons) techRows.push({ label: 'Temporadas', value: String(tmdb.seasons) });
  if (tmdb?.vote_average) techRows.push({ label: 'Nota TMDB', value: `${tmdb.vote_average} / 10` });

  const backdropSrc = tmdb?.backdrop ?? posterUrl(item.image);

  return (
    <div className="max-w-md mx-auto bg-zinc-950 min-h-screen pb-8">

      {/* Backdrop — sem blur, cena real do filme */}
      <div className="relative w-full h-56 overflow-hidden">
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

      {/* Poster centralizado sobrepondo o backdrop */}
      <div className="flex justify-center -mt-24 relative z-10 mb-4">
        <img
          src={posterUrl(item.image)}
          alt={item.title}
          className="w-32 rounded-xl object-cover ring-1 ring-white/10 shadow-2xl"
          style={{ aspectRatio: '2/3' }}
        />
      </div>

      {/* Título, ano, país e providers */}
      <div className="px-4 text-center mb-4">
        {fromUser && (
          <div className="flex items-center justify-center gap-1.5 mb-2 mx-auto bg-white/10 backdrop-blur-sm w-fit px-2.5 py-1 rounded-full border border-white/10">
            <img src={fromUser.avatar} className="w-4 h-4 rounded-full object-cover shrink-0" />
            <span className="text-[11px] font-medium text-zinc-200">Indicado por {fromUser.name}</span>
          </div>
        )}
        <h1 className="text-xl font-black text-zinc-100 leading-snug">{item.title}</h1>
        <p className="text-sm text-zinc-400 mt-1">
          {[item.year, tmdb?.country].filter(Boolean).join(' · ')}
        </p>
      </div>

      {/* Botão Indicar — largura total */}
      <div className="px-4 pb-5">
        <button
          onClick={() => navigate('/create', { state: { item } })}
          className="w-full flex items-center justify-center gap-2 bg-zinc-100 text-zinc-950 font-bold py-3 rounded-xl text-sm hover:bg-white transition-colors active:scale-[0.98]"
        >
          <Send size={15} /> Indicar para alguém
        </button>
      </div>

      {/* Synopsis */}
      {tmdb?.overview && (
        <div className="px-4 pb-5">
          <p className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider mb-2">Sinopse</p>
          <p className={`text-sm text-zinc-400 leading-relaxed ${overviewExpanded ? '' : 'line-clamp-3'}`}>
            {tmdb.overview}
          </p>
          <button
            onClick={() => setOverviewExpanded(v => !v)}
            className="mt-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {overviewExpanded ? 'Resumir' : 'Ver mais'}
          </button>
        </div>
      )}

      {/* Ficha técnica */}
      {techRows.length > 0 && (
        <div className="px-4 pb-6">
          <p className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider mb-1">Ficha técnica</p>
          <div>
            {techRows.map(row => (
              <TechRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendation message */}
      {relevantRec?.message && (
        <div className="px-4 pb-4">
          <p className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider mb-2">Mensagem</p>
          <p className="text-sm text-zinc-400 italic">"{relevantRec.message}"</p>
        </div>
      )}

      {/* Streaming providers */}
      {tmdb?.provider_logos && tmdb.provider_logos.length > 0 && (
        <div className="px-4 pb-8 pt-2">
          <p className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider mb-3">Disponível em</p>
          <div className="flex gap-2 flex-wrap">
            {tmdb.provider_logos.map(p => (
              <div key={p.name} className="flex flex-col items-center gap-1">
                <img src={`${LOGO_IMG}${p.logo_path}`} alt={p.name} title={p.name} className="w-10 h-10 rounded-xl object-cover" />
                <span className="text-[9px] text-zinc-600 max-w-[42px] text-center leading-tight">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
