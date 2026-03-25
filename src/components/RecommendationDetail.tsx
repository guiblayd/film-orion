import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, ThumbsUp, ThumbsDown, Bookmark, Check, X, ArrowRight } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';

export function RecommendationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { recommendations, comments, users, items, currentUser, addComment, interactions, toggleInteraction, userItemStatuses, updateUserItemStatus } = useStore();
  
  const [newComment, setNewComment] = useState('');

  const recommendation = recommendations.find(r => r.id === id);
  if (!recommendation) return <div className="p-8 text-center">Indicação não encontrada</div>;

  const item = items.find(i => i.id === recommendation.item_id);
  const fromUser = users.find(u => u.id === recommendation.from_user_id);
  const toUser = users.find(u => u.id === recommendation.to_user_id);

  if (!item || !fromUser || !toUser) return null;

  const recComments = comments.filter(c => c.recommendation_id === recommendation.id);
  const recInteractions = interactions.filter(i => i.recommendation_id === recommendation.id);
  const userInteraction = recInteractions.find(i => i.user_id === currentUser.id);
  const status = userItemStatuses.find(s => s.item_id === item.id && s.user_id === currentUser.id)?.status;

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addComment(recommendation.id, newComment.trim());
    setNewComment('');
  };

  return (
    <div className="max-w-md mx-auto bg-zinc-950 min-h-screen pb-20 flex flex-col">
      <header className="bg-zinc-950/80 backdrop-blur-xl px-4 py-3 flex items-center gap-3 sticky top-0 z-10 border-b border-zinc-800/50">
        <button onClick={() => navigate(-1)} className="p-1 text-zinc-100 hover:text-zinc-300 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-zinc-100">Decisão & Discussão</h1>
      </header>

      <div className="bg-zinc-950 p-4 border-b border-zinc-800/50">
        {/* Context */}
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-5 font-medium">
          <Link to={`/profile/${fromUser.id}`} className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors">
            <img src={fromUser.avatar} className="w-6 h-6 rounded-full object-cover ring-1 ring-zinc-800" />
            <span>{fromUser.name}</span>
          </Link>
          <ArrowRight size={14} className="text-zinc-600" />
          <Link to={`/profile/${toUser.id}`} className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors">
            <img src={toUser.avatar} className="w-6 h-6 rounded-full object-cover ring-1 ring-zinc-800" />
            <span>{toUser.name}</span>
          </Link>
        </div>

        {/* Item Block */}
        <Link to={`/item/${item.id}`} className="flex gap-4 mb-5 group">
          <img src={item.image} className="w-14 h-20 object-cover rounded shadow-sm ring-1 ring-white/10 group-hover:opacity-90 transition-opacity" />
          <div className="flex flex-col">
            <h2 className="font-bold text-xl text-zinc-100 leading-tight group-hover:underline line-clamp-2">{item.title}</h2>
            <span className="text-xs text-zinc-500 uppercase tracking-wider mt-1 block">{item.type} {item.year ? `• ${item.year}` : ''}</span>
            {item.watch_providers && item.watch_providers.length > 0 && (
              <div className="mt-auto pt-2 flex flex-wrap gap-1">
                {item.watch_providers.map(provider => (
                  <span key={provider} className="text-[10px] font-bold bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md">
                    {provider}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Link>

        {/* Message */}
        {recommendation.message && (
          <div className="bg-zinc-900/50 p-4 rounded-xl text-zinc-300 text-sm italic mb-6 border border-zinc-800/50 relative">
            <div className="absolute -top-2.5 left-4 bg-zinc-950 px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Mensagem
            </div>
            "{recommendation.message}"
          </div>
        )}

        {/* Actions (Interactive) */}
        {currentUser.id !== recommendation.from_user_id && currentUser.id !== recommendation.to_user_id ? (
          <div className="flex items-center gap-2 mb-3">
            <button 
              onClick={() => toggleInteraction(recommendation.id, 'support')} 
              className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-medium text-xs transition-colors border", userInteraction?.type === 'support' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "bg-transparent text-zinc-400 border-zinc-800/60 hover:bg-zinc-900 hover:text-zinc-300")}
            >
              <ThumbsUp size={14} className={userInteraction?.type === 'support' ? "fill-current" : ""} /> Assiste
            </button>
            <button 
              onClick={() => toggleInteraction(recommendation.id, 'oppose')} 
              className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-medium text-xs transition-colors border", userInteraction?.type === 'oppose' ? "bg-rose-500/10 text-rose-500 border-rose-500/30" : "bg-transparent text-zinc-400 border-zinc-800/60 hover:bg-zinc-900 hover:text-zinc-300")}
            >
              <ThumbsDown size={14} className={userInteraction?.type === 'oppose' ? "fill-current" : ""} /> Não assiste
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4 mb-3 bg-zinc-900/30 p-3 rounded-xl border border-zinc-800/50">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-emerald-500">
                <ThumbsUp size={12} className="fill-current" />
                <span>Assiste ({recInteractions.filter(i => i.type === 'support').length})</span>
              </div>
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {recInteractions.filter(i => i.type === 'support').length > 0 ? (
                    recInteractions.filter(i => i.type === 'support').slice(0, 5).map((i, idx) => {
                      const u = users.find(u => u.id === i.user_id);
                      return u ? <img key={i.id} src={u.avatar} alt={u.name} title={u.name} className="w-6 h-6 rounded-full border-2 border-zinc-950 object-cover relative" style={{ zIndex: idx }} /> : null;
                    })
                  ) : (
                    <span className="text-xs text-zinc-600 italic">Nenhum voto</span>
                  )}
                </div>
                {recInteractions.filter(i => i.type === 'support').length > 5 && (
                  <span className="text-xs text-zinc-500 ml-2 font-medium">+{recInteractions.filter(i => i.type === 'support').length - 5}</span>
                )}
              </div>
            </div>
            <div className="w-px h-10 bg-zinc-800/50"></div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-rose-500">
                <ThumbsDown size={12} className="fill-current" />
                <span>Não assiste ({recInteractions.filter(i => i.type === 'oppose').length})</span>
              </div>
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {recInteractions.filter(i => i.type === 'oppose').length > 0 ? (
                    recInteractions.filter(i => i.type === 'oppose').slice(0, 5).map((i, idx) => {
                      const u = users.find(u => u.id === i.user_id);
                      return u ? <img key={i.id} src={u.avatar} alt={u.name} title={u.name} className="w-6 h-6 rounded-full border-2 border-zinc-950 object-cover relative" style={{ zIndex: idx }} /> : null;
                    })
                  ) : (
                    <span className="text-xs text-zinc-600 italic">Nenhum voto</span>
                  )}
                </div>
                {recInteractions.filter(i => i.type === 'oppose').length > 5 && (
                  <span className="text-xs text-zinc-500 ml-2 font-medium">+{recInteractions.filter(i => i.type === 'oppose').length - 5}</span>
                )}
              </div>
            </div>
          </div>
        )}
        
        {currentUser.id === recommendation.to_user_id && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => updateUserItemStatus(item.id, 'watched')} 
              className={cn("flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors border", status === 'watched' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "bg-transparent text-zinc-500 border-zinc-800/60 hover:bg-zinc-900 hover:text-zinc-300")}
            >
              <Check size={14} /> <span className="text-[10px] font-medium uppercase tracking-wider">Já vi</span>
            </button>
            <button 
              onClick={() => updateUserItemStatus(item.id, 'saved')} 
              className={cn("flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors border", status === 'saved' ? "bg-blue-500/10 text-blue-500 border-blue-500/30" : "bg-transparent text-zinc-500 border-zinc-800/60 hover:bg-zinc-900 hover:text-zinc-300")}
            >
              <Bookmark size={14} className={status === 'saved' ? "fill-current" : ""} /> <span className="text-[10px] font-medium uppercase tracking-wider">Salvar</span>
            </button>
            <button 
              onClick={() => updateUserItemStatus(item.id, 'ignored')} 
              className={cn("flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors border", status === 'ignored' ? "bg-rose-500/10 text-rose-500 border-rose-500/30" : "bg-transparent text-zinc-500 border-zinc-800/60 hover:bg-zinc-900 hover:text-zinc-300")}
            >
              <X size={14} /> <span className="text-[10px] font-medium uppercase tracking-wider">Ignorar</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 bg-zinc-950 p-4 mt-2">
        <h3 className="font-bold text-sm text-zinc-500 uppercase tracking-wider mb-4">Comentários ({recComments.length})</h3>
        
        {!recommendation.discussion_enabled ? (
          <div className="text-center p-6 bg-zinc-900/50 rounded-xl text-zinc-500 text-sm ring-1 ring-zinc-800/50">
            Os comentários estão desativados para esta indicação.
          </div>
        ) : (
          <div className="space-y-4 mb-24">
            {recComments.map(comment => {
              const user = users.find(u => u.id === comment.user_id);
              if (!user) return null;
              
              return (
                <div key={comment.id} className="flex gap-3">
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-zinc-800" />
                  <div className="bg-zinc-900/50 p-3 rounded-2xl rounded-tl-none flex-1 ring-1 ring-zinc-800/50">
                    <p className="font-bold text-sm mb-0.5 text-zinc-200">{user.name}</p>
                    <p className="text-sm text-zinc-400">{comment.content}</p>
                  </div>
                </div>
              );
            })}
            {recComments.length === 0 && (
              <p className="text-center text-zinc-500 py-8 text-sm">Seja o primeiro a comentar.</p>
            )}
          </div>
        )}
      </div>

      {recommendation.discussion_enabled && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800/50 p-3 z-20">
          <div className="max-w-md mx-auto relative">
            <form onSubmit={handleSendComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicione um comentário..."
                className="flex-1 bg-zinc-900 rounded-full py-3 pl-4 pr-12 outline-none focus:ring-1 focus:ring-zinc-700 text-sm text-zinc-100 placeholder:text-zinc-500 ring-1 ring-zinc-800"
              />
              <button 
                type="submit"
                disabled={!newComment.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-100 disabled:text-zinc-600 transition-colors"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
