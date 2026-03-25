import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock, Users, Globe } from 'lucide-react';
import { Recommendation } from '../types';
import { useStore } from '../store';
import { getRelativeTime } from '../lib/utils';

interface Props {
  recommendation: Recommendation;
}

const VISIBILITY_ICON = {
  private:     Lock,
  connections: Users,
  public:      Globe,
} as const;

function VisibilityIcon({ visibility }: { visibility: string | null | undefined }) {
  const Icon = VISIBILITY_ICON[visibility as keyof typeof VISIBILITY_ICON] ?? Users;
  return <Icon size={10} className="text-zinc-600 opacity-60 shrink-0" />;
}

export function RecommendationCard({ recommendation }: Props) {
  const { users, items, interactions, comments } = useStore();

  const fromUser = users.find(u => u.id === recommendation.from_user_id);
  const toUser = users.find(u => u.id === recommendation.to_user_id);
  const item = items.find(i => i.id === recommendation.item_id);

  if (!fromUser || !toUser || !item) return null;

  const recInteractions = interactions.filter(i => i.recommendation_id === recommendation.id);
  const recComments = comments.filter(c => c.recommendation_id === recommendation.id);

  // Participants who entered the discussion (voted or commented), deduplicated
  const participantIds = [...new Set([
    ...recInteractions.map(i => i.user_id),
    ...recComments.map(c => c.user_id),
  ])];
  const participants = participantIds
    .map(uid => users.find(u => u.id === uid))
    .filter(Boolean)
    .slice(0, 5);

  return (
    <Link
      to={`/recommendation/${recommendation.id}`}
      className="flex gap-3 px-3 py-2.5 border-b border-zinc-800/50 bg-zinc-950 hover:bg-zinc-900/40 transition-colors active:bg-zinc-900/60"
    >
      {/* Poster */}
      <img
        src={item.image}
        alt={item.title}
        className="w-11 h-16 object-cover rounded shrink-0 ring-1 ring-white/10 mt-0.5"
      />

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col py-0.5">
        {/* from → to + timestamp */}
        <div className="flex items-center gap-1 text-xs text-zinc-500 mb-1">
          <img src={fromUser.avatar} className="w-4 h-4 rounded-full object-cover ring-1 ring-zinc-800 shrink-0" />
          <span className="text-zinc-400 truncate max-w-[90px]">{fromUser.name}</span>
          <ArrowRight size={10} className="text-zinc-700 shrink-0" />
          <img src={toUser.avatar} className="w-4 h-4 rounded-full object-cover ring-1 ring-zinc-800 shrink-0" />
          <span className="text-zinc-400 truncate max-w-[90px]">{toUser.name}</span>
          <span className="ml-auto text-zinc-600 shrink-0">{getRelativeTime(recommendation.created_at)}</span>
        </div>

        {/* Title directly below users */}
        <p className="font-bold text-sm text-zinc-100 leading-snug line-clamp-2 flex-1">{item.title}</p>

        {/* Bottom row: visibility icon (left) + participant avatars (right) */}
        <div className="flex items-center justify-between mt-1.5">
          <VisibilityIcon visibility={recommendation.visibility} />
          {participants.length > 0 && (
            <div className="flex -space-x-1.5">
              {participants.map((u, idx) => (
                <img
                  key={u!.id}
                  src={u!.avatar}
                  alt={u!.name}
                  className="w-4 h-4 rounded-full object-cover ring-1 ring-zinc-950"
                  style={{ zIndex: idx }}
                />
              ))}
              {participantIds.length > 5 && (
                <div className="w-4 h-4 rounded-full bg-zinc-800 ring-1 ring-zinc-950 flex items-center justify-center" style={{ zIndex: 5 }}>
                  <span className="text-[8px] text-zinc-400 font-bold">+{participantIds.length - 5}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
