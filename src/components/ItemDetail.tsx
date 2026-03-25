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

  return (
    <div className="max-w-md mx-auto bg-zinc-950 min-h-screen pb-8">

      {/* Backdrop */}
      <div className="relative w-full h-52 overflow-hidden">
        <img
          src={posterUrl(item.image)}
          alt=""
          className="w-full h-full object-cover scale-125"
          style={{ filter: 'blur(18px) brightness(0.3) saturate(1.2)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/30 via-transparent to-zinc-950" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-zinc-950/50 backdrop-blur-md rounded-full text-zinc-100"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Poster + Info */}
      <div className="px-4 -mt-20 relative z-10 flex gap-4 mb-5">
        <img
          src={posterUrl(item.image)}
          alt={item.title}
          className="w-28 shrink-0 rounded-xl object-cover ring-1 ring-white/10 shadow-2xl"
          style={{ aspectRatio: '2/3' }}
        />
        <div className="flex flex-col justify-start pt-1 min-w-0 flex-1">
          {fromUser && (
            <div className="flex items-center gap-1.5 mb-2 bg-white/10 backdrop-blur-sm w-fit max-w-full px-2.5 py-1 rounded-full border border-white/10">
              <img src={fromUser.avatar} className="w-4 h-4 rounded-full object-cover shrink-0" />
              <span className="text-[11px] font-medium text-zinc-200 truncate">Indicado por {fromUser.name}</span>
            </div>
          )}
          <h1 className="text-lg font-black text-zinc-100 leading-snug">{item.title}</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {[item.year, tmdb?.country].filter(Boolean).join(' · ')}
          </p>
          {tmdb?.provider_logos && tmdb.provider_logos.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-2.5">
              {tmdb.provider_logos.map(p => (
                <img key={p.name} src={`${LOGO_IMG}${p.logo_path}`} alt={p.name} title={p.name} className="w-7 h-7 rounded-md object-cover" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Indicar */}
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
          <p className="text-sm text-zinc-400 leading-relaxed">{tmdb.overview}</p>
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
    </div>
  );
}
