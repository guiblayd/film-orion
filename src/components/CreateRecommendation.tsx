import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { ArrowLeft, Search, Loader2, Lock, Users, Globe } from 'lucide-react';
import { Item, User } from '../types';
import { searchTMDB, getTrending } from '../services/tmdb';

function dedupe(items: Item[]): Item[] {
  const seen = new Set<string>();
  return items.filter(i => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });
}

function validImage(url: string) {
  return url && !url.endsWith('/null') && !url.includes('undefined');
}

// Card de item consistente entre steps
function ItemCard({ item, label, user }: { item: Item; label: string; user?: User | null }) {
  return (
    <div className="flex gap-3 mb-4 p-3 bg-zinc-900/50 rounded-xl ring-1 ring-zinc-800/50">
      <img src={item.image} alt={item.title} className="w-12 h-[68px] object-cover rounded-lg ring-1 ring-white/10 shrink-0" />
      <div className="flex flex-col justify-center min-w-0">
        <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
        {user && (
          <div className="flex items-center gap-1.5 mb-1">
            <img src={user.avatar} alt={user.name} className="w-4 h-4 rounded-full object-cover ring-1 ring-zinc-800 shrink-0" />
            <span className="font-bold text-xs text-zinc-100 truncate">{user.name}</span>
          </div>
        )}
        <p className="font-semibold text-sm text-zinc-100 line-clamp-2 leading-snug">{item.title}</p>
        {item.year && <p className="text-xs text-zinc-600 mt-0.5">{item.year}</p>}
      </div>
    </div>
  );
}

export function CreateRecommendation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { users, connections, currentUser, addRecommendation, addItem } = useStore();

  const navItem = (location.state as any)?.item as Item | undefined;

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

  // Track step direction for slide animation
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
    .filter(c => c.status === 'accepted' && (c.requester_id === currentUser.id || c.receiver_id === currentUser.id))
    .map(c => c.requester_id === currentUser.id ? c.receiver_id : c.requester_id);

  const connectedUsers = users
    .filter(u => connectedUserIds.includes(u.id))
    .filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()));

  // Fetch trending when step 2 first opens
  useEffect(() => {
    if (step !== 2 || browseItems.length > 0) return;
    setLoadingBrowse(true);
    getTrending()
      .then(results => setBrowseItems(dedupe(results.filter(i => validImage(i.image)))))
      .finally(() => setLoadingBrowse(false));
  }, [step]);

  // TMDB search with debounce
  useEffect(() => {
    if (!itemSearch.trim()) { setTmdbResults([]); return; }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchTMDB(itemSearch);
        setTmdbResults(dedupe(results.filter(i => validImage(i.image))));
      } catch { setTmdbResults([]); }
      finally { setIsSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [itemSearch]);

  const displayedItems = itemSearch.trim() ? tmdbResults : browseItems;

  const handleSelectItem = (item: Item) => {
    addItem(item);
    setSelectedItem(item);
    setStep(3);
  };

  const handleCreate = () => {
    if (!selectedUser || !selectedItem) return;
    addRecommendation({
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
    else setStep((step - 1) as any);
  };

  return (
    <div className="max-w-md mx-auto bg-zinc-950 min-h-screen pb-20 flex flex-col">
      <header className="border-b border-zinc-800/50 px-4 py-2.5 flex items-center gap-3 bg-zinc-950/90 backdrop-blur-xl">
        <button onClick={goBack} className="p-1 text-zinc-100">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm font-bold text-zinc-100">
          {step === 1 && 'Para quem?'}
          {step === 2 && 'O que indicar?'}
          {step === 3 && 'Mensagem'}
        </h1>
        <div className="ml-auto flex gap-1">
          {(navItem ? [1, 3] : [1, 2, 3]).map(s => (
            <div key={s} className={`w-1.5 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-zinc-100' : 'bg-zinc-700'}`} />
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Step 1 */}
        {step === 1 && (
          <div key="step-1" style={animStyle} className="p-4">
            {navItem && <ItemCard item={navItem} label="Indicando" />}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Buscar conexões..."
                className="w-full bg-zinc-900 rounded-lg py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-zinc-700 text-zinc-100 placeholder:text-zinc-500 ring-1 ring-zinc-800"
              />
            </div>
            <div className="space-y-1">
              {connectedUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => { setSelectedUser(user); setStep(navItem ? 3 : 2); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-900/60 text-left transition-colors"
                >
                  <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover ring-1 ring-zinc-800" />
                  <span className="font-medium text-sm text-zinc-100">{user.name}</span>
                </button>
              ))}
              {connectedUsers.length === 0 && (
                <p className="text-zinc-500 text-center py-8 text-sm">Nenhuma conexão encontrada.</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div key="step-2" style={animStyle} className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="text"
                value={itemSearch}
                onChange={e => setItemSearch(e.target.value)}
                placeholder="Buscar filmes, séries, animes..."
                autoFocus
                className="w-full bg-zinc-900 rounded-lg py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-zinc-700 text-zinc-100 placeholder:text-zinc-500 ring-1 ring-zinc-800"
              />
              {isSearching && (
                <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 animate-spin" />
              )}
            </div>
            {!itemSearch.trim() && (
              <p className="text-xs text-zinc-600 text-center mb-4">
                {loadingBrowse ? 'Carregando...' : 'Em alta esta semana · ou busque qualquer título'}
              </p>
            )}
            <div className="grid grid-cols-3 gap-2">
              {loadingBrowse && !itemSearch.trim() && (
                <div className="col-span-3 flex justify-center py-10">
                  <Loader2 size={22} className="text-zinc-600 animate-spin" />
                </div>
              )}
              {displayedItems.map(item => (
                <button key={item.id} onClick={() => handleSelectItem(item)} className="flex flex-col text-left group">
                  <div className="aspect-[2/3] w-full mb-1.5 overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/10">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <span className="font-medium text-[11px] line-clamp-2 text-zinc-200 leading-snug">{item.title}</span>
                  {item.year && <span className="text-[10px] text-zinc-600 mt-0.5">{item.year}</span>}
                </button>
              ))}
              {itemSearch.trim() && !isSearching && tmdbResults.length === 0 && (
                <p className="text-zinc-500 text-center py-8 text-sm col-span-3">Nenhum resultado encontrado.</p>
              )}
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && selectedUser && selectedItem && (
          <div key="step-3" style={animStyle} className="p-4 flex flex-col">
            <ItemCard item={selectedItem} label="Indicando para" user={selectedUser} />

            <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">
              Mensagem (opcional)
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Por que essa pessoa deveria assistir?"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 outline-none focus:border-zinc-700 resize-none h-28 text-sm text-zinc-100 placeholder:text-zinc-600 mb-1"
              maxLength={280}
            />
            <div className="text-right text-xs text-zinc-600 mb-5">{message.length}/280</div>

            <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">
              Visibilidade
            </label>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {([
                { value: 'private',     icon: Lock,  label: 'Privado',  desc: 'Só o destinatário' },
                { value: 'connections', icon: Users, label: 'Amigos',   desc: 'Seu círculo' },
                { value: 'public',      icon: Globe, label: 'Público',  desc: 'Todos' },
              ] as const).map(({ value, icon: Icon, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setVisibility(value)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-colors ${
                    visibility === value
                      ? 'border-zinc-400 bg-zinc-800 text-zinc-100'
                      : 'border-zinc-800 bg-zinc-900/30 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon size={17} />
                  <span className="text-xs font-semibold leading-none">{label}</span>
                  <span className="text-[10px] leading-none text-zinc-600">{desc}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-6 p-3 border border-zinc-800/50 rounded-xl bg-zinc-900/30">
              <div>
                <p className="text-sm font-medium text-zinc-200">Permitir discussão</p>
                <p className="text-xs text-zinc-600">Outros poderão comentar</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={discussionEnabled}
                  onChange={e => setDiscussionEnabled(e.target.checked)}
                />
                <div className="w-10 h-5 bg-zinc-800 rounded-full peer peer-checked:bg-zinc-100 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 peer-checked:after:bg-zinc-950" />
              </label>
            </div>

            <button
              onClick={handleCreate}
              className="w-full bg-zinc-100 text-zinc-950 font-bold py-3 rounded-xl active:scale-[0.98] transition-transform hover:bg-white text-sm"
            >
              Enviar Indicação
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
