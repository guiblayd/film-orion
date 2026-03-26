import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, UserPlus2, Film, Wand2 } from 'lucide-react';
import { useStore } from '../store';
import { formatUsername } from '../lib/username';

export function DesktopAside() {
  const location = useLocation();
  const { currentUser, users, connections, toggleFollow, onboardingPreferences } = useStore();

  const connectionIds = useMemo(() => new Set(
    connections.map(connection => connection.requester_id === currentUser.id ? connection.receiver_id : connection.requester_id)
  ), [connections, currentUser.id]);

  const suggestedUsers = users
    .filter(user => user.id !== currentUser.id && !connectionIds.has(user.id))
    .slice(0, 3);

  return (
    <aside className="hidden xl:flex xl:flex-col xl:gap-4 xl:sticky xl:top-6 xl:self-start">
      <section className="rounded-[28px] border border-zinc-800/60 bg-zinc-900/50 p-5">
        <div className="flex items-center gap-2 text-zinc-400">
          <Sparkles size={16} />
          <span className="text-xs font-semibold uppercase tracking-[0.22em]">Resumo</span>
        </div>
        <p className="mt-3 text-lg font-bold text-zinc-100">
          {location.pathname === '/explore' ? 'Descoberta guiada pelo seu gosto.' : 'Acompanhe o que seu circulo anda indicando.'}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {onboardingPreferences
            ? `Baseado em ${onboardingPreferences.favoriteGenres.slice(0, 2).join(' e ') || 'seu gosto atual'}.`
            : 'Personalize seus gostos para destravar recomendacoes melhores e um explore mais inteligente.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(onboardingPreferences?.favoriteTypes ?? ['movie', 'series']).slice(0, 3).map(type => (
            <span key={type} className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
              {type === 'movie' ? 'Filmes' : type === 'series' ? 'Series' : 'Animes'}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-zinc-800/60 bg-zinc-900/50 p-5">
        <div className="flex items-center gap-2 text-zinc-400">
          <UserPlus2 size={16} />
          <span className="text-xs font-semibold uppercase tracking-[0.22em]">Sugestoes</span>
        </div>
        <div className="mt-4 space-y-3">
          {suggestedUsers.map(user => (
            <div key={user.id} className="flex items-center gap-3">
              <Link to={`/profile/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full object-cover ring-1 ring-zinc-700" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-100">{user.name}</p>
                  <p className="truncate text-xs text-zinc-500">{formatUsername(user.username)}</p>
                  <p className="truncate text-xs text-zinc-600">{user.bio || 'Compartilha indicacoes e listas publicas.'}</p>
                </div>
              </Link>
              <button
                onClick={() => void toggleFollow(user.id)}
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
              >
                Seguir
              </button>
            </div>
          ))}
          {suggestedUsers.length === 0 && (
            <p className="text-sm text-zinc-500">Voce ja esta seguindo os perfis em destaque por aqui.</p>
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-zinc-800/60 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-5">
        <div className="flex items-center gap-2 text-zinc-400">
          <Wand2 size={16} />
          <span className="text-xs font-semibold uppercase tracking-[0.22em]">Atalhos</span>
        </div>
        <div className="mt-4 space-y-2">
          <Link to="/create" className="flex items-center gap-3 rounded-2xl border border-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-100 hover:bg-zinc-800/60">
            <Film size={16} />
            Fazer uma nova indicacao
          </Link>
          <Link to="/explore" className="flex items-center gap-3 rounded-2xl border border-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-100 hover:bg-zinc-800/60">
            <Sparkles size={16} />
            Abrir descoberta personalizada
          </Link>
        </div>
      </section>
    </aside>
  );
}
