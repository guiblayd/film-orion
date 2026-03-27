import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, X, Camera, Loader2, LogOut, TriangleAlert } from 'lucide-react';
import { useStore } from '../store';
import { RecommendationCard } from './RecommendationCard';
import { AvatarCropper } from './AvatarCropper';
import { DesktopPage } from './DesktopFrame';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Item } from '../types';
import { formatUsername, sanitizeUsername, validateUsername } from '../lib/username';
import { fetchRecommendationCards, RecommendationCardData } from '../services/recommendations';
import { Database } from '../types/database';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'received' | 'made' | 'watchlist' | 'watched';

export function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { users, currentUser, connections, toggleFollow, updateCurrentUser } = useStore();

  const [activeTab, setActiveTab] = useState<Tab>('received');
  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editUsername, setEditUsername] = useState(currentUser.username);
  const [editBio, setEditBio] = useState(currentUser.bio || '');
  const [usernameAvailability, setUsernameAvailability] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [formError, setFormError] = useState<string | null>(null);
  const [dangerError, setDangerError] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [authActionLoading, setAuthActionLoading] = useState<'signout' | 'delete' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [receivedCards, setReceivedCards] = useState<RecommendationCardData[]>([]);
  const [madeCards, setMadeCards] = useState<RecommendationCardData[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<Item[]>([]);
  const [watchedItems, setWatchedItems] = useState<Item[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = users.find(profileUser => profileUser.id === id);
  if (!user) return <div className="p-8 text-center">{'Usu\u00e1rio n\u00e3o encontrado'}</div>;

  const isOwnProfile = currentUser.id === user.id;
  const isFollowing = connections.some(
    connection => connection.requester_id === currentUser.id && connection.receiver_id === user.id
  );

  useEffect(() => {
    setEditName(currentUser.name);
    setEditUsername(currentUser.username);
    setEditBio(currentUser.bio || '');
    setFormError(null);
    setDangerError(null);
  }, [currentUser.name, currentUser.username, currentUser.bio]);

  const normalizedUsername = sanitizeUsername(editUsername);
  const usernameValidationError = validateUsername(normalizedUsername);
  const usernameChanged = normalizedUsername !== currentUser.username;

  useEffect(() => {
    if (!showSettings) return;

    if (!usernameChanged) {
      setUsernameAvailability('idle');
      return;
    }

    if (usernameValidationError) {
      setUsernameAvailability('invalid');
      return;
    }

    let cancelled = false;
    setUsernameAvailability('checking');

    const timeoutId = window.setTimeout(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', normalizedUsername)
        .neq('id', currentUser.id)
        .limit(1);

      if (cancelled) return;

      if (error) {
        console.error('username availability:', error.message);
        setUsernameAvailability('idle');
        return;
      }

      setUsernameAvailability((data?.length ?? 0) > 0 ? 'taken' : 'available');
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [showSettings, usernameChanged, usernameValidationError, normalizedUsername, currentUser.id]);

  useEffect(() => {
    if (users.length === 0 || !user.id) return;

    let cancelled = false;

    const loadProfileData = async () => {
      const [
        nextReceivedCards,
        nextMadeCards,
        { count: nextFollowersCount },
        { count: nextFollowingCount },
        { data: statuses },
      ] = await Promise.all([
        fetchRecommendationCards(users, { toUserId: user.id }),
        fetchRecommendationCards(users, { fromUserId: user.id }),
        supabase
          .from('connections')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('status', 'accepted'),
        supabase
          .from('connections')
          .select('*', { count: 'exact', head: true })
          .eq('requester_id', user.id)
          .eq('status', 'accepted'),
        supabase
          .from('user_item_statuses')
          .select('*')
          .eq('user_id', user.id),
      ]);

      const itemIds = [...new Set((statuses ?? []).map(status => status.item_id))];
      const { data: items } = itemIds.length > 0
        ? await supabase.from('items').select('*').in('id', itemIds)
        : { data: [] as Item[] };

      const itemsById = new Map((items ?? []).map(item => {
        const nextItem = toItem(item);
        return [nextItem.id, nextItem] as const;
      }));

      const nextWatchlistItems = (statuses ?? [])
        .filter(status => status.status === 'saved')
        .map(status => itemsById.get(status.item_id))
        .filter((item): item is Item => Boolean(item));

      const nextWatchedItems = (statuses ?? [])
        .filter(status => status.status === 'watched')
        .map(status => itemsById.get(status.item_id))
        .filter((item): item is Item => Boolean(item));

      if (cancelled) return;

      setReceivedCards(nextReceivedCards);
      setMadeCards(nextMadeCards);
      setFollowersCount(nextFollowersCount ?? 0);
      setFollowingCount(nextFollowingCount ?? 0);
      setWatchlistItems(nextWatchlistItems);
      setWatchedItems(nextWatchedItems);
    };

    void loadProfileData();
    return () => {
      cancelled = true;
    };
  }, [user.id, users]);

  const handleSaveSettings = async () => {
    if (!editName.trim()) return;
    setFormError(null);

    if (usernameValidationError) {
      setFormError(usernameValidationError);
      return;
    }

    if (usernameAvailability === 'checking') {
      setFormError('Estou verificando esse @username. Tente novamente em um instante.');
      return;
    }

    if (usernameAvailability === 'taken') {
      setFormError('Esse @username j\u00e1 est\u00e1 em uso.');
      return;
    }

    const error = await updateCurrentUser({
      name: editName.trim(),
      username: normalizedUsername,
      bio: editBio.trim() || undefined,
    });

    if (error) {
      setFormError(error);
      return;
    }

    setShowSettings(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setCropFile(file);
    event.target.value = '';
  };

  const handleCropConfirm = async (blob: Blob) => {
    setCropFile(null);
    setUploading(true);
    try {
      const path = `${currentUser.id}/avatar.jpg`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      await updateCurrentUser({ avatar: `${data.publicUrl}?t=${Date.now()}` });
    } catch (error) {
      console.error('Avatar upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleToggleFollow = async () => {
    await toggleFollow(user.id);
    setFollowersCount(count => count + (isFollowing ? -1 : 1));
  };

  const handleSignOut = async () => {
    setAuthActionLoading('signout');
    setDangerError(null);
    try {
      await signOut();
    } finally {
      setAuthActionLoading(null);
      setShowSettings(false);
    }
  };

  const handleDeleteAccount = async () => {
    setAuthActionLoading('delete');
    setDangerError(null);

    try {
      await supabase.storage.from('avatars').remove([`${currentUser.id}/avatar.jpg`]);

      const { error } = await supabase.rpc('delete_current_user');
      if (error) {
        console.error('delete_current_user:', error.message);
        setDangerError('N\u00e3o foi poss\u00edvel excluir sua conta agora.');
        return;
      }

      await signOut();
    } finally {
      setAuthActionLoading(null);
    }
  };

  const deletePhrase = formatUsername(currentUser.username);
  const deleteConfirmed = deleteConfirmation.trim() === deletePhrase;

  const activeTabContent = (
    <>
      {activeTab === 'received' && (
        receivedCards.length > 0
          ? receivedCards.map(card => <RecommendationCard key={card.recommendation.id} card={card} />)
          : <EmptyState message={'Nenhuma indica\u00e7\u00e3o recebida.'} />
      )}
      {activeTab === 'made' && (
        madeCards.length > 0
          ? madeCards.map(card => <RecommendationCard key={card.recommendation.id} card={card} />)
          : <EmptyState message={'Nenhuma indica\u00e7\u00e3o feita.'} />
      )}
      {activeTab === 'watchlist' && (
        watchlistItems.length > 0 ? (
          <div className="grid grid-cols-3 gap-0.5 bg-zinc-900/20 lg:grid-cols-4 lg:gap-4 lg:bg-transparent lg:pt-4">
            {watchlistItems.map(item => (
              <button
                key={item.id}
                className="relative aspect-[2/3] cursor-pointer overflow-hidden lg:rounded-2xl"
                onClick={() => navigate(`/item/${item.id}`)}
              >
                <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : <EmptyState message="Watchlist vazia." />
      )}
      {activeTab === 'watched' && (
        watchedItems.length > 0 ? (
          <div className="grid grid-cols-3 gap-0.5 bg-zinc-900/20 lg:grid-cols-4 lg:gap-4 lg:bg-transparent lg:pt-4">
            {watchedItems.map(item => (
              <button
                key={item.id}
                className="relative aspect-[2/3] cursor-pointer overflow-hidden lg:rounded-2xl"
                onClick={() => navigate(`/item/${item.id}`)}
              >
                <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : <EmptyState message="Nenhum item assistido." />
      )}
    </>
  );

  return (
    <DesktopPage width="stream" className="mx-auto min-h-screen max-w-md bg-zinc-950 pb-20 lg:min-h-0 lg:bg-transparent lg:pb-0">
      <header className="flex items-center justify-between border-b border-zinc-800/50 bg-zinc-950/80 px-4 py-2.5 backdrop-blur-xl lg:hidden">
        <button onClick={() => navigate(-1)} className="p-1 text-zinc-100">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0 text-center">
          <h1 className="truncate text-sm font-medium text-zinc-100">{user.name}</h1>
          <p className="truncate text-[11px] text-zinc-500">{formatUsername(user.username)}</p>
        </div>
        {isOwnProfile ? (
          <button onClick={() => setShowSettings(true)} className="p-1 text-zinc-400 transition-colors hover:text-zinc-200">
            <Settings size={20} />
          </button>
        ) : (
          <div className="w-8" />
        )}
      </header>

      <header className="hidden items-center justify-between border-b border-zinc-800/50 bg-zinc-950/80 px-0 py-0 backdrop-blur-xl lg:flex lg:border-b-0 lg:bg-transparent lg:backdrop-blur-none">
        <div className="min-w-0 text-left">
          <h1 className="truncate text-sm font-medium text-zinc-100 lg:text-[30px] lg:tracking-tight">{user.name}</h1>
          <p className="truncate text-[11px] text-zinc-500 lg:mt-1 lg:text-sm">
            {isOwnProfile ? `${receivedCards.length} indica\u00e7\u00f5es` : formatUsername(user.username)}
          </p>
        </div>
        {isOwnProfile ? (
          <button onClick={() => setShowSettings(true)} className="p-1 text-zinc-400 transition-colors hover:text-zinc-200">
            <Settings size={20} />
          </button>
        ) : (
          <div className="w-8" />
        )}
      </header>

      <section className="border-b border-zinc-800/50 px-4 py-4 lg:hidden">
        <div className="mb-3 flex items-center gap-5">
          <img
            src={user.avatar}
            alt={user.name}
            className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-zinc-800"
          />
          <div className="flex flex-1 justify-around text-center">
            <div>
              <p className="text-base font-semibold text-zinc-100">{receivedCards.length}</p>
              <p className="text-[11px] text-zinc-500">{'Indica\u00e7\u00f5es'}</p>
            </div>
            <div>
              <p className="text-base font-semibold text-zinc-100">{followersCount}</p>
              <p className="text-[11px] text-zinc-500">Seguidores</p>
            </div>
            <div>
              <p className="text-base font-semibold text-zinc-100">{followingCount}</p>
              <p className="text-[11px] text-zinc-500">Seguindo</p>
            </div>
          </div>
        </div>

        <p className="text-sm font-medium text-zinc-100">{user.name}</p>
        <p className="mt-1 text-xs font-medium text-zinc-500">{formatUsername(user.username)}</p>
        {user.bio ? <p className="mt-2 text-xs leading-relaxed text-zinc-400">{user.bio}</p> : null}

        {!isOwnProfile && (
          <button
            onClick={() => void handleToggleFollow()}
            className={cn(
              'mt-4 w-full rounded-lg py-2 text-sm font-medium transition-colors',
              isFollowing
                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                : 'bg-zinc-100 text-zinc-950 hover:bg-white'
            )}
          >
            {isFollowing ? 'Seguindo' : 'Seguir'}
          </button>
        )}
      </section>

      <section className="hidden border-b border-zinc-800/50 px-0 py-0 lg:block lg:px-0 lg:py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <img
              src={user.avatar}
              alt={user.name}
              className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-zinc-800 lg:h-24 lg:w-24"
            />

            <div className="mt-4 min-w-0">
              <p className="truncate text-lg font-semibold text-zinc-100 lg:text-[30px] lg:leading-tight">{user.name}</p>
              <p className="mt-1 truncate text-sm text-zinc-500">{formatUsername(user.username)}</p>
              {user.bio ? (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300 lg:text-[15px] lg:leading-7">
                  {user.bio}
                </p>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-500 lg:mt-5 lg:text-[15px]">
              <span><span className="font-semibold text-zinc-100">{receivedCards.length}</span>{' indica\u00e7\u00f5es'}</span>
              <span><span className="font-semibold text-zinc-100">{followersCount}</span> seguidores</span>
              <span><span className="font-semibold text-zinc-100">{followingCount}</span> seguindo</span>
            </div>
          </div>

          <div className="hidden lg:block">
            {isOwnProfile ? (
              <button
                onClick={() => setShowSettings(true)}
                className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-900/60"
              >
                Editar perfil
              </button>
            ) : (
              <button
                onClick={() => void handleToggleFollow()}
                className={cn(
                  'rounded-full px-5 py-2 text-sm font-medium transition-colors',
                  isFollowing
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-zinc-100 text-zinc-950 hover:bg-white'
                )}
              >
                {isFollowing ? 'Seguindo' : 'Seguir'}
              </button>
            )}
          </div>
        </div>

        {!isOwnProfile && (
          <button
            onClick={() => void handleToggleFollow()}
            className={cn(
              'mt-4 w-full rounded-full py-2 text-sm font-medium transition-colors lg:hidden',
              isFollowing
                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                : 'bg-zinc-100 text-zinc-950 hover:bg-white'
            )}
          >
            {isFollowing ? 'Seguindo' : 'Seguir'}
          </button>
        )}
      </section>

      <section className="min-w-0">
        <div className="flex overflow-x-auto border-b border-zinc-800/50 bg-zinc-950/90 backdrop-blur-md lg:bg-transparent lg:backdrop-blur-none">
          <TabButton active={activeTab === 'received'} onClick={() => setActiveTab('received')}>
            Recebidas
          </TabButton>
          <TabButton active={activeTab === 'made'} onClick={() => setActiveTab('made')}>
            Feitas
          </TabButton>
          <TabButton active={activeTab === 'watchlist'} onClick={() => setActiveTab('watchlist')}>
            Watchlist
          </TabButton>
          <TabButton active={activeTab === 'watched'} onClick={() => setActiveTab('watched')}>
            Assistidos
          </TabButton>
        </div>

        <div className="flex flex-col lg:pt-2">
          {activeTabContent}
        </div>
      </section>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {cropFile && (
        <AvatarCropper
          file={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-end lg:items-center lg:justify-center" onClick={() => setShowSettings(false)}>
          <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" />
          <div
            className="relative mx-auto w-full max-w-md rounded-t-2xl border-t border-zinc-800 bg-zinc-900 p-5 lg:max-w-4xl lg:rounded-3xl lg:border lg:border-zinc-800 lg:p-7"
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-medium text-zinc-100 lg:text-[26px]">Editar perfil</h2>
              <button onClick={() => setShowSettings(false)} className="p-1 text-zinc-500 transition-colors hover:text-zinc-300">
                <X size={18} />
              </button>
            </div>

            <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
              <div className="mb-6 lg:mb-0">
                <div className="flex justify-center lg:justify-start">
                  <button
                    className="relative group"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 ring-2 ring-zinc-700 lg:h-24 lg:w-24">
                        <Loader2 size={22} className="animate-spin text-zinc-400" />
                      </div>
                    ) : (
                      <>
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="h-16 w-16 rounded-full object-cover ring-2 ring-zinc-700 lg:h-24 lg:w-24"
                        />
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <Camera size={18} className="text-white" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 shadow-lg lg:h-8 lg:w-8">
                          <Camera size={12} className="text-zinc-900" />
                        </div>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-5 rounded-[24px] border border-zinc-800/70 p-5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{'Pr\u00e9via'}</p>
                  <p className="mt-4 text-xl font-medium text-zinc-100">{editName.trim() || 'Seu nome'}</p>
                  <p className="mt-1 text-sm text-zinc-500">{formatUsername(normalizedUsername || currentUser.username)}</p>
                  <p className="mt-4 text-sm leading-7 text-zinc-400">
                    {editBio.trim() || 'Ajuste nome, @username e bio para deixar seu perfil mais claro no desktop e no mobile.'}
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">Nome</label>
                <input
                  value={editName}
                  onChange={event => setEditName(event.target.value)}
                  className="mb-4 w-full rounded-lg bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none ring-1 ring-zinc-700 focus:ring-zinc-600 lg:rounded-2xl lg:px-4 lg:py-3.5 lg:text-base"
                  placeholder="Seu nome"
                />

                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">Username</label>
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2.5 ring-1 ring-zinc-700 focus-within:ring-zinc-600 lg:rounded-2xl lg:px-4 lg:py-3.5">
                  <span className="shrink-0 text-sm font-semibold text-zinc-500">@</span>
                  <input
                    value={editUsername}
                    onChange={event => setEditUsername(sanitizeUsername(event.target.value))}
                    className="w-full bg-transparent text-sm text-zinc-100 outline-none lg:text-base"
                    placeholder="seu_user"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
                <p className="mb-4 text-xs text-zinc-500">
                  {usernameAvailability === 'checking' && 'Verificando disponibilidade...'}
                  {usernameAvailability === 'available' && usernameChanged && 'Esse @username est\u00e1 dispon\u00edvel.'}
                  {usernameAvailability === 'taken' && 'Esse @username j\u00e1 est\u00e1 em uso.'}
                  {usernameAvailability === 'invalid' && usernameValidationError}
                  {usernameAvailability === 'idle' && 'Use de 3 a 24 caracteres com letras min\u00fasculas, n\u00fameros e underscore.'}
                </p>

                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">Bio</label>
                <textarea
                  value={editBio}
                  onChange={event => setEditBio(event.target.value)}
                  rows={4}
                  className="mb-5 w-full resize-none rounded-lg bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none ring-1 ring-zinc-700 focus:ring-zinc-600 lg:rounded-2xl lg:px-4 lg:py-3.5 lg:text-base"
                  placeholder={'Fale um pouco sobre voc\u00ea...'}
                  maxLength={150}
                />

                {formError && <p className="mb-4 text-xs text-rose-400">{formError}</p>}

                <button
                  onClick={() => void handleSaveSettings()}
                  disabled={!editName.trim() || usernameAvailability === 'checking'}
                  className="w-full rounded-xl bg-zinc-100 py-2.5 font-medium text-zinc-950 transition-colors hover:bg-white disabled:opacity-40 lg:w-auto lg:min-w-[190px] lg:rounded-2xl lg:px-8 lg:py-3.5"
                >
                  Salvar
                </button>

                <div className="mt-6 border-t border-zinc-800 pt-4 lg:mt-8">
                  <button
                    onClick={() => void handleSignOut()}
                    disabled={authActionLoading !== null}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-50 lg:rounded-2xl"
                  >
                    {authActionLoading === 'signout' ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                    Sair da conta
                  </button>

                  <button
                    onClick={() => {
                      setDangerError(null);
                      setDeleteConfirmation('');
                      setShowDeleteConfirm(true);
                    }}
                    disabled={authActionLoading !== null}
                    className="mt-3 w-full rounded-xl border border-rose-500/40 px-4 py-3 text-sm font-semibold text-rose-400 transition-colors hover:bg-rose-500/10 disabled:opacity-50 lg:rounded-2xl"
                  >
                    Excluir conta
                  </button>

                  {dangerError && <p className="mt-3 text-xs text-rose-400">{dangerError}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center sm:justify-center" onClick={() => setShowDeleteConfirm(false)}>
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-t-3xl border-t border-zinc-800 bg-zinc-900 p-5 sm:rounded-3xl sm:border sm:border-zinc-800"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-rose-500/10 p-2 text-rose-400">
                <TriangleAlert size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-zinc-100">Excluir conta?</h2>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                  {'Essa a\u00e7\u00e3o \u00e9 permanente. Seu perfil, suas recomenda\u00e7\u00f5es, coment\u00e1rios e conex\u00f5es ser\u00e3o removidos.'}
                </p>
                <p className="mt-3 text-xs text-zinc-500">
                  Para confirmar, digite <span className="font-semibold text-zinc-300">{deletePhrase}</span>.
                </p>
              </div>
            </div>

            <input
              value={deleteConfirmation}
              onChange={event => setDeleteConfirmation(event.target.value)}
              className="mt-4 w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm text-zinc-100 outline-none ring-1 ring-zinc-700 focus:ring-zinc-600"
              placeholder={deletePhrase}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />

            {dangerError && <p className="mt-3 text-xs text-rose-400">{dangerError}</p>}

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={authActionLoading === 'delete'}
                className="flex-1 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleDeleteAccount()}
                disabled={!deleteConfirmed || authActionLoading === 'delete'}
                className="flex-1 rounded-xl bg-rose-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-rose-400 disabled:opacity-40"
              >
                {authActionLoading === 'delete' ? 'Excluindo...' : 'Excluir conta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DesktopPage>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors lg:mr-8 lg:flex-none lg:px-0 lg:py-3 lg:text-base lg:font-medium',
        active ? 'border-zinc-100 text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-300'
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="p-10 text-center text-sm text-zinc-600 lg:p-16 lg:text-base">{message}</div>;
}

function toItem(item: Database['public']['Tables']['items']['Row']): Item {
  return {
    id: item.id,
    title: item.title,
    image: item.image ?? '',
    type: item.type as Item['type'],
    year: item.year ?? undefined,
  };
}
