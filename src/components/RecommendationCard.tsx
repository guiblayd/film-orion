import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Recommendation } from '../types';
import { useStore } from '../store';

const getRelativeTime = (dateStr: string) => {
  const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'agora';
  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return `há 1 hora`;
  if (hours < 24) return `há ${hours} horas`;
  const days = Math.floor(hours / 24);
  if (days === 1) return `há 1 dia`;
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months === 1) return `há 1 mês`;
  if (months < 12) return `há ${months} meses`;
  const years = Math.floor(days / 365);
  if (years === 1) return `há 1 ano`;
  return `há ${years} anos`;
};

interface Props {
  recommendation: Recommendation;
  key?: React.Key;
}

export function RecommendationCard({ recommendation }: Props) {
  const { users, items, interactions, comments } = useStore();

  const fromUser = users.find(u => u.id === recommendation.from_user_id);
  const toUser = users.find(u => u.id === recommendation.to_user_id);
  const item = items.find(i => i.id === recommendation.item_id);

  if (!fromUser || !toUser || !item) return null;

  const recInteractions = interactions.filter(i => i.recommendation_id === recommendation.id);
  const supportUsers = recInteractions.filter(i => i.type === 'support').map(i => users.find(u => u.id === i.user_id)).filter(Boolean);
  const opposeUsers = recInteractions.filter(i => i.type === 'oppose').map(i => users.find(u => u.id === i.user_id)).filter(Boolean);

  const timestamp = getRelativeTime(recommendation.created_at);

  return (
    <Link 
      to={`/recommendation/${recommendation.id}`}
      className="block border-b border-zinc-800/50 p-4 bg-zinc-950 hover:bg-zinc-900/50 transition-colors"
    >
      {/* Line 1: [from_user] -> [to_user] */}
      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-3 font-medium w-full">
        <img src={fromUser.avatar} alt={fromUser.name} className="w-5 h-5 rounded-full object-cover ring-1 ring-zinc-800 shrink-0" />
        <span className="text-zinc-300 truncate min-w-0">{fromUser.name}</span>
        <ArrowRight size={14} className="text-zinc-600 shrink-0" />
        <img src={toUser.avatar} alt={toUser.name} className="w-5 h-5 rounded-full object-cover ring-1 ring-zinc-800 shrink-0" />
        <span className="text-zinc-300 truncate min-w-0">{toUser.name}</span>
        <span className="text-zinc-500 text-xs ml-auto font-normal shrink-0 pl-2">{timestamp}</span>
      </div>

      {/* Line 2: [poster left] [content right] */}
      <div className="flex gap-4">
        <div className="shrink-0">
          <img 
            src={item.image} 
            alt={item.title} 
            className="w-14 h-20 object-cover rounded shadow-sm ring-1 ring-white/10"
          />
        </div>
        
        <div className="flex flex-col flex-1 min-w-0 py-1">
          <h3 className="font-bold text-lg text-zinc-100 leading-tight line-clamp-2 mb-4">{item.title}</h3>
          
          <div className="flex items-center gap-4 mt-auto pt-1">
            {/* Support */}
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {supportUsers.length > 0 ? (
                  <>
                    {supportUsers.slice(0, 3).map((u, idx) => (
                      <img key={idx} src={u!.avatar} className="w-6 h-6 rounded-full border-2 border-emerald-500 object-cover relative" style={{ zIndex: idx }} />
                    ))}
                    {supportUsers.length > 3 && (
                      <div className="w-6 h-6 rounded-full border-2 border-emerald-500 bg-zinc-900 flex items-center justify-center relative" style={{ zIndex: 10 }}>
                        <span className="text-[10px] text-emerald-500 font-bold">+{supportUsers.length - 3}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-6 h-6 rounded-full border border-dashed border-emerald-500/40 bg-emerald-500/5 flex items-center justify-center">
                    <span className="text-[10px] text-emerald-500/60 font-medium">0</span>
                  </div>
                )}
              </div>
            </div>

            {/* Oppose */}
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {opposeUsers.length > 0 ? (
                  <>
                    {opposeUsers.slice(0, 3).map((u, idx) => (
                      <img key={idx} src={u!.avatar} className="w-6 h-6 rounded-full border-2 border-rose-500 object-cover relative" style={{ zIndex: idx }} />
                    ))}
                    {opposeUsers.length > 3 && (
                      <div className="w-6 h-6 rounded-full border-2 border-rose-500 bg-zinc-900 flex items-center justify-center relative" style={{ zIndex: 10 }}>
                        <span className="text-[10px] text-rose-500 font-bold">+{opposeUsers.length - 3}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-6 h-6 rounded-full border border-dashed border-rose-500/40 bg-rose-500/5 flex items-center justify-center">
                    <span className="text-[10px] text-rose-500/60 font-medium">0</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
