import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, X } from 'lucide-react';
import { useStore } from '../store';
import { RecommendationCard } from './RecommendationCard';
import { cn } from '../lib/utils';

type Tab = 'received' | 'made' | 'watchlist' | 'watched';

export function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { users, recommendations, userItemStatuses, items, currentUser, connections, toggleFollow, updateCurrentUser } = useStore();

  const [activeTab, setActiveTab] = useState<Tab>('received');
  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editBio, setEditBio] = useState(currentUser.bio || '');

  const user = users.find(u => u.id === id);
  if (!user) return <div className="p-8 text-center">Usuário não encontrado</div>;

  const isOwnProfile = currentUser.id === user.id;

  const isFollowing = connections.some(
    c => c.requester_id === currentUser.id && c.receiver_id === user.id
  );

  const followersCount = connections.filter(c => c.receiver_id === user.id && c.status === 'accepted').length;
  const followingCount = connections.filter(c => c.requester_id === user.id && c.status === 'accepted').length;

  const receivedRecs = recommendations.filter(r => r.to_user_id === user.id);
  const madeRecs = recommendations.filter(r => r.from_user_id === user.id);

  const watchlistItems = userItemStatuses
    .filter(s => s.user_id === user.id && s.status === 'saved')
    .map(s => items.find(i => i.id === s.item_id))
    .filter(Boolean);

  const watchedItems = userItemStatuses
    .filter(s => s.user_id === user.id && s.status === 'watched')
    .map(s => items.find(i => i.id === s.item_id))
    .filter(Boolean);

  const handleSaveSettings = () => {
    if (!editName.trim()) return;
    updateCurrentUser({ name: editName.trim(), bio: editBio.trim() || undefined });
    setShowSettings(false);
  };

  return (
    <div className="max-w-md mx-auto bg-zinc-950 min-h-screen pb-20">
      {/* Header */}
      <header className="bg-zinc-950/80 backdrop-blur-xl px-4 py-2.5 flex justify-between items-center sticky top-0 z-10 border-b border-zinc-800/50">
        <button onClick={() => navigate(-1)} className="p-1 text-zinc-100">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm font-bold text-zinc-100">{user.name}</h1>
        {isOwnProfile ? (
          <button onClick={() => setShowSettings(true)} className="p-1 text-zinc-400 hover:text-zinc-200">
            <Settings size={20} />
          </button>
        ) : (
          <div className="w-8" />
        )}
      </header>

      {/* Profile header */}
      <div className="px-4 py-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-5 mb-3">
          <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover ring-2 ring-zinc-800 shrink-0" />
          <div className="flex-1 flex justify-around text-center">
            <div>
              <p className="text-base font-black text-zinc-100">{receivedRecs.length}</p>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Indicações</p>
            </div>
            <div>
              <p className="text-base font-black text-zinc-100">{followersCount}</p>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Seguidores</p>
            </div>
            <div>
              <p className="text-base font-black text-zinc-100">{followingCount}</p>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Seguindo</p>
            </div>
          </div>
        </div>

        <p className="text-sm font-bold text-zinc-100">{user.name}</p>
        {user.bio && <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{user.bio}</p>}

        {!isOwnProfile && (
          <button
            onClick={() => toggleFollow(user.id)}
            className={cn(
              "w-full mt-3 py-2 rounded-lg text-sm font-bold transition-colors",
              isFollowing
                ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                : "bg-zinc-100 text-zinc-950 hover:bg-white"
            )}
          >
            {isFollowing ? 'Seguindo' : 'Seguir'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/50 sticky top-[53px] z-10 flex overflow-x-auto">
        <TabButton active={activeTab === 'received'} onClick={() => setActiveTab('received')}>
          Recebidas ({receivedRecs.length})
        </TabButton>
        <TabButton active={activeTab === 'made'} onClick={() => setActiveTab('made')}>
          Feitas ({madeRecs.length})
        </TabButton>
        <TabButton active={activeTab === 'watchlist'} onClick={() => setActiveTab('watchlist')}>
          Watchlist ({watchlistItems.length})
        </TabButton>
        <TabButton active={activeTab === 'watched'} onClick={() => setActiveTab('watched')}>
          Assistidos ({watchedItems.length})
        </TabButton>
      </div>

      {/* Tab content */}
      <div className="flex flex-col">
        {activeTab === 'received' && (
          receivedRecs.length > 0
            ? receivedRecs.map(rec => <RecommendationCard key={rec.id} recommendation={rec} />)
            : <EmptyState message="Nenhuma indicação recebida." />
        )}
        {activeTab === 'made' && (
          madeRecs.length > 0
            ? madeRecs.map(rec => <RecommendationCard key={rec.id} recommendation={rec} />)
            : <EmptyState message="Nenhuma indicação feita." />
        )}
        {activeTab === 'watchlist' && (
          watchlistItems.length > 0 ? (
            <div className="grid grid-cols-3 gap-0.5 bg-zinc-900/20">
              {watchlistItems.map(item => (
                <div key={item!.id} className="aspect-[2/3] relative cursor-pointer" onClick={() => navigate(`/item/${item!.id}`)}>
                  <img src={item!.image} alt={item!.title} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : <EmptyState message="Watchlist vazia." />
        )}
        {activeTab === 'watched' && (
          watchedItems.length > 0 ? (
            <div className="grid grid-cols-3 gap-0.5 bg-zinc-900/20">
              {watchedItems.map(item => (
                <div key={item!.id} className="aspect-[2/3] relative cursor-pointer" onClick={() => navigate(`/item/${item!.id}`)}>
                  <img src={item!.image} alt={item!.title} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : <EmptyState message="Nenhum item assistido." />
        )}
      </div>

      {/* Settings bottom sheet */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowSettings(false)}>
          <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md mx-auto bg-zinc-900 rounded-t-2xl border-t border-zinc-800 p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-base text-zinc-100">Editar perfil</h2>
              <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-zinc-300 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="flex justify-center mb-5">
              <img src={currentUser.avatar} className="w-16 h-16 rounded-full object-cover ring-2 ring-zinc-700" />
            </div>

            <label className="block text-xs text-zinc-500 font-medium mb-1.5 uppercase tracking-wide">Nome</label>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-zinc-600 ring-1 ring-zinc-700 mb-4"
              placeholder="Seu nome"
            />

            <label className="block text-xs text-zinc-500 font-medium mb-1.5 uppercase tracking-wide">Bio</label>
            <textarea
              value={editBio}
              onChange={e => setEditBio(e.target.value)}
              rows={3}
              className="w-full bg-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-zinc-600 ring-1 ring-zinc-700 resize-none mb-5"
              placeholder="Fale um pouco sobre você..."
              maxLength={150}
            />

            <button
              onClick={handleSaveSettings}
              disabled={!editName.trim()}
              className="w-full bg-zinc-100 text-zinc-950 font-bold py-2.5 rounded-xl disabled:opacity-40 hover:bg-white transition-colors"
            >
              Salvar
            </button>
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
        "px-3 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors flex-1",
        active ? "border-zinc-100 text-zinc-100" : "border-transparent text-zinc-500 hover:text-zinc-300"
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="p-10 text-center text-zinc-600 text-sm">{message}</div>;
}
