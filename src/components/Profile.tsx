import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, X, Camera, Loader2, LogOut, TriangleAlert } from 'lucide-react';
import { useStore } from '../store';
import { RecommendationCard } from './RecommendationCard';
import { AvatarCropper } from './AvatarCropper';
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
  if (!user) return <div className="p-8 text-center">Usuário não encontrado</div>;

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

    loadProfileData();
    return () => { cancelled = true; };
  }, [user.id, users, connections]);

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
      setFormError('Esse @username ja esta em uso.');
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
        setDangerError('Nao foi possivel excluir sua conta agora.');
        return;
      }

      await signOut();
    } finally {
      setAuthActionLoading(null);
    }
  };

  const deletePhrase = formatUsername(currentUser.username);
  const deleteConfirmed = deleteConfirmation.trim() === deletePhrase;

  return (
    <div className="max-w-md mx-auto bg-zinc-950 min-h-screen pb-20 lg:max-w-none lg:pb-12">
      <header className="bg-zinc-950/80 backdrop-blur-xl px-4 py-2.5 flex justify-between items-center border-b border-zinc-800/50 lg:bg-transparent lg:backdrop-blur-none lg:border-b-0 lg:px-0 lg:py-0">
        <button onClick={() => navigate(-1)} className="p-1 text-zinc-100">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0 text-center lg:text-left">
          <h1 className="truncate text-sm font-medium text-zinc-100 lg:text-[28px] lg:tracking-tight">{user.name}</h1>
          <p className="truncate text-[11px] text-zinc-500 lg:mt-1">{formatUsername(user.username)}</p>
        </div>
        {isOwnProfile ? (
          <button onClick={() => setShowSettings(true)} className="p-1 text-zinc-400 hover:text-zinc-200">
            <Settings size={20} />
          </button>
        ) : (
          <div className="w-8" />
        )}
      </header>

      <div className="px-4 py-4 border-b border-zinc-800/50 lg:border-b-0 lg:px-0 lg:py-0 lg:sticky lg:top-8 lg:self-start">
        <div className="flex items-center gap-5 mb-3 lg:block">
          <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover ring-2 ring-zinc-800 shrink-0 lg:w-24 lg:h-24" />
          <div className="flex-1 flex justify-around text-center lg:mt-5 lg:justify-between">
            <div>
              <p className="text-base font-semibold text-zinc-100">{receivedCards.length}</p>
              <p className="text-[11px] text-zinc-500">Indicações</p>
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

        <p className="text-sm font-medium text-zinc-100 lg:text-lg">{user.name}</p>
        <p className="mt-0.5 text-xs font-medium text-zinc-500">{formatUsername(user.username)}</p>
        {user.bio && <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed lg:mt-2 lg:text-sm">{user.bio}</p>}

        {!isOwnProfile && (
          <button
            onClick={() => void handleToggleFollow()}
            className={cn(
              'w-full mt-4 py-2 rounded-lg text-sm font-medium transition-colors lg:w-auto lg:px-5',
              isFollowing
                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                : 'bg-zinc-100 text-zinc-950 hover:bg-white'
            )}
          >
            {isFollowing ? 'Seguindo' : 'Seguir'}
          </button>
        )}
      </div>

      <div className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/50 flex overflow-x-auto lg:bg-transparent lg:backdrop-blur-none">
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

      <div className="flex flex-col">
        {activeTab === 'received' && (
          receivedCards.length > 0
            ? receivedCards.map(card => <RecommendationCard key={card.recommendation.id} card={card} />)
            : <EmptyState message="Nenhuma indicação recebida." />
        )}
        {activeTab === 'made' && (
          madeCards.length > 0
            ? madeCards.map(card => <RecommendationCard key={card.recommendation.id} card={card} />)
            : <EmptyState message="Nenhuma indicação feita." />
        )}
        {activeTab === 'watchlist' && (
          watchlistItems.length > 0 ? (
            <div className="grid grid-cols-3 gap-0.5 bg-zinc-900/20 lg:grid-cols-5 lg:gap-4 lg:bg-transparent lg:pt-6">
              {watchlistItems.map(item => (
                <button key={item.id} className="aspect-[2/3] relative cursor-pointer overflow-hidden lg:rounded-xl" onClick={() => navigate(`/item/${item.id}`)}>
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : <EmptyState message="Watchlist vazia." />
        )}
        {activeTab === 'watched' && (
          watchedItems.length > 0 ? (
            <div className="grid grid-cols-3 gap-0.5 bg-zinc-900/20 lg:grid-cols-5 lg:gap-4 lg:bg-transparent lg:pt-6">
              {watchedItems.map(item => (
                <button key={item.id} className="aspect-[2/3] relative cursor-pointer overflow-hidden lg:rounded-xl" onClick={() => navigate(`/item/${item.id}`)}>
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : <EmptyState message="Nenhum item assistido." />
        )}
      </div>

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
            className="relative w-full max-w-md mx-auto bg-zinc-900 rounded-t-2xl border-t border-zinc-800 p-5 lg:max-w-2xl lg:rounded-3xl lg:border lg:border-zinc-800 lg:p-6"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-medium text-base text-zinc-100">Editar perfil</h2>
              <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-zinc-300 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="flex justify-center mb-5">
              <button
                className="relative group"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <div className="w-16 h-16 rounded-full bg-zinc-800 ring-2 ring-zinc-700 flex items-center justify-center">
                    <Loader2 size={22} className="text-zinc-400 animate-spin" />
                  </div>
                ) : (
                  <>
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-zinc-700"
                    />
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={18} className="text-white" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center shadow-lg">
                      <Camera size={12} className="text-zinc-900" />
                    </div>
                  </>
                )}
              </button>
            </div>

            <label className="block text-xs text-zinc-500 font-medium mb-1.5 uppercase tracking-wide">Nome</label>
            <input
              value={editName}
              onChange={event => setEditName(event.target.value)}
              className="w-full bg-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-zinc-600 ring-1 ring-zinc-700 mb-4"
              placeholder="Seu nome"
            />

            <label className="block text-xs text-zinc-500 font-medium mb-1.5 uppercase tracking-wide">Username</label>
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2.5 ring-1 ring-zinc-700 focus-within:ring-zinc-600">
              <span className="shrink-0 text-sm font-semibold text-zinc-500">@</span>
              <input
                value={editUsername}
                onChange={event => setEditUsername(sanitizeUsername(event.target.value))}
                className="w-full bg-transparent text-sm text-zinc-100 outline-none"
                placeholder="seu_user"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            <p className="mb-4 text-xs text-zinc-500">
              {usernameAvailability === 'checking' && 'Verificando disponibilidade...'}
              {usernameAvailability === 'available' && usernameChanged && 'Esse @username esta disponivel.'}
              {usernameAvailability === 'taken' && 'Esse @username ja esta em uso.'}
              {usernameAvailability === 'invalid' && usernameValidationError}
              {usernameAvailability === 'idle' && 'Use de 3 a 24 caracteres com letras minusculas, numeros e underscore.'}
            </p>

            <label className="block text-xs text-zinc-500 font-medium mb-1.5 uppercase tracking-wide">Bio</label>
            <textarea
              value={editBio}
              onChange={event => setEditBio(event.target.value)}
              rows={3}
              className="w-full bg-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-zinc-600 ring-1 ring-zinc-700 resize-none mb-5"
              placeholder="Fale um pouco sobre você..."
              maxLength={150}
            />

            {formError && <p className="mb-4 text-xs text-rose-400">{formError}</p>}

            <button
              onClick={() => void handleSaveSettings()}
              disabled={!editName.trim() || usernameAvailability === 'checking'}
              className="w-full bg-zinc-100 text-zinc-950 font-medium py-2.5 rounded-xl disabled:opacity-40 hover:bg-white transition-colors lg:w-auto lg:min-w-[180px]"
            >
              Salvar
            </button>

            <div className="mt-6 border-t border-zinc-800 pt-4">
              <button
                onClick={() => void handleSignOut()}
                disabled={authActionLoading !== null}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-50"
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
                className="mt-3 w-full rounded-xl border border-rose-500/40 px-4 py-3 text-sm font-semibold text-rose-400 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
              >
                Excluir conta
              </button>

              {dangerError && <p className="mt-3 text-xs text-rose-400">{dangerError}</p>}
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
                  Essa acao e permanente. Seu perfil, suas recomendacoes, comentarios e conexoes serao removidos.
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
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors lg:flex-none lg:mr-8 lg:px-0 lg:py-3 lg:text-sm lg:font-medium',
        active ? 'border-zinc-100 text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-300'
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="p-10 text-center text-zinc-600 text-sm">{message}</div>;
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
