import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock, Users, Globe } from 'lucide-react';
import { getRelativeTime } from '../lib/utils';
import { RecommendationCardData } from '../services/recommendations';

interface Props {
  card: RecommendationCardData;
}

const VISIBILITY_ICON = {
  private: Lock,
  connections: Users,
  public: Globe,
} as const;

function VisibilityIcon({ visibility }: { visibility: string | null | undefined }) {
  const Icon = VISIBILITY_ICON[visibility as keyof typeof VISIBILITY_ICON] ?? Users;
  return <Icon size={10} className="text-zinc-600 opacity-60 shrink-0" />;
}

export function RecommendationCard({ card }: Props) {
  const { recommendation, item, fromUser, toUser, participants, participantCount } = card;

  return (
    <Link
      to={`/recommendation/${recommendation.id}`}
      className="flex gap-3 border-b border-zinc-800/50 bg-zinc-950 px-3 py-2.5 transition-colors hover:bg-zinc-900/40 active:bg-zinc-900/60 lg:bg-transparent lg:px-0 lg:hover:bg-transparent lg:active:bg-transparent"
    >
      <img
        src={item.image}
        alt={item.title}
        className="w-11 h-16 object-cover rounded shrink-0 ring-1 ring-white/10 mt-0.5"
      />

      <div className="flex-1 min-w-0 flex flex-col py-0.5">
        <div className="flex items-center gap-1 text-xs text-zinc-500 mb-1">
          <img src={fromUser.avatar} alt={fromUser.name} className="w-4 h-4 rounded-full object-cover ring-1 ring-zinc-800 shrink-0" />
          <span className="text-zinc-400 truncate max-w-[90px]">{fromUser.name}</span>
          <ArrowRight size={10} className="text-zinc-700 shrink-0" />
          <img src={toUser.avatar} alt={toUser.name} className="w-4 h-4 rounded-full object-cover ring-1 ring-zinc-800 shrink-0" />
          <span className="text-zinc-400 truncate max-w-[90px]">{toUser.name}</span>
          <span className="ml-auto text-zinc-600 shrink-0">{getRelativeTime(recommendation.created_at)}</span>
        </div>

        <p className="font-bold text-sm text-zinc-100 leading-snug line-clamp-2 flex-1">{item.title}</p>

        <div className="flex items-center justify-between mt-1.5">
          <VisibilityIcon visibility={recommendation.visibility} />
          {participants.length > 0 && (
            <div className="flex -space-x-1.5">
              {participants.map((participant, index) => (
                <img
                  key={participant.id}
                  src={participant.avatar}
                  alt={participant.name}
                  className="w-4 h-4 rounded-full object-cover ring-1 ring-zinc-950"
                  style={{ zIndex: index }}
                />
              ))}
              {participantCount > participants.length && (
                <div className="w-4 h-4 rounded-full bg-zinc-800 ring-1 ring-zinc-950 flex items-center justify-center" style={{ zIndex: participants.length }}>
                  <span className="text-[8px] text-zinc-400 font-bold">+{participantCount - participants.length}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
