import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark, Check, X } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';

export function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, recommendations, users, currentUser, userItemStatuses, updateUserItemStatus } = useStore();

  const item = items.find(i => i.id === id);
  if (!item) return <div className="p-8 text-center">Item não encontrado</div>;

  // Find if there's a recommendation for this user for this item
  const relevantRec = recommendations.find(r => r.item_id === item.id && r.to_user_id === currentUser.id);
  const fromUser = relevantRec ? users.find(u => u.id === relevantRec.from_user_id) : null;

  const status = userItemStatuses.find(s => s.item_id === item.id && s.user_id === currentUser.id)?.status;

  return (
    <div className="max-w-md mx-auto bg-zinc-950 min-h-screen pb-20">
      <header className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-zinc-950/80 to-transparent">
        <button onClick={() => navigate(-1)} className="p-2 bg-zinc-950/40 backdrop-blur-md rounded-full text-zinc-100 hover:bg-zinc-900/60 transition-colors">
          <ArrowLeft size={24} />
        </button>
      </header>

      {/* Hero Image */}
      <div className="relative w-full aspect-[2/3] max-h-[60vh]">
        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 text-zinc-100">
          {fromUser && (
            <div className="flex items-center gap-2 mb-3 bg-white/10 backdrop-blur-md w-fit px-3 py-1.5 rounded-full border border-white/10">
              <img src={fromUser.avatar} alt={fromUser.name} className="w-5 h-5 rounded-full ring-1 ring-white/20" />
              <span className="text-xs font-medium text-zinc-200">Indicado por {fromUser.name}</span>
            </div>
          )}
          <h1 className="text-3xl font-black leading-tight mb-2 text-zinc-100">{item.title}</h1>
          {item.year && (
            <p className="text-sm text-zinc-400 font-medium">{item.year}</p>
          )}
        </div>
      </div>

      <div className="p-6 bg-zinc-950">
        {relevantRec?.message && (
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50 mb-6 relative">
            <div className="absolute -top-3 left-6 bg-zinc-950 px-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Mensagem
            </div>
            <p className="text-zinc-300 italic">"{relevantRec.message}"</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <button 
            onClick={() => updateUserItemStatus(item.id, 'watched')}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all ring-1",
              status === 'watched' ? "bg-emerald-500/10 text-emerald-500 ring-emerald-500/30" : "bg-zinc-900 text-zinc-400 ring-zinc-800 hover:bg-zinc-800 hover:text-zinc-300"
            )}
          >
            <Check size={24} />
            <span className="text-xs font-bold uppercase tracking-wider">Já vi</span>
          </button>
          
          <button 
            onClick={() => updateUserItemStatus(item.id, 'saved')}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all ring-1",
              status === 'saved' ? "bg-blue-500/10 text-blue-500 ring-blue-500/30" : "bg-zinc-900 text-zinc-400 ring-zinc-800 hover:bg-zinc-800 hover:text-zinc-300"
            )}
          >
            <Bookmark size={24} className={status === 'saved' ? "fill-current" : ""} />
            <span className="text-xs font-bold uppercase tracking-wider">Salvar</span>
          </button>
          
          <button 
            onClick={() => updateUserItemStatus(item.id, 'ignored')}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all ring-1",
              status === 'ignored' ? "bg-rose-500/10 text-rose-500 ring-rose-500/30" : "bg-zinc-900 text-zinc-400 ring-zinc-800 hover:bg-zinc-800 hover:text-zinc-300"
            )}
          >
            <X size={24} />
            <span className="text-xs font-bold uppercase tracking-wider">Ignorar</span>
          </button>
        </div>

        {item.watch_providers && item.watch_providers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">Onde assistir</h3>
            <div className="flex flex-wrap gap-2">
              {item.watch_providers.map(provider => (
                <span key={provider} className="px-4 py-2 bg-zinc-900 rounded-lg text-sm font-medium text-zinc-300 ring-1 ring-zinc-800">
                  {provider}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
