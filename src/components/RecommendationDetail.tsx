import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, Bookmark, Check, X, ArrowRight, MoreVertical, Trash2, Pencil } from 'lucide-react';
import { useStore } from '../store';
import { cn, getRelativeTime } from '../lib/utils';
import { getTMDBDetails, LOGO_IMG, TMDBDetails } from '../services/tmdb';

export function RecommendationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { recommendations, comments, users, items, currentUser, addComment, userItemStatuses, updateUserItemStatus, deleteRecommendation, editRecommendation } = useStore();

  const [newComment, setNewComment] = useState('');
  const [tmdb, setTmdb] = useState<TMDBDetails | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const recommendation = recommendations.find(r => r.id === id);
  const item = recommendation ? items.find(i => i.id === recommendation.item_id) : null;

  useEffect(() => {
    if (!item?.id.startsWith('tmdb_')) return;
    const tmdbId = Number(item.id.replace('tmdb_', ''));
    const mediaType = item.type === 'movie' ? 'movie' : 'tv';
    getTMDBDetails(tmdbId, mediaType).then(setTmdb);
  }, [item?.id]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  if (!recommendation) return <div className="p-8 text-center">Indicação não encontrada</div>;
  if (!item) return null;

  const fromUser = users.find(u => u.id === recommendation.from_user_id);
  const toUser = users.find(u => u.id === recommendation.to_user_id);
  if (!fromUser || !toUser) return null;

  const recComments = comments.filter(c => c.recommendation_id === recommendation.id);
  const status = userItemStatuses.find(s => s.item_id === item.id && s.user_id === currentUser.id)?.status;
  const isToUser = currentUser.id === recommendation.to_user_id;
  const isFromUser = currentUser.id === recommendation.from_user_id;
  const showMenu = isToUser || isFromUser;

  const handleStatusAction = (s: 'watched' | 'saved' | 'ignored') => {
    updateUserItemStatus(item.id, s);
    setMenuOpen(false);
  };

  const handleDelete = () => {
    deleteRecommendation(recommendation.id);
    navigate(-1);
  };

  const handleOpenDelete = () => {
    setMenuOpen(false);
    setShowDeleteConfirm(true);
  };

  const handleOpenEdit = () => {
    setEditMessage(recommendation.message ?? '');
    setMenuOpen(false);
    setShowEdit(true);
  };

  const handleSaveEdit = () => {
    editRecommendation(recommendation.id, editMessage.trim() || undefined);
    setShowEdit(false);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addComment(recommendation.id, newComment.trim());
    setNewComment('');
  };

  return (
    <div className="max-w-md mx-auto bg-zinc-950 min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-zinc-950/90 backdrop-blur-xl px-3 py-2.5 flex items-center border-b border-zinc-800/50">
        <button onClick={() => navigate(-1)} className="p-1 text-zinc-100 shrink-0">
          <ArrowLeft size={20} />
        </button>
      </header>

      {/* From → To + menu */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 text-sm">
          <Link to={`/profile/${fromUser.id}`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <img src={fromUser.avatar} className="w-6 h-6 rounded-full object-cover ring-1 ring-zinc-800" />
            <span className="font-semibold text-zinc-200">{fromUser.name}</span>
          </Link>
          <ArrowRight size={13} className="text-zinc-600 shrink-0" />
          <Link to={`/profile/${toUser.id}`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <img src={toUser.avatar} className="w-6 h-6 rounded-full object-cover ring-1 ring-zinc-800" />
            <span className="font-semibold text-zinc-200">{toUser.name}</span>
          </Link>
          <span className="text-xs text-zinc-600 shrink-0 ml-auto">{getRelativeTime(recommendation.created_at)}</span>

          {showMenu && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <MoreVertical size={16} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-30 overflow-hidden">
                  {isToUser && (
                    <>
                      <button onClick={() => handleStatusAction('watched')} className={cn("w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors hover:bg-zinc-800", status === 'watched' ? "text-emerald-400" : "text-zinc-300")}>
                        <Check size={15} /> Já vi
                      </button>
                      <button onClick={() => handleStatusAction('saved')} className={cn("w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors hover:bg-zinc-800 border-t border-zinc-800/60", status === 'saved' ? "text-blue-400" : "text-zinc-300")}>
                        <Bookmark size={15} className={status === 'saved' ? 'fill-current' : ''} /> Salvar
                      </button>
                      <button onClick={() => handleStatusAction('ignored')} className={cn("w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors hover:bg-zinc-800 border-t border-zinc-800/60", status === 'ignored' ? "text-rose-400" : "text-zinc-300")}>
                        <X size={15} /> Ignorar
                      </button>
                    </>
                  )}
                  {isFromUser && (
                    <>
                      <button onClick={handleOpenEdit} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-800">
                        <Pencil size={15} /> Editar mensagem
                      </button>
                      <button onClick={handleOpenDelete} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-rose-400 transition-colors hover:bg-zinc-800 border-t border-zinc-800/60">
                        <Trash2 size={15} /> Excluir indicação
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Film block */}
      <div className="px-4 pb-3 border-b border-zinc-800/50">
        <div className="flex gap-2.5 items-stretch">
          <Link to={`/item/${item.id}`} className="shrink-0">
            <img src={item.image} alt={item.title} className="w-14 h-20 object-cover rounded-lg ring-1 ring-white/10" />
          </Link>
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
            <Link to={`/item/${item.id}`}>
              <h2 className="font-bold text-sm text-zinc-100 leading-snug line-clamp-2 hover:underline">{item.title}</h2>
            </Link>
            {(item.year || tmdb?.country) && (
              <p className="text-[11px] text-zinc-500">
                {[item.year, tmdb?.country].filter(Boolean).join(' · ')}
              </p>
            )}
            {tmdb?.provider_logos && tmdb.provider_logos.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-0.5">
                {tmdb.provider_logos.map(p => (
                  <img key={p.name} src={`${LOGO_IMG}${p.logo_path}`} alt={p.name} title={p.name} className="w-5 h-5 rounded-md object-cover" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message */}
      {recommendation.message && (
        <div className="px-4 py-2.5 border-b border-zinc-800/50 bg-zinc-900/20">
          <p className="text-xs text-zinc-400 italic leading-relaxed">"{recommendation.message}"</p>
        </div>
      )}

      {/* Comments */}
      <div className="flex-1 px-3 py-3 pb-20">
        {!recommendation.discussion_enabled ? (
          <p className="text-center text-zinc-600 text-xs py-8">Discussão desativada para esta indicação.</p>
        ) : (
          <>
            <p className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider mb-3">
              {recComments.length > 0 ? `${recComments.length} comentário${recComments.length > 1 ? 's' : ''}` : 'Comentários'}
            </p>
            <div className="space-y-3">
              {recComments.map(comment => {
                const user = users.find(u => u.id === comment.user_id);
                if (!user) return null;
                return (
                  <div key={comment.id} className="flex gap-2">
                    <Link to={`/profile/${user.id}`} className="shrink-0">
                      <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover ring-1 ring-zinc-800" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="bg-zinc-900/60 px-3 py-2 rounded-xl rounded-tl-sm ring-1 ring-zinc-800/50">
                        <Link to={`/profile/${user.id}`} className="text-xs font-bold text-zinc-200 mb-0.5 hover:underline block">
                          {user.name}
                        </Link>
                        <p className="text-xs text-zinc-400 leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {recComments.length === 0 && (
                <p className="text-center text-zinc-600 text-xs py-6">Seja o primeiro a comentar.</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Comment input */}
      {recommendation.discussion_enabled && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/50 px-3 py-2 z-20">
          <div className="max-w-md mx-auto">
            <form onSubmit={handleSendComment} className="flex items-center gap-2 relative">
              <img src={currentUser.avatar} className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-zinc-800" />
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Comentar..."
                className="flex-1 bg-zinc-900 rounded-full py-2 pl-4 pr-10 text-xs text-zinc-100 placeholder:text-zinc-600 ring-1 ring-zinc-800 outline-none focus:ring-zinc-700"
              />
              <button type="submit" disabled={!newComment.trim()} className="absolute right-1 p-1.5 text-zinc-100 disabled:text-zinc-700 transition-colors">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-800 p-5 shadow-xl">
            <h2 className="font-bold text-base text-zinc-100 mb-1">Excluir indicação?</h2>
            <p className="text-sm text-zinc-400 mb-6">Esta ação não pode ser desfeita. A indicação e todos os comentários serão removidos.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-sm font-bold text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-sm font-bold text-white hover:bg-rose-400 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit message modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowEdit(false)}>
          <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-auto bg-zinc-900 rounded-t-2xl border-t border-zinc-800 p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm text-zinc-100">Editar mensagem</h2>
              <button onClick={() => setShowEdit(false)} className="text-zinc-500 hover:text-zinc-300 p-1">
                <X size={18} />
              </button>
            </div>
            <textarea
              value={editMessage}
              onChange={e => setEditMessage(e.target.value)}
              rows={4}
              maxLength={280}
              placeholder="Mensagem opcional..."
              className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 ring-1 ring-zinc-700 outline-none focus:ring-zinc-600 resize-none mb-1"
            />
            <div className="text-right text-xs text-zinc-600 mb-4">{editMessage.length}/280</div>
            <button onClick={handleSaveEdit} className="w-full bg-zinc-100 text-zinc-950 font-bold py-2.5 rounded-xl hover:bg-white transition-colors text-sm">
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
