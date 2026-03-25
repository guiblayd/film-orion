import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';
import { useStore } from '../store';
import { RecommendationCard } from './RecommendationCard';
import { cn } from '../lib/utils';

type Tab = 'received' | 'made' | 'watchlist' | 'watched';

export function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { users, recommendations, userItemStatuses, items, currentUser, connections } = useStore();
  
  const [activeTab, setActiveTab] = useState<Tab>('received');

  const user = users.find(u => u.id === id);
  if (!user) return <div className="p-8 text-center">Usuário não encontrado</div>;

  const isOwnProfile = currentUser.id === user.id;

  // Stats
  const followersCount = connections.filter(c => c.receiver_id === user.id && c.status === 'accepted').length;
  const followingCount = connections.filter(c => c.requester_id === user.id && c.status === 'accepted').length;

  // Data for tabs
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

  return (
    <div className="max-w-md mx-auto bg-zinc-950 min-h-screen pb-20">
      <header className="bg-zinc-950/80 backdrop-blur-xl px-4 py-3 flex justify-between items-center sticky top-0 z-10 border-b border-zinc-800/50">
        <button onClick={() => navigate(-1)} className="p-1 text-zinc-100 hover:text-zinc-300 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-zinc-100">{user.name}</h1>
        {isOwnProfile ? (
          <button className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors"><Settings size={24} /></button>
        ) : (
          <div className="w-8" /> // Spacer
        )}
      </header>

      {/* Profile Header */}
      <div className="bg-zinc-950 p-6 border-b border-zinc-800/50">
        <div className="flex items-center gap-6 mb-4">
          <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full object-cover ring-4 ring-zinc-900" />
          <div className="flex-1 flex justify-around text-center">
            <div>
              <p className="text-xl font-black text-zinc-100">{followersCount}</p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Seguidores</p>
            </div>
            <div>
              <p className="text-xl font-black text-zinc-100">{followingCount}</p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Seguindo</p>
            </div>
          </div>
        </div>
        
        <h2 className="text-xl font-bold mb-1 text-zinc-100">{user.name}</h2>
        {user.bio && <p className="text-zinc-400 text-sm leading-relaxed">{user.bio}</p>}
        
        {!isOwnProfile && (
          <button className="w-full mt-4 bg-zinc-100 text-zinc-900 font-bold py-2.5 rounded-xl active:scale-[0.98] transition-transform hover:bg-white">
            Seguir
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/50 sticky top-[57px] z-10 flex overflow-x-auto hide-scrollbar">
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

      {/* Content */}
      <div className="flex flex-col">
        {activeTab === 'received' && (
          receivedRecs.length > 0 ? receivedRecs.map(rec => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          )) : <EmptyState message="Nenhuma indicação recebida." />
        )}
        
        {activeTab === 'made' && (
          madeRecs.length > 0 ? madeRecs.map(rec => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          )) : <EmptyState message="Nenhuma indicação feita." />
        )}
        
        {activeTab === 'watchlist' && (
          watchlistItems.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-950">
              {watchlistItems.map(item => (
                <div key={item!.id} className="aspect-[2/3] relative group cursor-pointer" onClick={() => navigate(`/item/${item!.id}`)}>
                  <img src={item!.image} alt={item!.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-zinc-100 text-xs font-bold px-2 text-center line-clamp-2">{item!.title}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState message="Watchlist vazia." />
        )}
        
        {activeTab === 'watched' && (
          watchedItems.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-950">
              {watchedItems.map(item => (
                <div key={item!.id} className="aspect-[2/3] relative group cursor-pointer" onClick={() => navigate(`/item/${item!.id}`)}>
                  <img src={item!.image} alt={item!.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-zinc-100 text-xs font-bold px-2 text-center line-clamp-2">{item!.title}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState message="Nenhum item assistido." />
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors",
        active ? "border-zinc-100 text-zinc-100" : "border-transparent text-zinc-500 hover:text-zinc-300"
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-12 text-center text-zinc-500 font-medium">
      {message}
    </div>
  );
}
