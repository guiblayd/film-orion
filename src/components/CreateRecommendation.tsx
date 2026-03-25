import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { ArrowLeft, Search, Loader2, Lock, Users, Globe } from 'lucide-react';
import { Item, User } from '../types';
import { searchTMDB } from '../services/tmdb';

export function CreateRecommendation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { users, items, connections, currentUser, addRecommendation, addItem } = useStore();

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

  const connectedUserIds = connections
    .filter(c => c.status === 'accepted' && (c.requester_id === currentUser.id || c.receiver_id === currentUser.id))
    .map(c => c.requester_id === currentUser.id ? c.receiver_id : c.requester_id);

  const connectedUsers = users
    .filter(u => connectedUserIds.includes(u.id))
    .filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()));

  // TMDB search with debounce
  useEffect(() => {
    if (!itemSearch.trim()) {
      setTmdbResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchTMDB(itemSearch);
        setTmdbResults(results);
      } catch {
        setTmdbResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [itemSearch]);

  const displayedItems = itemSearch.trim() ? tmdbResults : items;

  const handleSelectItem = (item: Item) => {
    addItem(item); // adds to store if not present (TMDB items)
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

  return (
    <div className="max-w-md mx-auto bg-zinc-950 min-h-screen pb-20 flex flex-col">
      <header className="border-b border-zinc-800/50 px-4 py-2.5 flex items-center gap-3 bg-zinc-950/90 backdrop-blur-xl">
        <button
          onClick={() => {
            if (step === 1) navigate(-1);
            else if (step === 3 && navItem) setStep(1);
            else setStep(step - 1 as any);
          }}
          className="p-1 text-zinc-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm font-bold text-zinc-100">
          {step === 1 && 'Para quem?'}
          {step === 2 && 'O que indicar?'}
          {step === 3 && 'Mensagem'}
        </h1>
        {/* Step indicator */}
        <div className="ml-auto flex gap-1">
          {(navItem ? [1, 3] : [1, 2, 3]).map(s => (
            <div key={s} className={`w-1.5 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-zinc-100' : 'bg-zinc-700'}`} />
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Step 1: Select user */}
        {step === 1 && (
          <div className="p-4">
            {navItem && (
              <div className="flex gap-3 mb-4 p-3 bg-zinc-900/50 rounded-xl ring-1 ring-zinc-800/50">
                <img src={navItem.image} alt={navItem.title} className="w-10 h-14 object-cover rounded ring-1 ring-white/10" />
                <div className="flex flex-col justify-center">
                  <p className="text-xs text-zinc-500 mb-0.5">Indicando</p>
                  <p className="font-semibold text-sm text-zinc-100 line-clamp-2">{navItem.title}</p>
                  {navItem.year && <p className="text-xs text-zinc-600 mt-0.5">{navItem.year}</p>}
                </div>
              </div>
            )}
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

        {/* Step 2: Select item via TMDB */}
        {step === 2 && (
          <div className="p-4">
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
              <p className="text-xs text-zinc-600 text-center mb-4">Digite para buscar no catálogo do TMDB</p>
            )}

            <div className="grid grid-cols-3 gap-2">
              {displayedItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className="flex flex-col text-left group"
                >
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

        {/* Step 3: Message */}
        {step === 3 && selectedUser && selectedItem && (
          <div className="p-4 flex flex-col">
            <div className="flex gap-3 mb-5 p-3 bg-zinc-900/50 rounded-xl ring-1 ring-zinc-800/50">
              <img src={selectedItem.image} alt={selectedItem.title} className="w-12 h-[68px] object-cover rounded ring-1 ring-white/10" />
              <div>
                <p className="text-xs text-zinc-500 mb-1">Indicando para</p>
                <div className="flex items-center gap-2 mb-1.5">
                  <img src={selectedUser.avatar} alt={selectedUser.name} className="w-5 h-5 rounded-full object-cover ring-1 ring-zinc-800" />
                  <span className="font-bold text-sm text-zinc-100">{selectedUser.name}</span>
                </div>
                <p className="font-medium text-sm line-clamp-2 text-zinc-300">{selectedItem.title}</p>
              </div>
            </div>

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

            {/* Visibilidade */}
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
