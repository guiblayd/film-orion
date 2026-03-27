import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import { useStore } from '../store';
import { formatUsername } from '../lib/username';
import { getPopularMovies, getTrending, searchTMDB } from '../services/tmdb';
import { Item, User } from '../types';
import { RecommendationComposerForm } from './RecommendationComposerForm';

function dedupe(items: Item[]): Item[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function validImage(url: string) {
  return url && !url.endsWith('/null') && !url.includes('undefined');
}

function ItemCard({ item, label, user }: { item: Item; label: string; user?: User | null }) {
  return (
    <div className="mb-4 flex gap-3 rounded-xl bg-zinc-900/50 p-3 ring-1 ring-zinc-800/50 lg:mb-0 lg:flex-col lg:gap-4 lg:rounded-[24px] lg:border lg:border-zinc-800/70 lg:bg-transparent lg:p-5 lg:ring-0">
      <img
        src={item.image}
        alt={item.title}
        className="h-[68px] w-12 shrink-0 rounded-lg object-cover ring-1 ring-white/10 lg:h-[210px] lg:w-[140px] lg:rounded-2xl"
      />
      <div className="min-w-0 flex flex-col justify-center">
        <p className="mb-0.5 text-xs text-zinc-500 lg:text-[11px] lg:uppercase lg:tracking-[0.22em]">{label}</p>
        {user && (
          <div className="mb-1.5">
            <div className="flex items-center gap-1.5 lg:gap-2">
              <img
                src={user.avatar}
                alt={user.name}
                className="h-4 w-4 shrink-0 rounded-full object-cover ring-1 ring-zinc-800 lg:h-8 lg:w-8"
              />
              <span className="truncate text-xs font-medium text-zinc-100 lg:text-base">{user.name}</span>
            </div>
            <span className="ml-5 block text-[11px] text-zinc-500 lg:ml-10 lg:text-sm">{formatUsername(user.username)}</span>
          </div>
        )}
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-100 lg:text-[28px] lg:font-medium lg:leading-tight">{item.title}</p>
        {item.year && <p className="mt-1 text-xs text-zinc-600 lg:text-base">{item.year}</p>}
      </div>
    </div>
  );
}

function DesktopStepPanel({
  stepLabel,
  title,
  description,
  children,
}: {
  stepLabel: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:gap-6 lg:rounded-[28px] lg:border lg:border-zinc-800/70 lg:p-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{stepLabel}</p>
        <h2 className="mt-3 text-[30px] font-medium leading-tight text-zinc-100">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-zinc-400">{description}</p>
      </div>
      {children}
    </aside>
  );
}

function UserPreviewCard({ user, label }: { user: User; label: string }) {
  return (
    <div className="rounded-[24px] border border-zinc-800/70 p-5">
      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      <div className="mt-4 flex items-center gap-3">
        <img
          src={user.avatar}
          alt={user.name}
          className="h-12 w-12 rounded-full object-cover ring-1 ring-zinc-800"
        />
        <div className="min-w-0">
          <p className="truncate text-base font-medium text-zinc-100">{user.name}</p>
          <p className="truncate text-sm text-zinc-500">{formatUsername(user.username)}</p>
        </div>
      </div>
    </div>
  );
}

export function CreateRecommendation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { users, connections, currentUser, addRecommendation, addItem } = useStore();

  const navItem = (location.state as { item?: Item } | null)?.item;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(navItem ?? null);
  const [message, setMessage] = useState('');
  const [discussionEnabled, setDiscussionEnabled] = useState(true);
  const [visibility, setVisibility] = useState<'private' | 'connections' | 'public'>('connections');
  const [userSearch, setUserSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [tmdbResults, setTmdbResults] = useState<Item[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [browseItems, setBrowseItems] = useState<Item[]>([]);
  const [loadingBrowse, setLoadingBrowse] = useState(false);

  const prevStepRef = useRef(step);
  const animDirRef = useRef<'right' | 'left'>('right');
  if (step !== prevStepRef.current) {
    animDirRef.current = step > prevStepRef.current ? 'right' : 'left';
    prevStepRef.current = step;
  }

  const animStyle: React.CSSProperties = {
    animation: `${animDirRef.current === 'right' ? 'stepFromRight' : 'stepFromLeft'} 0.22s cubic-bezier(0.25,0.46,0.45,0.94) both`,
  };

  const connectedUserIds = connections
    .filter(connection => (
      connection.status === 'accepted'
      && (connection.requester_id === currentUser.id || connection.receiver_id === currentUser.id)
    ))
    .map(connection => connection.requester_id === currentUser.id ? connection.receiver_id : connection.requester_id);

  const connectedUsers = users
    .filter(user => connectedUserIds.includes(user.id))
    .filter(user => (
      user.name.toLowerCase().includes(userSearch.toLowerCase())
      || user.username.toLowerCase().includes(userSearch.toLowerCase())
    ));

  useEffect(() => {
    if (step !== 2 || browseItems.length > 0) return;

    setLoadingBrowse(true);
    getPopularMovies()
      .then(async results => {
        const popular = dedupe(results.filter(item => validImage(item.image)));
        if (popular.length > 0) return popular;

        const fallback = await getTrending();
        return dedupe(fallback.filter(item => validImage(item.image)));
      })
      .then(results => setBrowseItems(results))
      .finally(() => setLoadingBrowse(false));
  }, [step, browseItems.length]);

  useEffect(() => {
    if (!itemSearch.trim()) {
      setTmdbResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchTMDB(itemSearch);
        setTmdbResults(dedupe(results.filter(item => validImage(item.image))));
      } catch {
        setTmdbResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [itemSearch]);

  const displayedItems = itemSearch.trim() ? tmdbResults : browseItems;

  const handleSelectItem = (item: Item) => {
    void addItem(item);
    setSelectedItem(item);
    setStep(3);
  };

  const handleCreate = async () => {
    if (!selectedUser || !selectedItem) return;

    await addItem(selectedItem);
    await addRecommendation({
      from_user_id: currentUser.id,
      to_user_id: selectedUser.id,
      item_id: selectedItem.id,
      message: message.trim() || undefined,
      discussion_enabled: discussionEnabled,
      visibility,
    });

    navigate('/');
  };

  const goBack = () => {
    if (step === 1) navigate(-1);
    else if (step === 3 && navItem) setStep(1);
    else setStep((step - 1) as 1 | 2 | 3);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-zinc-950 pb-20 lg:max-w-[1320px] lg:bg-transparent lg:px-8 lg:py-8 lg:pb-0">
      <div className="flex min-h-screen flex-col lg:min-h-[calc(100vh-64px)] lg:rounded-[32px] lg:border lg:border-zinc-800/70 lg:bg-zinc-950/82 lg:px-10 lg:py-8">
        <header className="flex items-center gap-3 border-b border-zinc-800/50 bg-zinc-950/90 px-4 py-2.5 backdrop-blur-xl lg:border-b-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
          <button onClick={goBack} className="p-1 text-zinc-100">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="hidden text-[11px] uppercase tracking-[0.22em] text-zinc-500 lg:block">Nova indicação</p>
            <h1 className="text-sm font-medium text-zinc-100 lg:mt-2 lg:text-[34px] lg:tracking-tight">
              {step === 1 && 'Para quem?'}
              {step === 2 && 'O que indicar?'}
              {step === 3 && 'Mensagem e visibilidade'}
            </h1>
          </div>
          <div className="ml-auto flex gap-1.5">
            {(navItem ? [1, 3] : [1, 2, 3]).map(currentStep => (
              <div
                key={currentStep}
                className={`h-1.5 w-1.5 rounded-full transition-colors lg:h-2 lg:w-2 ${currentStep <= step ? 'bg-zinc-100' : 'bg-zinc-700'}`}
              />
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto lg:pt-10">
          {step === 1 && (
            <div key="step-1" style={animStyle} className="p-4 lg:px-0">
              <div className="lg:grid lg:grid-cols-[290px_minmax(0,1fr)] lg:gap-10">
                <DesktopStepPanel
                  stepLabel="Etapa 1"
                  title="Escolha a pessoa"
                  description="Primeiro, escolha quem vai receber a indicação. No desktop, deixei esse passo mais aberto e com um lado só para contexto."
                >
                  {navItem ? <ItemCard item={navItem} label="Indicando" /> : null}
                </DesktopStepPanel>

                <div className="lg:rounded-[28px] lg:border lg:border-zinc-800/70 lg:p-6 xl:p-8">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 lg:left-4" size={16} />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={event => setUserSearch(event.target.value)}
                      placeholder="Buscar conexões..."
                      className="w-full rounded-lg bg-zinc-900 py-2.5 pl-9 pr-4 text-sm text-zinc-100 outline-none ring-1 ring-zinc-800 placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-700 lg:rounded-2xl lg:px-12 lg:py-4 lg:text-base"
                    />
                  </div>

                  <div className="space-y-1 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 xl:grid-cols-3">
                    {connectedUsers.map(user => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setSelectedUser(user);
                          setStep(navItem ? 3 : 2);
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-zinc-900/60 lg:min-h-[96px] lg:rounded-2xl lg:border lg:border-zinc-800/60 lg:px-5 lg:py-5"
                      >
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-10 w-10 rounded-full object-cover ring-1 ring-zinc-800 lg:h-14 lg:w-14"
                        />
                        <div className="min-w-0">
                          <span className="block truncate text-sm font-medium text-zinc-100 lg:text-base">{user.name}</span>
                          <span className="block truncate text-xs text-zinc-500 lg:text-sm">{formatUsername(user.username)}</span>
                        </div>
                      </button>
                    ))}
                    {connectedUsers.length === 0 && (
                      <p className="py-8 text-center text-sm text-zinc-500 lg:col-span-3">Nenhuma conexão encontrada.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div key="step-2" style={animStyle} className="p-4 lg:px-0">
              <div className="lg:grid lg:grid-cols-[290px_minmax(0,1fr)] lg:gap-10">
                <DesktopStepPanel
                  stepLabel="Etapa 2"
                  title="Escolha o título"
                  description="Com o destinatário definido, a busca agora fica mais ampla e com pôsteres maiores no desktop para facilitar a decisão."
                >
                  {selectedUser ? <UserPreviewCard user={selectedUser} label="Recebe" /> : null}
                </DesktopStepPanel>

                <div className="lg:rounded-[28px] lg:border lg:border-zinc-800/70 lg:p-6 xl:p-8">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 lg:left-4" size={16} />
                    <input
                      type="text"
                      value={itemSearch}
                      onChange={event => setItemSearch(event.target.value)}
                      placeholder="Buscar filmes, séries, animes..."
                      autoFocus
                      className="w-full rounded-lg bg-zinc-900 py-2.5 pl-9 pr-4 text-sm text-zinc-100 outline-none ring-1 ring-zinc-800 placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-700 lg:rounded-2xl lg:px-12 lg:py-4 lg:text-base"
                    />
                    {isSearching && (
                      <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-zinc-500 lg:right-4" />
                    )}
                  </div>

                  {!itemSearch.trim() && (
                    <p className="mb-5 text-center text-xs text-zinc-600 lg:text-left lg:text-sm">
                      {loadingBrowse ? 'Carregando...' : 'Filmes populares agora ou busque qualquer título'}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-2 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5">
                    {loadingBrowse && !itemSearch.trim() && (
                      <div className="col-span-3 flex justify-center py-10 lg:col-span-5">
                        <Loader2 size={22} className="animate-spin text-zinc-600" />
                      </div>
                    )}
                    {displayedItems.map(item => (
                      <button key={item.id} onClick={() => handleSelectItem(item)} className="group flex flex-col text-left">
                        <div className="mb-1.5 aspect-[2/3] w-full overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/10 lg:mb-3 lg:rounded-2xl">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                          />
                        </div>
                        <span className="line-clamp-2 text-[11px] font-medium leading-snug text-zinc-200 lg:text-sm lg:leading-6">{item.title}</span>
                        {item.year && <span className="mt-0.5 text-[10px] text-zinc-600 lg:text-xs">{item.year}</span>}
                      </button>
                    ))}
                    {itemSearch.trim() && !isSearching && tmdbResults.length === 0 && (
                      <p className="col-span-3 py-8 text-center text-sm text-zinc-500 lg:col-span-5">Nenhum resultado encontrado.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && selectedUser && selectedItem && (
            <div key="step-3" style={animStyle} className="p-4 lg:px-0">
              <RecommendationComposerForm
                item={selectedItem}
                user={selectedUser}
                message={message}
                visibility={visibility}
                discussionEnabled={discussionEnabled}
                submitLabel="Enviar indicação"
                onMessageChange={setMessage}
                onVisibilityChange={setVisibility}
                onDiscussionEnabledChange={setDiscussionEnabled}
                onSubmit={handleCreate}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
