import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Globe, Lock, Users } from 'lucide-react';
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

function VisibilityIcon({
  visibility,
  size = 10,
}: {
  visibility: string | null | undefined;
  size?: number;
}) {
  const Icon = VISIBILITY_ICON[visibility as keyof typeof VISIBILITY_ICON] ?? Users;
  return <Icon size={size} className="shrink-0 text-zinc-600 opacity-60" />;
}

export function RecommendationCard({ card }: Props) {
  const { currentUser } = useStore();
  const { recommendation, item, fromUser, toUser, participants, participantCount } = card;
  const supportCount = card.interactions.filter(interaction => interaction.type === 'support').length;
  const commentCount = card.comments.length;
  const recipientLabel = toUser.id === currentUser.id ? 'voc\u00ea' : toUser.name;
  const relativeTime = getRelativeTime(recommendation.created_at);

  return (
    <Link
      to={`/recommendation/${recommendation.id}`}
      className="flex gap-3 border-b border-zinc-800/50 bg-zinc-950 px-3 py-2.5 transition-colors hover:bg-zinc-900/40 active:bg-zinc-900/60 lg:gap-4 lg:bg-transparent lg:px-0 lg:py-6 lg:hover:bg-zinc-900/25 lg:active:bg-zinc-900/35"
    >
      <img
        src={item.image}
        alt={item.title}
        className="mt-0.5 h-16 w-11 shrink-0 rounded object-cover ring-1 ring-white/10 lg:hidden"
      />

      <img
        src={fromUser.avatar}
        alt={fromUser.name}
        className="mt-0.5 hidden h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-zinc-800 lg:block"
      />

      <div className="min-w-0 flex-1 py-0.5">
        <div className="lg:hidden">
          <div className="mb-1 flex items-center gap-1 text-xs text-zinc-500">
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <img
                src={fromUser.avatar}
                alt={fromUser.name}
                className="h-4 w-4 shrink-0 rounded-full object-cover ring-1 ring-zinc-800"
              />
              <span className="truncate text-zinc-400">{fromUser.name}</span>
              <ArrowRight size={10} className="shrink-0 text-zinc-700" />
              <img
                src={toUser.avatar}
                alt={toUser.name}
                className="h-4 w-4 shrink-0 rounded-full object-cover ring-1 ring-zinc-800"
              />
              <span className="truncate text-zinc-400">{recipientLabel}</span>
            </div>
            <span className="ml-auto shrink-0 text-zinc-600">{relativeTime}</span>
          </div>

          <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-100">
            {item.title}
          </p>

          <div className="mt-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <VisibilityIcon visibility={recommendation.visibility} />
            </div>

            {participants.length > 0 ? (
              <div className="flex -space-x-1.5">
                {participants.map((participant, index) => (
                  <img
                    key={participant.id}
                    src={participant.avatar}
                    alt={participant.name}
                    className="h-4 w-4 rounded-full object-cover ring-1 ring-zinc-950"
                    style={{ zIndex: index }}
                  />
                ))}
                {participantCount > participants.length ? (
                  <div
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-800 ring-1 ring-zinc-950"
                    style={{ zIndex: participants.length }}
                  >
                    <span className="text-[8px] font-semibold text-zinc-400">+{participantCount - participants.length}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[15px] leading-6 text-zinc-500">
                <span className="font-semibold text-zinc-100">{fromUser.name}</span>
                <ArrowRight size={12} className="shrink-0 text-zinc-700" />
                <span className="truncate text-zinc-300">{recipientLabel}</span>
              </div>
            </div>

            <span className="shrink-0 pt-0.5 text-xs text-zinc-600">{relativeTime}</span>
          </div>

          {recommendation.message ? (
            <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-zinc-200">
              {recommendation.message}
            </p>
          ) : null}

          <div className="mt-4 flex gap-3">
            <img
              src={item.image}
              alt={item.title}
              className="h-[118px] w-20 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
            />

            <div className="min-w-0 flex-1 pt-0.5">
              <p className="line-clamp-2 text-[20px] font-medium leading-8 text-zinc-100">
                {item.title}
              </p>
              <p className="mt-1 text-[13px] text-zinc-500">
                {getItemTypeLabel(item.type)}
                {item.year ? ` \u2022 ${item.year}` : ''}
                <span className="ml-1.5 inline-flex items-center align-middle">
                  <VisibilityIcon visibility={recommendation.visibility} />
                </span>
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
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
      </div>
    </Link>
  );
}

function getItemTypeLabel(type: string) {
  if (type === 'movie') return 'Filme';
  if (type === 'series') return 'S\u00e9rie';
  return 'Anime';
}

function formatCount(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}
