import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { ArrowLeft, Search } from 'lucide-react';
import { Item, User } from '../types';

export function CreateRecommendation() {
  const navigate = useNavigate();
  const { users, items, connections, currentUser, addRecommendation } = useStore();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [message, setMessage] = useState('');
  const [discussionEnabled, setDiscussionEnabled] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');

  // Get valid connections (accepted)
  const connectedUserIds = connections
    .filter(c => c.status === 'accepted' && (c.requester_id === currentUser.id || c.receiver_id === currentUser.id))
    .map(c => c.requester_id === currentUser.id ? c.receiver_id : c.requester_id);
  
  const connectedUsers = users
    .filter(u => connectedUserIds.includes(u.id))
    .filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()));

  const filteredItems = items.filter(i => i.title.toLowerCase().includes(itemSearch.toLowerCase()));

  const handleCreate = () => {
    if (!selectedUser || !selectedItem) return;
    
    addRecommendation({
      from_user_id: currentUser.id,
      to_user_id: selectedUser.id,
      item_id: selectedItem.id,
      message: message.trim() || undefined,
      discussion_enabled: discussionEnabled,
      visibility: 'connections',
    });
    
    navigate('/');
  };

  return (
    <div className="max-w-md mx-auto bg-zinc-950 min-h-screen pb-20 flex flex-col">
      <header className="border-b border-zinc-800/50 px-4 py-3 flex items-center gap-3 sticky top-0 bg-zinc-950/80 backdrop-blur-xl z-10">
        <button onClick={() => step > 1 ? setStep(step - 1 as any) : navigate(-1)} className="p-1 text-zinc-100 hover:text-zinc-300 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-zinc-100">
          {step === 1 && 'Para quem?'}
          {step === 2 && 'O que indicar?'}
          {step === 3 && 'Mensagem'}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {step === 1 && (
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
              <input 
                type="text" 
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar conexões..." 
                className="w-full bg-zinc-900 rounded-lg py-2 pl-10 pr-4 outline-none focus:ring-1 focus:ring-zinc-700 text-zinc-100 placeholder:text-zinc-500 ring-1 ring-zinc-800"
              />
            </div>
            <div className="space-y-2">
              {connectedUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => { setSelectedUser(user); setStep(2); }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-900/50 text-left transition-colors"
                >
                  <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover ring-1 ring-zinc-800" />
                  <span className="font-medium text-lg text-zinc-100">{user.name}</span>
                </button>
              ))}
              {connectedUsers.length === 0 && (
                <p className="text-zinc-500 text-center py-8">Nenhuma conexão encontrada.</p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
              <input 
                type="text" 
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Buscar filmes, séries ou animes..." 
                className="w-full bg-zinc-900 rounded-lg py-2 pl-10 pr-4 outline-none focus:ring-1 focus:ring-zinc-700 text-zinc-100 placeholder:text-zinc-500 ring-1 ring-zinc-800"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setSelectedItem(item); setStep(3); }}
                  className="flex flex-col text-left group"
                >
                  <div className="aspect-[2/3] w-full mb-2 overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/10">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <span className="font-medium text-sm line-clamp-2 text-zinc-100">{item.title}</span>
                  <span className="text-xs text-zinc-500 uppercase">{item.type}</span>
                </button>
              ))}
              {filteredItems.length === 0 && (
                <p className="text-zinc-500 text-center py-8 col-span-2">Nenhum item encontrado.</p>
              )}
            </div>
          </div>
        )}

        {step === 3 && selectedUser && selectedItem && (
          <div className="p-4 flex flex-col h-full">
            <div className="flex gap-4 mb-6 p-4 bg-zinc-900/50 rounded-xl ring-1 ring-zinc-800/50">
              <img src={selectedItem.image} alt={selectedItem.title} className="w-14 h-20 object-cover rounded shadow-sm ring-1 ring-white/10" />
              <div>
                <p className="text-sm text-zinc-500 mb-1">Indicando para</p>
                <div className="flex items-center gap-2">
                  <img src={selectedUser.avatar} alt={selectedUser.name} className="w-6 h-6 rounded-full object-cover ring-1 ring-zinc-800" />
                  <span className="font-bold text-zinc-100">{selectedUser.name}</span>
                </div>
                <p className="font-medium mt-2 line-clamp-2 text-zinc-300">{selectedItem.title}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Mensagem (opcional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Por que essa pessoa deveria assistir?"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 resize-none h-32 text-zinc-100 placeholder:text-zinc-600"
                maxLength={280}
              />
              <div className="text-right text-xs text-zinc-500 mt-1">
                {message.length}/280
              </div>
            </div>

            <div className="flex items-center justify-between mb-8 p-4 border border-zinc-800/50 rounded-xl bg-zinc-900/30">
              <div>
                <p className="font-medium text-zinc-200">Permitir discussão</p>
                <p className="text-xs text-zinc-500">Outros poderão comentar nesta indicação</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={discussionEnabled}
                  onChange={(e) => setDiscussionEnabled(e.target.checked)}
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-zinc-950 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-100 peer-checked:after:bg-zinc-950"></div>
              </label>
            </div>

            <button
              onClick={handleCreate}
              className="w-full bg-zinc-100 text-zinc-950 font-bold py-4 rounded-xl mt-auto active:scale-[0.98] transition-transform hover:bg-white"
            >
              Enviar Indicação
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
