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
      className="flex gap-3 border-b border-zinc-800/50 bg-zinc-950 px-3 py-2.5 transition-colors hover:bg-zinc-900/40 active:bg-zinc-900/60 lg:gap-4 lg:border-zinc-800/40 lg:bg-transparent lg:px-0 lg:py-5 lg:hover:bg-transparent lg:active:bg-transparent"
    >
      <img
        src={item.image}
        alt={item.title}
        className="mt-0.5 h-16 w-11 shrink-0 rounded object-cover ring-1 ring-white/10 lg:h-24 lg:w-16 lg:rounded-lg"
      />

      <div className="flex-1 min-w-0 flex flex-col py-0.5">
        <div className="mb-1 flex items-center gap-1 text-xs text-zinc-500 lg:mb-1.5 lg:text-[13px]">
          <img src={fromUser.avatar} alt={fromUser.name} className="w-4 h-4 rounded-full object-cover ring-1 ring-zinc-800 shrink-0" />
          <span className="truncate text-zinc-400 lg:max-w-none">{fromUser.name}</span>
          <ArrowRight size={10} className="text-zinc-700 shrink-0" />
          <img src={toUser.avatar} alt={toUser.name} className="w-4 h-4 rounded-full object-cover ring-1 ring-zinc-800 shrink-0" />
          <span className="truncate text-zinc-400 lg:max-w-none">{toUser.name}</span>
          <span className="ml-auto shrink-0 text-zinc-600">{getRelativeTime(recommendation.created_at)}</span>
        </div>

        <p className="flex-1 line-clamp-2 text-sm font-semibold leading-snug text-zinc-100 lg:text-[17px] lg:font-medium lg:leading-7">{item.title}</p>

        {recommendation.message && (
          <p className="mt-2 hidden line-clamp-2 text-sm leading-relaxed text-zinc-500 lg:block">
            "{recommendation.message}"
          </p>
        )}

        <div className="mt-1.5 flex items-center justify-between lg:mt-3">
          <div className="flex items-center gap-2">
            <VisibilityIcon visibility={recommendation.visibility} />
            <span className="hidden text-[11px] uppercase tracking-[0.18em] text-zinc-600 lg:inline">
              {recommendation.visibility === 'private' ? 'Privado' : recommendation.visibility === 'public' ? 'Público' : 'Círculo'}
            </span>
          </div>
          {participants.length > 0 && (
            <div className="flex -space-x-1.5 lg:-space-x-2">
              {participants.map((participant, index) => (
                <img
                  key={participant.id}
                  src={participant.avatar}
                  alt={participant.name}
                  className="h-4 w-4 rounded-full object-cover ring-1 ring-zinc-950 lg:h-5 lg:w-5"
                  style={{ zIndex: index }}
                />
              ))}
              {participantCount > participants.length && (
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-800 ring-1 ring-zinc-950 lg:h-5 lg:w-5" style={{ zIndex: participants.length }}>
                  <span className="text-[8px] font-semibold text-zinc-400 lg:text-[9px]">+{participantCount - participants.length}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
