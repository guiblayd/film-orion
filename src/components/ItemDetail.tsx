import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Bookmark, Check, X, Send } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { getTMDBDetails, LOGO_IMG, TMDBDetails } from '../services/tmdb';
import { Item } from '../types';

export function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const { items, recommendations, users, currentUser, userItemStatuses, updateUserItemStatus, addItem } = useStore();
  const [tmdb, setTmdb] = useState<TMDBDetails | null>(null);

  // Accept item from navigation state (Explore) or find in store
  const navItem = (location.state as any)?.item as Item | undefined;
  const item = items.find(i => i.id === id) ?? navItem;

  // Ensure TMDB items from Explore are persisted in store
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
  const status = userItemStatuses.find(s => s.item_id === item.id && s.user_id === currentUser.id)?.status;

  const handleIndicate = () => {
    navigate('/create', { state: { item } });
  };

  return (
    <div className="max-w-md mx-auto bg-zinc-950 min-h-screen pb-8">
      {/* Hero */}
      <div className="relative w-full aspect-[2/3] max-h-[65vh]">
        <img src={item.image} alt={item.title} className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-zinc-950/50 backdrop-blur-md rounded-full text-zinc-100"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          {fromUser && (
            <div className="flex items-center gap-1.5 mb-2 bg-white/10 backdrop-blur-sm w-fit px-2.5 py-1 rounded-full border border-white/10">
              <img src={fromUser.avatar} className="w-4 h-4 rounded-full object-cover" />
              <span className="text-[11px] font-medium text-zinc-200">Indicado por {fromUser.name}</span>
            </div>
          )}
          <h1 className="text-2xl font-black text-zinc-100 leading-tight">{item.title}</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {[item.year, tmdb?.country].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pt-4 pb-3 space-y-2">
        <button
          onClick={handleIndicate}
          className="w-full flex items-center justify-center gap-2 bg-zinc-100 text-zinc-950 font-bold py-3 rounded-xl text-sm hover:bg-white transition-colors active:scale-[0.98]"
        >
          <Send size={15} /> Indicar para alguém
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => updateUserItemStatus(item.id, 'watched')}
            className={cn("flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ring-1",
              status === 'watched' ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30" : "bg-zinc-900 text-zinc-400 ring-zinc-800 hover:bg-zinc-800"
            )}
          >
            <Check size={14} /> Já vi
          </button>
          <button
            onClick={() => updateUserItemStatus(item.id, 'saved')}
            className={cn("flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ring-1",
              status === 'saved' ? "bg-blue-500/10 text-blue-400 ring-blue-500/30" : "bg-zinc-900 text-zinc-400 ring-zinc-800 hover:bg-zinc-800"
            )}
          >
            <Bookmark size={14} className={status === 'saved' ? 'fill-current' : ''} /> Salvar
          </button>
          <button
            onClick={() => updateUserItemStatus(item.id, 'ignored')}
            className={cn("flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ring-1",
              status === 'ignored' ? "bg-rose-500/10 text-rose-400 ring-rose-500/30" : "bg-zinc-900 text-zinc-400 ring-zinc-800 hover:bg-zinc-800"
            )}
          >
            <X size={14} /> Ignorar
          </button>
        </div>
      </div>

      {/* Streaming */}
      {tmdb?.provider_logos && tmdb.provider_logos.length > 0 && (
        <div className="px-4 pb-4">
          <p className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider mb-2">Onde assistir</p>
          <div className="flex gap-1.5 flex-wrap">
            {tmdb.provider_logos.map(p => (
              <img key={p.name} src={`${LOGO_IMG}${p.logo_path}`} alt={p.name} title={p.name} className="w-8 h-8 rounded-lg object-cover" />
            ))}
          </div>
        </div>
      )}

      {/* Synopsis */}
      {tmdb?.overview && (
        <div className="px-4 pb-4">
          <p className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider mb-2">Sinopse</p>
          <p className="text-sm text-zinc-400 leading-relaxed">{tmdb.overview}</p>
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
