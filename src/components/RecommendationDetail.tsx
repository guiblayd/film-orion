import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Bookmark,
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
import { DesktopFrame, DesktopPage } from './DesktopFrame';
import { LoadingScreen } from './LoadingScreen';
import { RecommendationComposerForm } from './RecommendationComposerForm';
import { Recommendation } from '../types';

const COPY = {
  notFound: 'Indica\u00e7\u00e3o n\u00e3o encontrada',
  circle: 'C\u00edrculo',
  public: 'P\u00fablico',
  editRecommendation: 'Editar indica\u00e7\u00e3o',
  deleteRecommendation: 'Excluir indica\u00e7\u00e3o',
  messageLabel: 'Mensagem',
  noMessage: 'Sem mensagem adicionada nesta indica\u00e7\u00e3o.',
  discussionDisabled: 'Discuss\u00e3o desativada para esta indica\u00e7\u00e3o.',
  comments: 'Coment\u00e1rios',
  commentSingular: 'coment\u00e1rio',
  visitorDiscussionHint: 'Modo visitante: voc\u00ea pode ler a conversa, mas sem comentar ou atualizar status.',
  visitorReadOnlyHint: 'Modo visitante: leitura liberada, intera\u00e7\u00f5es bloqueadas.',
  discussionLabel: 'Discuss\u00e3o',
  watched: 'J\u00e1 vi',
  deleteTitle: 'Excluir indica\u00e7\u00e3o?',
  deleteDescription: 'Esta a\u00e7\u00e3o n\u00e3o pode ser desfeita. A indica\u00e7\u00e3o e todos os coment\u00e1rios ser\u00e3o removidos.',
  saveChanges: 'Salvar altera\u00e7\u00f5es',
} as const;

const VISIBILITY_CONFIG = {
  private: { icon: Lock, label: 'Privado' },
  connections: { icon: Users, label: COPY.circle },
  public: { icon: Globe, label: COPY.public },
} as const;

export function RecommendationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    dataLoading,
    users,
    currentUser,
    isReadOnly,
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
  const [editHasSpoiler, setEditHasSpoiler] = useState(false);
  const [editVisibility, setEditVisibility] = useState<Recommendation['visibility']>('connections');
  const [editDiscussionEnabled, setEditDiscussionEnabled] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
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
    void getTMDBDetails(tmdbId, mediaType).then(details => {
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
  if (cardNotFound || !card) return <div className="p-8 text-center">{COPY.notFound}</div>;

  const { recommendation, item, fromUser, toUser, comments } = card;
  const displayYear = item.year ?? tmdb?.year;
  const status = userItemStatuses.find(itemStatus => itemStatus.item_id === item.id && itemStatus.user_id === currentUser.id)?.status;
  const isToUser = currentUser.id === recommendation.to_user_id;
  const isFromUser = currentUser.id === recommendation.from_user_id;
  const showMenu = !isReadOnly && (isToUser || isFromUser);
  const visibilityConfig = VISIBILITY_CONFIG[recommendation.visibility as keyof typeof VISIBILITY_CONFIG];
  const VisibilityIcon = visibilityConfig?.icon;

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
    setEditHasSpoiler(recommendation.has_spoiler);
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
        has_spoiler: editHasSpoiler,
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
    <DesktopFrame>
      <DesktopPage width="detail" className="mx-auto flex min-h-screen max-w-md flex-col bg-zinc-950 lg:bg-transparent">
        <header className="flex items-center gap-3 border-b border-zinc-800/50 bg-zinc-950/90 px-3 py-2.5 backdrop-blur-xl lg:border-b-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
          <button onClick={() => navigate(-1)} className="shrink-0 p-1 text-zinc-100">
            <ArrowLeft size={20} />
          </button>
        </header>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-10 lg:pt-6">
          <div className="min-w-0">
            <div className="px-4 pt-3 pb-2 lg:px-0 lg:pt-0 lg:pb-0">
              <article className="lg:py-4">
                <div className="flex items-center gap-2 text-sm">
                  <Link to={`/profile/${fromUser.id}`} className="flex items-center gap-1.5 transition-opacity hover:opacity-80">
                    <img src={fromUser.avatar} alt={fromUser.name} className="h-6 w-6 rounded-full object-cover ring-1 ring-zinc-800" />
                    <span className="font-medium text-zinc-200">{fromUser.name}</span>
                  </Link>
                  <ArrowRight size={13} className="shrink-0 text-zinc-600" />
                  <Link to={`/profile/${toUser.id}`} className="flex items-center gap-1.5 transition-opacity hover:opacity-80">
                    <img src={toUser.avatar} alt={toUser.name} className="h-6 w-6 rounded-full object-cover ring-1 ring-zinc-800" />
                    <span className="font-medium text-zinc-200">{toUser.name}</span>
                  </Link>
                  <span className="ml-auto shrink-0 text-xs text-zinc-600">{getRelativeTime(recommendation.created_at)}</span>

                  {showMenu ? (
                    <div className="relative" ref={menuRef}>
                      <button
                        onClick={() => {
                          if (isToUser) {
                            openStatusSheet();
                            return;
                          }

                          setMenuOpen(value => !value);
                        }}
                        className="p-1 text-zinc-500 transition-colors hover:text-zinc-300"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {menuOpen && !isToUser ? (
                        <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl">
                          {isFromUser ? (
                            <>
                              <button onClick={handleOpenEdit} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-800">
                                <Pencil size={15} /> {COPY.editRecommendation}
                              </button>
                              <button onClick={handleOpenDelete} className="flex w-full items-center gap-2.5 border-t border-zinc-800/60 px-4 py-3 text-sm text-rose-400 transition-colors hover:bg-zinc-800">
                                <Trash2 size={15} /> {COPY.deleteRecommendation}
                              </button>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 flex items-stretch gap-2.5 lg:hidden">
                  <Link to={`/item/${item.id}`} className="shrink-0">
                    <img src={item.image} alt={item.title} className="h-20 w-14 rounded-lg object-cover ring-1 ring-white/10" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                    <Link to={`/item/${item.id}`}>
                      <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-100 hover:underline">{item.title}</h2>
                    </Link>
                    {(displayYear || tmdb?.country) ? (
                      <p className="text-[11px] text-zinc-500">
                        {[displayYear, tmdb?.country].filter(Boolean).join(' \u00b7 ')}
                      </p>
                    ) : null}
                    {VisibilityIcon ? <VisibilityIcon size={12} className="mt-1 text-zinc-600" /> : null}
                  </div>
                </div>

                <div className="mt-6 hidden lg:block">
                  <Link to={`/item/${item.id}`}>
                    <h2 className="text-[40px] font-medium leading-[1.05] tracking-tight text-zinc-100 transition-opacity hover:opacity-85">
                      {item.title}
                    </h2>
                  </Link>
                  {(displayYear || tmdb?.country) ? (
                    <p className="mt-3 text-base text-zinc-500">
                      {[displayYear, tmdb?.country].filter(Boolean).join(' \u00b7 ')}
                    </p>
                  ) : null}
                </div>

                {recommendation.message ? (
                  <div className="mt-5 border-t border-zinc-800/60 pt-5 lg:mt-7 lg:pt-7">
                    <div className="mb-3 flex items-center gap-2">
                      <p className="text-xs text-zinc-500">{COPY.messageLabel}</p>
                      {recommendation.has_spoiler && (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">spoiler</span>
                      )}
                    </div>
                    {recommendation.has_spoiler && !spoilerRevealed ? (
                      <button
                        type="button"
                        onClick={() => setSpoilerRevealed(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 py-4 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-300 lg:rounded-2xl lg:py-5 lg:text-sm"
                      >
                        <Eye size={14} />
                        Revelar mensagem
                      </button>
                    ) : (
                      <p className="text-sm leading-relaxed text-zinc-300 lg:text-[17px] lg:leading-8">
                        {recommendation.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-5 border-t border-zinc-800/60 pt-5 lg:mt-7 lg:pt-7">
                    <p className="text-sm text-zinc-500 lg:text-base">{COPY.noMessage}</p>
                  </div>
                )}
              </article>
            </div>

            <div className="flex-1 px-3 py-3 pb-24 lg:px-0 lg:py-6">
              <section className="border-t border-zinc-800/50 pt-6 lg:pt-7">
                {!recommendation.discussion_enabled ? (
                  <p className="py-8 text-center text-xs text-zinc-600 lg:py-16 lg:text-base">{COPY.discussionDisabled}</p>
                ) : (
                  <>
                    <p className="mb-3 text-xs text-zinc-600 lg:mb-5">
                      {comments.length > 0 ? `${comments.length} ${COPY.commentSingular}${comments.length > 1 ? 's' : ''}` : COPY.comments}
                    </p>

                    <div className="space-y-3 lg:space-y-5">
                      {comments.map(comment => {
                        if (!comment.user) return null;
                        return (
                          <div key={comment.id} className="flex gap-2.5 lg:gap-4">
                            <Link to={`/profile/${comment.user.id}`} className="shrink-0">
                              <img src={comment.user.avatar} alt={comment.user.name} className="h-7 w-7 rounded-full object-cover ring-1 ring-zinc-800 lg:h-10 lg:w-10" />
                            </Link>
                            <div className="min-w-0 flex-1">
                              <div className="rounded-xl rounded-tl-sm bg-zinc-900/60 px-3 py-2 ring-1 ring-zinc-800/50 lg:rounded-2xl lg:rounded-tl-md lg:bg-transparent lg:px-0 lg:py-0 lg:ring-0">
                                <Link to={`/profile/${comment.user.id}`} className="mb-0.5 block text-xs font-medium text-zinc-200 hover:underline lg:text-sm">
                                  {comment.user.name}
                                </Link>
                                <p className="text-xs leading-relaxed text-zinc-400 lg:text-base lg:leading-8">{comment.content}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {comments.length === 0 ? (
                        <p className="py-6 text-center text-xs text-zinc-600 lg:py-16 lg:text-base">Seja o primeiro a comentar.</p>
                      ) : null}
                    </div>

                    {isReadOnly ? (
                      <p className="mt-6 text-xs leading-relaxed text-zinc-500 lg:text-sm">{COPY.visitorDiscussionHint}</p>
                    ) : null}

                    {!isReadOnly ? (
                      <form onSubmit={handleSendComment} className="mt-8 hidden items-center gap-3 lg:flex">
                        <img src={currentUser.avatar} alt={currentUser.name} className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-zinc-800" />
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={newComment}
                            onChange={event => setNewComment(event.target.value)}
                            placeholder="Comentar..."
                            className="w-full rounded-full bg-zinc-900 px-5 py-4 pr-12 text-base text-zinc-100 outline-none ring-1 ring-zinc-800 placeholder:text-zinc-600 focus:ring-zinc-700"
                          />
                          <button type="submit" disabled={!newComment.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-100 transition-colors disabled:text-zinc-700">
                            <Send size={18} />
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p className="mt-8 hidden text-sm leading-relaxed text-zinc-500 lg:block">{COPY.visitorReadOnlyHint}</p>
                    )}
                  </>
                )}
              </section>
            </div>
          </div>

          <aside className="hidden lg:block lg:sticky lg:top-8 lg:pt-4">
            <div>
              <img src={item.image} alt={item.title} className="h-[320px] w-[214px] rounded-[24px] object-cover ring-1 ring-white/10" />
              <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-zinc-500">Ficha</p>
              <h3 className="mt-3 text-[28px] font-medium leading-tight text-zinc-100">{item.title}</h3>
              {(displayYear || tmdb?.country) ? (
                <p className="mt-2 text-sm text-zinc-500">{[displayYear, tmdb?.country].filter(Boolean).join(' \u00b7 ')}</p>
              ) : null}

              <div className="mt-6 space-y-4 border-t border-zinc-800/60 pt-6">
                <MetaRow label="De" userName={fromUser.name} userId={fromUser.id} />
                <MetaRow label="Para" userName={toUser.name} userId={toUser.id} />
                <MetaValue label="Visibilidade" value={visibilityConfig?.label ?? 'Indefinida'} icon={VisibilityIcon ? <VisibilityIcon size={16} /> : undefined} />
                <MetaValue label={COPY.discussionLabel} value={recommendation.discussion_enabled ? 'Permitida' : 'Desativada'} />
                <MetaValue label="Enviada" value={getRelativeTime(recommendation.created_at)} />
              </div>
            </div>
          </aside>
        </div>

        {recommendation.discussion_enabled && !isReadOnly ? (
          <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-zinc-800/50 bg-zinc-950/90 px-3 py-2 backdrop-blur-xl lg:hidden">
            <div className="mx-auto max-w-md">
              <form onSubmit={handleSendComment} className="relative flex items-center gap-2">
                <img src={currentUser.avatar} alt={currentUser.name} className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-zinc-800" />
                <input
                  type="text"
                  value={newComment}
                  onChange={event => setNewComment(event.target.value)}
                  placeholder="Comentar..."
                  className="flex-1 rounded-full bg-zinc-900 py-2 pl-4 pr-10 text-xs text-zinc-100 outline-none ring-1 ring-zinc-800 placeholder:text-zinc-600 focus:ring-zinc-700"
                />
                <button type="submit" disabled={!newComment.trim()} className="absolute right-1 p-1.5 text-zinc-100 transition-colors disabled:text-zinc-700">
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {showStatusSheet ? (
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
                'relative mx-auto w-full max-w-md rounded-t-[32px] border-t border-zinc-700 bg-zinc-800/95 px-5 pb-8 pt-3 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:max-w-xl lg:rounded-3xl lg:border lg:px-6 lg:pt-5',
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
                className="touch-none border-b border-zinc-700/70 pb-5 text-center"
                onPointerDown={handleStatusSheetPointerDown}
                onPointerMove={handleStatusSheetPointerMove}
                onPointerUp={handleStatusSheetPointerEnd}
                onPointerCancel={handleStatusSheetPointerEnd}
              >
                <h2 className="text-2xl font-medium tracking-tight text-zinc-100">{item.title}</h2>
                {displayYear ? <p className="mt-1 text-lg text-zinc-400">{displayYear}</p> : null}
              </div>

              <div className="grid grid-cols-3 divide-x divide-zinc-700/70">
                <StatusAction
                  label={COPY.watched}
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
        ) : null}

        {showDeleteConfirm ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
            <div className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl">
              <h2 className="mb-1 text-base font-bold text-zinc-100">{COPY.deleteTitle}</h2>
              <p className="mb-6 text-sm text-zinc-400">{COPY.deleteDescription}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-xl border border-zinc-700 py-2.5 text-sm font-bold text-zinc-300 transition-colors hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => void handleDelete()}
                  className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-400"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showEdit ? (
          <div className="fixed inset-0 z-50 bg-zinc-950">
            <div className="mx-auto flex min-h-screen max-w-md flex-col bg-zinc-950 lg:max-w-[1320px] lg:bg-transparent lg:px-8 lg:py-8">
              <div className="flex min-h-screen flex-col lg:min-h-[calc(100vh-64px)] lg:rounded-[32px] lg:border lg:border-zinc-800/70 lg:bg-zinc-950/92 lg:px-10 lg:py-8">
                <header className="flex items-center gap-3 border-b border-zinc-800/50 bg-zinc-950/95 px-4 py-2.5 backdrop-blur-xl lg:border-b-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
                  <button onClick={() => setShowEdit(false)} className="p-1 text-zinc-100">
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-sm font-medium text-zinc-100 lg:text-[32px] lg:tracking-tight">{COPY.editRecommendation}</h2>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:px-0 lg:pt-10">
                  <RecommendationComposerForm
                    item={item}
                    user={toUser}
                    message={editMessage}
                    hasSpoiler={editHasSpoiler}
                    visibility={editVisibility}
                    discussionEnabled={editDiscussionEnabled}
                    submitLabel={isSavingEdit ? 'Salvando...' : COPY.saveChanges}
                    onMessageChange={setEditMessage}
                    onHasSpoilerChange={setEditHasSpoiler}
                    onVisibilityChange={setEditVisibility}
                    onDiscussionEnabledChange={setEditDiscussionEnabled}
                    onSubmit={handleSaveEdit}
                    submitting={isSavingEdit}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DesktopPage>
    </DesktopFrame>
  );
}

function MetaRow({ label, userName, userId }: { label: string; userName: string; userId: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      <Link to={`/profile/${userId}`} className="mt-2 inline-flex items-center text-sm text-zinc-200 transition-colors hover:text-zinc-100">
        {userName}
      </Link>
    </div>
  );
}

function MetaValue({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      <div className="mt-2 flex items-center gap-2 text-sm text-zinc-200">
        {icon}
        <span>{value}</span>
      </div>
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
