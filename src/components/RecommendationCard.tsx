import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Lock, Users } from 'lucide-react';
import { formatUsername } from '../lib/username';
import { getRelativeTime } from '../lib/utils';
import { RecommendationCardData } from '../services/recommendations';
import { useStore } from '../store';

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
  return <Icon size={10} className="shrink-0 text-zinc-600 opacity-60" />;
}

export function RecommendationCard({ card }: Props) {
  const { currentUser } = useStore();
  const { recommendation, item, fromUser, toUser, participants, participantCount } = card;
  const supportCount = card.interactions.filter(interaction => interaction.type === 'support').length;
  const commentCount = card.comments.length;
  const recipientLabel = toUser.id === currentUser.id ? 'voc\u00ea' : toUser.name;

  return (
    <Link
      to={`/recommendation/${recommendation.id}`}
      className="flex gap-3 border-b border-zinc-800/50 bg-zinc-950 px-4 py-3 transition-colors hover:bg-zinc-900/40 active:bg-zinc-900/60 lg:gap-4 lg:bg-transparent lg:px-0 lg:py-6 lg:hover:bg-zinc-900/25 lg:active:bg-zinc-900/35"
    >
      <img
        src={fromUser.avatar}
        alt={fromUser.name}
        className="mt-0.5 h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-zinc-800 lg:h-11 lg:w-11"
      />

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] leading-5 text-zinc-500 lg:text-[15px] lg:leading-6">
              <span className="font-semibold text-zinc-100">{fromUser.name}</span>
              <span>indicou para</span>
              <span className="inline-flex min-w-0 items-center gap-1.5 text-zinc-300">
                <img
                  src={toUser.avatar}
                  alt={toUser.name}
                  className="h-4 w-4 shrink-0 rounded-full object-cover ring-1 ring-zinc-800"
                />
                <span className="truncate">{recipientLabel}</span>
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-600 lg:text-[13px]">{formatUsername(fromUser.username)}</p>
          </div>

          <span className="shrink-0 pt-0.5 text-[11px] text-zinc-600 lg:text-xs">
            {getRelativeTime(recommendation.created_at)}
          </span>
        </div>

        {recommendation.message ? (
          <p className="mt-2.5 whitespace-pre-line text-sm leading-6 text-zinc-200 lg:mt-3 lg:text-[15px] lg:leading-7">
            {recommendation.message}
          </p>
        ) : null}

        <div className="mt-3 flex gap-3 lg:mt-4">
          <img
            src={item.image}
            alt={item.title}
            className="h-[88px] w-[60px] shrink-0 rounded-lg object-cover ring-1 ring-white/10 lg:h-[118px] lg:w-20 lg:rounded-xl"
          />

          <div className="min-w-0 flex-1 pt-0.5">
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-100 lg:text-[20px] lg:font-medium lg:leading-8">
              {item.title}
            </p>
            <p className="mt-1 text-xs text-zinc-500 lg:text-[13px]">
              {getItemTypeLabel(item.type)}
              {item.year ? ` \u2022 ${item.year}` : ''}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500 lg:mt-3 lg:text-[13px]">
              <VisibilityIcon visibility={recommendation.visibility} />
              <span>{getVisibilityLabel(recommendation.visibility)}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-zinc-500 lg:mt-4 lg:text-xs">
          {supportCount > 0 ? <span>{formatCount(supportCount, 'apoio', 'apoios')}</span> : null}
          {commentCount > 0 ? <span>{formatCount(commentCount, 'coment\u00e1rio', 'coment\u00e1rios')}</span> : null}
          {participants.length > 0 ? (
            <span className="inline-flex items-center gap-2">
              <span className="flex -space-x-1.5">
                {participants.map((participant, index) => (
                  <img
                    key={participant.id}
                    src={participant.avatar}
                    alt={participant.name}
                    className="h-5 w-5 rounded-full object-cover ring-1 ring-zinc-950"
                    style={{ zIndex: participants.length - index }}
                  />
                ))}
                {participantCount > participants.length ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[9px] font-semibold text-zinc-300 ring-1 ring-zinc-950">
                    +{participantCount - participants.length}
                  </span>
                ) : null}
              </span>
              <span>{formatCount(participantCount, 'pessoa na conversa', 'pessoas na conversa')}</span>
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function getVisibilityLabel(visibility: string | null | undefined) {
  if (visibility === 'private') return 'Privado';
  if (visibility === 'public') return 'P\u00fablico';
  return 'C\u00edrculo';
}

function getItemTypeLabel(type: string) {
  if (type === 'movie') return 'Filme';
  if (type === 'series') return 'S\u00e9rie';
  return 'Anime';
}

function formatCount(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}
