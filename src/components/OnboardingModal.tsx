import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../store';
import { ONBOARDING_GENRES, ONBOARDING_PROVIDERS } from '../lib/onboarding';
import { Item } from '../types';
import { cn } from '../lib/utils';

export function OnboardingModal() {
  const { currentUser, connections, onboardingPreferences, onboardingDismissed, saveOnboarding, skipOnboarding, isReadOnly } = useStore();
  const [favoriteTypes, setFavoriteTypes] = useState<Item['type'][]>(onboardingPreferences?.favoriteTypes ?? ['movie', 'series']);
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>(onboardingPreferences?.favoriteGenres ?? []);
  const [favoriteProviders, setFavoriteProviders] = useState<string[]>(onboardingPreferences?.favoriteProviders ?? []);

  const shouldShow = Boolean(
    !isReadOnly &&
    currentUser.id &&
    !onboardingPreferences &&
    !onboardingDismissed &&
    connections.length === 0
  );

  if (!shouldShow) return null;

  const submit = () => {
    saveOnboarding({
      favoriteTypes,
      favoriteGenres,
      favoriteProviders,
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-zinc-950/80 px-4 py-6 backdrop-blur-sm lg:items-center">
      <div className="w-full max-w-2xl rounded-[32px] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Primeiros passos</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-100">Vamos montar seu gosto inicial.</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
              Escolha alguns formatos, generos e streamings favoritos para o app te recomendar melhor mesmo antes de voce seguir pessoas.
            </p>
          </div>
          <button onClick={skipOnboarding} className="rounded-full border border-zinc-800 p-2 text-zinc-500 hover:text-zinc-200">
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <PreferenceGroup title="Formatos">
            {[
              { value: 'movie', label: 'Filmes' },
              { value: 'series', label: 'Series' },
              { value: 'anime', label: 'Animes' },
            ].map(option => (
              <PreferenceChip
                key={option.value}
                active={favoriteTypes.includes(option.value as Item['type'])}
                onClick={() => setFavoriteTypes(toggleArrayValue(favoriteTypes, option.value as Item['type']))}
              >
                {option.label}
              </PreferenceChip>
            ))}
          </PreferenceGroup>

          <PreferenceGroup title="Generos">
            {ONBOARDING_GENRES.map(genre => (
              <PreferenceChip
                key={genre}
                active={favoriteGenres.includes(genre)}
                onClick={() => setFavoriteGenres(toggleArrayValue(favoriteGenres, genre))}
              >
                {genre}
              </PreferenceChip>
            ))}
          </PreferenceGroup>

          <PreferenceGroup title="Streamings">
            {ONBOARDING_PROVIDERS.map(provider => (
              <PreferenceChip
                key={provider}
                active={favoriteProviders.includes(provider)}
                onClick={() => setFavoriteProviders(toggleArrayValue(favoriteProviders, provider))}
              >
                {provider}
              </PreferenceChip>
            ))}
          </PreferenceGroup>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={submit}
            className="flex-1 rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-950 hover:bg-white"
          >
            Salvar preferencias
          </button>
          <button
            onClick={skipOnboarding}
            className="rounded-2xl border border-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-900"
          >
            Pular por enquanto
          </button>
        </div>
      </div>
    </div>
  );
}

function PreferenceGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function PreferenceChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-4 py-2 text-sm transition-colors',
        active
          ? 'border-zinc-100 bg-zinc-100 text-zinc-950'
          : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800'
      )}
    >
      {children}
    </button>
  );
}

function toggleArrayValue<T>(items: T[], value: T) {
  return items.includes(value) ? items.filter(item => item !== value) : [...items, value];
}
