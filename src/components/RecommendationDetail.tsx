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
import { RecommendationComposerForm } from './RecommendationComposerForm';
import { Recommendation } from '../types';

const VISIBILITY_CONFIG = {
  private: { icon: Lock, label: 'Privado' },
  connections: { icon: Users, label: 'Círculo' },
  public: { icon: Globe, label: 'Público' },
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
  const [statusSheetActive, setStatusSheetActive] = useState(false);
  const [statusSheetDragging, setStatusSheetDragging] = useState(false);
  const [statusSheetOffset, setStatusSheetOffset] = useState(0);
  const [showEdit, setShowEdit] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [editVisibility, setEditVisibility] = useState<Recommendation['visibility']>('connections');
  const [editDiscussionEnabled, setEditDiscussionEnabled] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [card, setCard] = useState<RecommendationCardData | null>(null);
  const [cardLoading, setCardLoading] = useState(true);
  const [cardNotFound, setCardNotFound] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const statusSheetRef = useRef<HTMLDivElement>(null);
  const statusSheetCloseTimerRef = useRef<number | null>(null);
  const statusSheetDragStartRef = useRef<number | null>(null);

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

  useEffect(() => {
    return () => {
      if (statusSheetCloseTimerRef.current) {
        window.clearTimeout(statusSheetCloseTimerRef.current);
      }
    };
  }, []);

  if (dataLoading || cardLoading) return <LoadingScreen />;
  if (cardNotFound || !card) return <div className="p-8 text-center">Indicação não encontrada</div>;

  const { recommendation, item, fromUser, toUser, comments } = card;
  const displayYear = item.year ?? tmdb?.year;
  const status = userItemStatuses.find(itemStatus => itemStatus.item_id === item.id && itemStatus.user_id === currentUser.id)?.status;
  const isToUser = currentUser.id === recommendation.to_user_id;
  const isFromUser = currentUser.id === recommendation.from_user_id;
  const showMenu = isToUser || isFromUser;

  const openStatusSheet = () => {
    if (statusSheetCloseTimerRef.current) {
      window.clearTimeout(statusSheetCloseTimerRef.current);
      statusSheetCloseTimerRef.current = null;
    }

    setShowStatusSheet(true);
    setStatusSheetDragging(false);
    setStatusSheetOffset(0);
    window.requestAnimationFrame(() => setStatusSheetActive(true));
  };

  const closeStatusSheet = () => {
    if (statusSheetCloseTimerRef.current) {
      window.clearTimeout(statusSheetCloseTimerRef.current);
    }

    statusSheetDragStartRef.current = null;
    setStatusSheetDragging(false);
    setStatusSheetOffset(0);
    setStatusSheetActive(false);
    statusSheetCloseTimerRef.current = window.setTimeout(() => {
      setShowStatusSheet(false);
      statusSheetCloseTimerRef.current = null;
    }, 260);
  };

  const handleStatusSheetPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    statusSheetDragStartRef.current = event.clientY;
    setStatusSheetDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleStatusSheetPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (statusSheetDragStartRef.current === null) return;
    const nextOffset = Math.max(0, event.clientY - statusSheetDragStartRef.current);
    setStatusSheetOffset(nextOffset);
  };

  const handleStatusSheetPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (statusSheetDragStartRef.current === null) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const sheetHeight = statusSheetRef.current?.offsetHeight ?? 0;
    const closeThreshold = Math.min(160, Math.max(90, sheetHeight * 0.22));
    const shouldClose = statusSheetOffset > closeThreshold;

    statusSheetDragStartRef.current = null;
    setStatusSheetDragging(false);
    setStatusSheetOffset(0);

    if (shouldClose) closeStatusSheet();
    else setStatusSheetActive(true);
  };

  const handleStatusAction = async (nextStatus: 'watched' | 'saved' | 'ignored') => {
    await updateUserItemStatus(item.id, nextStatus);
    setMenuOpen(false);
    closeStatusSheet();
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
    setEditVisibility(recommendation.visibility);
    setEditDiscussionEnabled(recommendation.discussion_enabled);
    setMenuOpen(false);
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    setIsSavingEdit(true);
    try {
      const updatedRecommendation = await editRecommendation(recommendation.id, {
        message: editMessage.trim() || undefined,
        visibility: editVisibility,
        discussion_enabled: editDiscussionEnabled,
      });
      if (updatedRecommendation) {
        setCard(previous => previous ? { ...previous, recommendation: updatedRecommendation } : previous);
        setShowEdit(false);
      }
    } finally {
      setIsSavingEdit(false);
    }
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
    <div className="max-w-md mx-auto bg-zinc-950 min-h-screen flex flex-col lg:max-w-none lg:pb-12">
      <header className="bg-zinc-950/90 backdrop-blur-xl px-3 py-2.5 flex items-center border-b border-zinc-800/50 lg:bg-transparent lg:backdrop-blur-none lg:border-b-0 lg:px-0 lg:py-0">
        <button onClick={() => navigate(-1)} className="p-1 text-zinc-100 shrink-0">
          <ArrowLeft size={20} />
        </button>
      </header>

      <div className="px-4 pt-3 pb-2 lg:max-w-[860px] lg:px-0 lg:pt-8">
        <div className="flex items-center gap-2 text-sm">
          <Link to={`/profile/${fromUser.id}`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <img src={fromUser.avatar} alt={fromUser.name} className="w-6 h-6 rounded-full object-cover ring-1 ring-zinc-800" />
            <span className="font-medium text-zinc-200">{fromUser.name}</span>
          </Link>
          <ArrowRight size={13} className="text-zinc-600 shrink-0" />
          <Link to={`/profile/${toUser.id}`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <img src={toUser.avatar} alt={toUser.name} className="w-6 h-6 rounded-full object-cover ring-1 ring-zinc-800" />
            <span className="font-medium text-zinc-200">{toUser.name}</span>
          </Link>
          <span className="text-xs text-zinc-600 shrink-0 ml-auto">{getRelativeTime(recommendation.created_at)}</span>

          {showMenu && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => {
                  if (isToUser) {
                    openStatusSheet();
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

      <div className="px-4 pb-3 border-b border-zinc-800/50 lg:max-w-[860px] lg:px-0 lg:pb-6">
        <div className="flex gap-2.5 items-stretch lg:grid lg:grid-cols-[120px_minmax(0,1fr)] lg:gap-5">
          <Link to={`/item/${item.id}`} className="shrink-0">
            <img src={item.image} alt={item.title} className="w-14 h-20 object-cover rounded-lg ring-1 ring-white/10 lg:h-40 lg:w-28" />
          </Link>
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
            <Link to={`/item/${item.id}`}>
              <h2 className="font-semibold text-sm text-zinc-100 leading-snug line-clamp-2 hover:underline lg:text-[28px] lg:leading-tight lg:font-medium">{item.title}</h2>
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
        <div className="px-4 py-2.5 border-b border-zinc-800/50 bg-zinc-900/20 lg:max-w-[860px] lg:px-0 lg:bg-transparent lg:py-5">
          <p className="text-xs text-zinc-400 italic leading-relaxed lg:text-[15px]">"{recommendation.message}"</p>
        </div>
      )}

      <div className="flex-1 px-3 py-3 pb-20 lg:max-w-[860px] lg:px-0 lg:py-6">
        {!recommendation.discussion_enabled ? (
          <p className="text-center text-zinc-600 text-xs py-8">Discussão desativada para esta indicação.</p>
        ) : (
          <>
            <p className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider mb-3">
              {comments.length > 0 ? `${comments.length} comentário${comments.length > 1 ? 's' : ''}` : 'Comentários'}
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
                      <div className="bg-zinc-900/60 px-3 py-2 rounded-xl rounded-tl-sm ring-1 ring-zinc-800/50 lg:bg-transparent lg:px-0 lg:py-0 lg:ring-0">
                        <Link to={`/profile/${comment.user.id}`} className="text-xs font-medium text-zinc-200 mb-0.5 hover:underline block">
                          {comment.user.name}
                        </Link>
                        <p className="text-xs text-zinc-400 leading-relaxed lg:text-sm">{comment.content}</p>
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
          <div className="max-w-md mx-auto lg:max-w-[860px]">
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
        <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center" onClick={closeStatusSheet}>
          <div
            className={cn(
              'absolute inset-0 bg-zinc-950/55 transition-opacity duration-200',
              statusSheetActive ? 'opacity-100' : 'opacity-0'
            )}
          />
          <div
            ref={statusSheetRef}
            className={cn(
              'relative w-full max-w-md mx-auto rounded-t-[32px] border-t border-zinc-700 bg-zinc-800/95 px-5 pb-8 pt-3 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:max-w-lg lg:rounded-3xl lg:border lg:px-6 lg:pt-5',
              statusSheetActive ? 'translate-y-0' : 'translate-y-full'
            )}
            style={statusSheetDragging ? { transform: `translateY(${statusSheetOffset}px)`, transitionDuration: '0ms' } : undefined}
            onClick={event => event.stopPropagation()}
          >
            <div
              className="touch-none select-none"
              onPointerDown={handleStatusSheetPointerDown}
              onPointerMove={handleStatusSheetPointerMove}
              onPointerUp={handleStatusSheetPointerEnd}
              onPointerCancel={handleStatusSheetPointerEnd}
            >
              <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-zinc-500/70" />
            </div>
            <div
              className="border-b border-zinc-700/70 pb-5 text-center touch-none"
              onPointerDown={handleStatusSheetPointerDown}
              onPointerMove={handleStatusSheetPointerMove}
              onPointerUp={handleStatusSheetPointerEnd}
              onPointerCancel={handleStatusSheetPointerEnd}
            >
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
        <div className="fixed inset-0 z-50 bg-zinc-950">
          <div className="mx-auto flex min-h-screen max-w-md flex-col bg-zinc-950 lg:max-w-none">
            <header className="flex items-center gap-3 border-b border-zinc-800/50 bg-zinc-950/95 px-4 py-2.5 backdrop-blur-xl lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none lg:border-b-0">
              <button onClick={() => setShowEdit(false)} className="p-1 text-zinc-100">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-sm font-bold text-zinc-100">Editar indicação</h2>
            </header>

            <div className="flex-1 overflow-y-auto p-4 lg:max-w-[980px] lg:px-0 lg:pt-8">
              <RecommendationComposerForm
                item={item}
                user={toUser}
                message={editMessage}
                visibility={editVisibility}
                discussionEnabled={editDiscussionEnabled}
                submitLabel={isSavingEdit ? 'Salvando...' : 'Salvar alterações'}
                onMessageChange={setEditMessage}
                onVisibilityChange={setEditVisibility}
                onDiscussionEnabledChange={setEditDiscussionEnabled}
                onSubmit={handleSaveEdit}
                submitting={isSavingEdit}
              />
            </div>
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
