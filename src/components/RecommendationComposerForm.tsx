import React from 'react';
import { Globe, Lock, Users } from 'lucide-react';
import { formatUsername } from '../lib/username';
import { Item, Recommendation, User } from '../types';

const VISIBILITY_OPTIONS = [
  { value: 'private', icon: Lock, label: 'Privado', description: 'Só o destinatário' },
  { value: 'connections', icon: Users, label: 'Amigos', description: 'Seu círculo' },
  { value: 'public', icon: Globe, label: 'Público', description: 'Todos' },
] as const;

function SummaryCard({
  item,
  user,
  label,
}: {
  item: Item;
  user: User;
  label: string;
}) {
  return (
    <div className="mb-4 flex gap-3 rounded-xl bg-zinc-900/50 p-3 ring-1 ring-zinc-800/50 lg:mb-6 lg:bg-transparent lg:p-0 lg:ring-0">
      <img
        src={item.image}
        alt={item.title}
        className="h-[68px] w-12 shrink-0 rounded-lg object-cover ring-1 ring-white/10 lg:h-[120px] lg:w-20"
      />
      <div className="min-w-0 flex flex-col justify-center">
        <p className="mb-0.5 text-xs text-zinc-500">{label}</p>
        <div className="mb-1">
          <div className="flex items-center gap-1.5">
            <img
              src={user.avatar}
              alt={user.name}
              className="h-4 w-4 shrink-0 rounded-full object-cover ring-1 ring-zinc-800"
            />
            <span className="truncate text-xs font-medium text-zinc-100 lg:text-sm">{user.name}</span>
          </div>
          <span className="ml-5 block text-[11px] text-zinc-500">{formatUsername(user.username)}</span>
        </div>
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-100 lg:text-xl lg:font-medium lg:leading-8">{item.title}</p>
        {item.year && <p className="mt-0.5 text-xs text-zinc-600 lg:text-sm">{item.year}</p>}
      </div>
    </div>
  );
}

type RecommendationComposerFormProps = {
  item: Item;
  user: User;
  message: string;
  visibility: Recommendation['visibility'];
  discussionEnabled: boolean;
  submitLabel: string;
  summaryLabel?: string;
  submitting?: boolean;
  onMessageChange: (value: string) => void;
  onVisibilityChange: (value: Recommendation['visibility']) => void;
  onDiscussionEnabledChange: (value: boolean) => void;
  onSubmit: () => void | Promise<void>;
};

export function RecommendationComposerForm({
  item,
  user,
  message,
  visibility,
  discussionEnabled,
  submitLabel,
  summaryLabel = 'Indicando para',
  submitting = false,
  onMessageChange,
  onVisibilityChange,
  onDiscussionEnabledChange,
  onSubmit,
}: RecommendationComposerFormProps) {
  return (
    <div className="flex flex-col lg:max-w-[760px]">
      <SummaryCard item={item} user={user} label={summaryLabel} />

      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        Mensagem (opcional)
      </label>
      <textarea
        value={message}
        onChange={event => onMessageChange(event.target.value)}
        placeholder="Por que essa pessoa deveria assistir?"
        className="mb-1 h-28 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-700 lg:h-36 lg:bg-zinc-900/70 lg:text-[15px]"
        maxLength={280}
      />
      <div className="mb-5 text-right text-xs text-zinc-600">{message.length}/280</div>

      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        Visibilidade
      </label>
      <div className="mb-6 grid grid-cols-3 gap-2 lg:gap-3">
        {VISIBILITY_OPTIONS.map(({ value, icon: Icon, label, description }) => (
          <button
            key={value}
            type="button"
            onClick={() => onVisibilityChange(value)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 transition-colors lg:items-start lg:px-4 lg:py-4 ${
              visibility === value
                ? 'border-zinc-400 bg-zinc-800 text-zinc-100'
                : 'border-zinc-800 bg-zinc-900/30 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon size={17} />
            <span className="text-xs font-medium leading-none">{label}</span>
            <span className="text-[10px] leading-none text-zinc-600">{description}</span>
          </button>
        ))}
      </div>

      <div className="mb-8 flex items-center justify-between rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-3 lg:bg-transparent lg:px-0">
        <div>
          <p className="text-sm font-medium text-zinc-200">Permitir discussão</p>
          <p className="text-xs text-zinc-600">Outros poderão comentar</p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={discussionEnabled}
            onChange={event => onDiscussionEnabledChange(event.target.checked)}
          />
          <div className="peer h-5 w-10 rounded-full bg-zinc-800 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-zinc-400 after:transition-all after:content-[''] peer-checked:bg-zinc-100 peer-checked:after:translate-x-5 peer-checked:after:bg-zinc-950" />
        </label>
      </div>

      <button
        type="button"
        onClick={() => void onSubmit()}
        disabled={submitting}
        className="w-full rounded-xl bg-zinc-100 py-3 text-sm font-semibold text-zinc-950 transition-transform hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 lg:w-auto lg:min-w-[220px] lg:px-8"
      >
        {submitLabel}
      </button>
    </div>
  );
}
