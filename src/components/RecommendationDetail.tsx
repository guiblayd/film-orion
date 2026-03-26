import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Bookmark,
  Check,
  X,
  ArrowRight,
  MoreVertical,
  Trash2,
  Pencil,
  Lock,
  Users,
  Globe,
  Eye,
} from 'lucide-react';
import { useStore } from '../store';
import { cn, getRelativeTime } from '../lib/utils';
import { getTMDBDetails, TMDBDetails } from '../services/tmdb';
import { fetchRecommendationCardById, RecommendationCardData } from '../services/recommendations';
import { LoadingScreen } from './LoadingScreen';

const VISIBILITY_CONFIG = {
  private: { icon: Lock, label: 'Privado' },
  connections: { icon: Users, label: 'Circulo' },
  public: { icon: Globe, label: 'Publico' },
} as const;

export function RecommendationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    dataLoading,
    users,
    currentUser,
    addComment,
    userItemStatuses,
    updateUserItemStatus,
    deleteRecommendation,
    editRecommendation,
  } = useStore();

  const [newComment, setNewComment] = useState('');
  const [tmdb, setTmdb] = useState<TMDBDetails | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [card, setCard] = useState<RecommendationCardData | null>(null);
  const [cardLoading, setCardLoading] = useState(true);
  const [cardNotFound, setCardNotFound] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) {
      setCard(null);
      setCardNotFound(true);
      setCardLoading(false);
      return;
    }

    if (dataLoading || users.length === 0) {
      setCardLoading(true);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setCardLoading(true);
      setCardNotFound(false);

      const nextCard = await fetchRecommendationCardById(id, users);
      if (cancelled) return;

      setCard(nextCard);
      setCardNotFound(!nextCard);
      setCardLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [id, users, dataLoading]);

  useEffect(() => {
    if (!card?.item.id.startsWith('tmdb_')) {
      setTmdb(null);
      return;
    }

    let cancelled = false;
    const tmdbId = Number(card.item.id.replace('tmdb_', ''));
    const mediaType = card.item.type === 'movie' ? 'movie' : 'tv';

    setTmdb(null);
    getTMDBDetails(tmdbId, mediaType).then(details => {
      if (!cancelled) setTmdb(details);
    });

    return () => {
      cancelled = true;
    };
  }, [card?.item.id, card?.item.type]);

  useEffect(() => {
    if (!menuOpen) return;

    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  if (dataLoading || cardLoading) return <LoadingScreen />;
  if (cardNotFound || !card) return <div className="p-8 text-center">Indicacao nao encontrada</div>;

  const { recommendation, item, fromUser, toUser, comments } = card;
  const displayYear = item.year ?? tmdb?.year;
  const status = userItemStatuses.find(itemStatus => itemStatus.item_id === item.id && itemStatus.user_id === currentUser.id)?.status;
  const isToUser = currentUser.id === recommendation.to_user_id;
  const isFromUser = currentUser.id === recommendation.from_user_id;
  const showMenu = isToUser || isFromUser;

  const handleStatusAction = async (nextStatus: 'watched' | 'saved' | 'ignored') => {
    await updateUserItemStatus(item.id, nextStatus);
    setMenuOpen(false);
    setShowStatusSheet(false);
  };

  const handleDelete = async () => {
    await deleteRecommendation(recommendation.id);
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

  const handleSaveEdit = async () => {
    const updatedRecommendation = await editRecommendation(recommendation.id, editMessage.trim() || undefined);
    if (updatedRecommendation) {
      setCard(previous => previous ? { ...previous, recommendation: updatedRecommendation } : previous);
    }
    setShowEdit(false);
  };

  const handleSendComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newComment.trim()) return;

    const createdComment = await addComment(recommendation.id, newComment.trim());
    if (createdComment) {
      setCard(previous => previous ? {
        ...previous,
        comments: [
          ...previous.comments,
          { ...createdComment, user: currentUser },
        ],
      } : previous);
      setNewComment('');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-zinc-950 min-h-screen flex flex-col lg:max-w-3xl">
      <header className="bg-zinc-950/90 backdrop-blur-xl px-3 py-2.5 flex items-center border-b border-zinc-800/50 lg:rounded-b-2xl">
        <button onClick={() => navigate(-1)} className="p-1 text-zinc-100 shrink-0">
          <ArrowLeft size={20} />
        </button>
      </header>

      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 text-sm">
          <Link to={`/profile/${fromUser.id}`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <img src={fromUser.avatar} alt={fromUser.name} className="w-6 h-6 rounded-full object-cover ring-1 ring-zinc-800" />
            <span className="font-semibold text-zinc-200">{fromUser.name}</span>
          </Link>
          <ArrowRight size={13} className="text-zinc-600 shrink-0" />
          <Link to={`/profile/${toUser.id}`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <img src={toUser.avatar} alt={toUser.name} className="w-6 h-6 rounded-full object-cover ring-1 ring-zinc-800" />
            <span className="font-semibold text-zinc-200">{toUser.name}</span>
          </Link>
          <span className="text-xs text-zinc-600 shrink-0 ml-auto">{getRelativeTime(recommendation.created_at)}</span>

          {showMenu && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => {
                  if (isToUser) {
                    setShowStatusSheet(true);
                    return;
                  }

                  setMenuOpen(value => !value);
                }}
                className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <MoreVertical size={16} />
              </button>
              {menuOpen && !isToUser && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-30 overflow-hidden">
                  {isFromUser && (
                    <>
                      <button onClick={handleOpenEdit} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-800">
                        <Pencil size={15} /> Editar mensagem
                      </button>
                      <button onClick={handleOpenDelete} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-rose-400 transition-colors hover:bg-zinc-800 border-t border-zinc-800/60">
                        <Trash2 size={15} /> Excluir indicacao
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-3 border-b border-zinc-800/50">
        <div className="flex gap-2.5 items-stretch">
          <Link to={`/item/${item.id}`} className="shrink-0">
            <img src={item.image} alt={item.title} className="w-14 h-20 object-cover rounded-lg ring-1 ring-white/10" />
          </Link>
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
            <Link to={`/item/${item.id}`}>
              <h2 className="font-bold text-sm text-zinc-100 leading-snug line-clamp-2 hover:underline">{item.title}</h2>
            </Link>
            {(displayYear || tmdb?.country) && (
              <p className="text-[11px] text-zinc-500">
                {[displayYear, tmdb?.country].filter(Boolean).join(' · ')}
              </p>
            )}
            {(() => {
              const visibilityConfig = VISIBILITY_CONFIG[recommendation.visibility as keyof typeof VISIBILITY_CONFIG];
              if (!visibilityConfig) return null;
              const Icon = visibilityConfig.icon;
              return <Icon size={12} className="text-zinc-600 mt-1" />;
            })()}
          </div>
        </div>
      </div>

      {recommendation.message && (
        <div className="px-4 py-2.5 border-b border-zinc-800/50 bg-zinc-900/20">
          <p className="text-xs text-zinc-400 italic leading-relaxed">"{recommendation.message}"</p>
        </div>
      )}

      <div className="flex-1 px-3 py-3 pb-20">
        {!recommendation.discussion_enabled ? (
          <p className="text-center text-zinc-600 text-xs py-8">Discussao desativada para esta indicacao.</p>
        ) : (
          <>
            <p className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider mb-3">
              {comments.length > 0 ? `${comments.length} comentario${comments.length > 1 ? 's' : ''}` : 'Comentarios'}
            </p>
            <div className="space-y-3">
              {comments.map(comment => {
                if (!comment.user) return null;
                return (
                  <div key={comment.id} className="flex gap-2">
                    <Link to={`/profile/${comment.user.id}`} className="shrink-0">
                      <img src={comment.user.avatar} alt={comment.user.name} className="w-7 h-7 rounded-full object-cover ring-1 ring-zinc-800" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="bg-zinc-900/60 px-3 py-2 rounded-xl rounded-tl-sm ring-1 ring-zinc-800/50">
                        <Link to={`/profile/${comment.user.id}`} className="text-xs font-bold text-zinc-200 mb-0.5 hover:underline block">
                          {comment.user.name}
                        </Link>
                        <p className="text-xs text-zinc-400 leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {comments.length === 0 && (
                <p className="text-center text-zinc-600 text-xs py-6">Seja o primeiro a comentar.</p>
              )}
            </div>
          </>
        )}
      </div>

      {recommendation.discussion_enabled && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/50 px-3 py-2 z-20">
          <div className="max-w-md mx-auto lg:max-w-3xl">
            <form onSubmit={handleSendComment} className="flex items-center gap-2 relative">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-zinc-800" />
              <input
                type="text"
                value={newComment}
                onChange={event => setNewComment(event.target.value)}
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

      {showStatusSheet && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowStatusSheet(false)}>
          <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md mx-auto rounded-t-[32px] border-t border-zinc-700 bg-zinc-800/95 px-5 pb-8 pt-3 shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-zinc-500/70" />
            <div className="border-b border-zinc-700/70 pb-5 text-center">
              <h2 className="text-2xl font-medium tracking-tight text-zinc-100">{item.title}</h2>
              {displayYear && <p className="mt-1 text-lg text-zinc-400">{displayYear}</p>}
            </div>

            <div className="grid grid-cols-3 divide-x divide-zinc-700/70">
              <StatusAction
                label="Ja vi"
                active={status === 'watched'}
                tone="watched"
                icon={<Eye size={34} strokeWidth={1.75} />}
                onClick={() => void handleStatusAction('watched')}
              />
              <StatusAction
                label="Ignorar"
                active={status === 'ignored'}
                tone="ignored"
                icon={<X size={34} strokeWidth={1.75} />}
                onClick={() => void handleStatusAction('ignored')}
              />
              <StatusAction
                label="Salvar"
                active={status === 'saved'}
                tone="saved"
                icon={<Bookmark size={34} strokeWidth={1.75} className={status === 'saved' ? 'fill-current' : ''} />}
                onClick={() => void handleStatusAction('saved')}
              />
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-800 p-5 shadow-xl">
            <h2 className="font-bold text-base text-zinc-100 mb-1">Excluir indicacao?</h2>
            <p className="text-sm text-zinc-400 mb-6">Esta acao nao pode ser desfeita. A indicacao e todos os comentarios serao removidos.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-sm font-bold text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleDelete()}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-sm font-bold text-white hover:bg-rose-400 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowEdit(false)}>
          <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-auto bg-zinc-900 rounded-t-2xl border-t border-zinc-800 p-5" onClick={event => event.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm text-zinc-100">Editar mensagem</h2>
              <button onClick={() => setShowEdit(false)} className="text-zinc-500 hover:text-zinc-300 p-1">
                <X size={18} />
              </button>
            </div>
            <textarea
              value={editMessage}
              onChange={event => setEditMessage(event.target.value)}
              rows={4}
              maxLength={280}
              placeholder="Mensagem opcional..."
              className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 ring-1 ring-zinc-700 outline-none focus:ring-zinc-600 resize-none mb-1"
            />
            <div className="text-right text-xs text-zinc-600 mb-4">{editMessage.length}/280</div>
            <button onClick={() => void handleSaveEdit()} className="w-full bg-zinc-100 text-zinc-950 font-bold py-2.5 rounded-xl hover:bg-white transition-colors text-sm">
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusAction({
  label,
  icon,
  active,
  tone,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  tone: 'watched' | 'ignored' | 'saved';
  onClick: () => void;
}) {
  const activeStyles = {
    watched: 'text-emerald-400',
    ignored: 'text-rose-400',
    saved: 'text-sky-400',
  } as const;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-3 py-8 text-zinc-400 transition-colors hover:text-zinc-100',
        active && activeStyles[tone]
      )}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
