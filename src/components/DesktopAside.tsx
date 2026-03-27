import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
    <aside className="hidden xl:sticky xl:top-8 xl:flex xl:flex-col xl:self-start xl:rounded-[30px] xl:border xl:border-zinc-800/70 xl:bg-zinc-950/82 xl:p-6">
      <section className="pb-6">
        <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
          {location.pathname === '/explore' ? 'Mapa' : 'Panorama'}
        </p>
        <p className="mt-4 text-[20px] font-medium leading-tight text-zinc-100">
          {location.pathname === '/explore'
            ? 'Uma curadoria aberta para navegar por catálogo e recomendações.'
            : 'Seu desktop agora funciona como leitura contínua, sem cara de celular ampliado.'}
        </p>
        <p className="mt-4 text-[14px] leading-7 text-zinc-500">
          {onboardingPreferences
            ? `Baseado em ${onboardingPreferences.favoriteGenres.slice(0, 2).join(' e ') || 'seu gosto atual'}.`
            : 'Complete seus gostos iniciais para receber sugestões mais alinhadas ao que você costuma ver.'}
        </p>
      </section>

      <section className="border-t border-zinc-800/50 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-200">Perfis para seguir</h2>
          <Link to="/explore" className="text-xs text-zinc-500 transition-colors hover:text-zinc-300">
            Ver mais
          </Link>
        </div>
        <div className="mt-5 space-y-5">
          {suggestedUsers.map(user => (
            <div key={user.id} className="flex items-start gap-3">
              <Link to={`/profile/${user.id}`} className="flex min-w-0 flex-1 items-start gap-3">
                <img src={user.avatar} alt={user.name} className="h-11 w-11 rounded-full object-cover ring-1 ring-zinc-800" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-100">{user.name}</p>
                  <p className="truncate text-xs text-zinc-500">{formatUsername(user.username)}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-600">
                    {user.bio || 'Compartilha indicações e referências do que anda assistindo.'}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => void toggleFollow(user.id)}
                className="rounded-full border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
              >
                Seguir
              </button>
            </div>
          ))}
          {suggestedUsers.length === 0 && (
            <p className="text-sm leading-relaxed text-zinc-500">Você já está seguindo os perfis em destaque por aqui.</p>
          )}
        </div>
      </section>

      <section className="border-t border-zinc-800/50 py-6">
        <h2 className="text-sm font-medium text-zinc-200">Acesso rápido</h2>
        <div className="mt-4 space-y-3 text-sm">
          <Link to="/create" className="block text-zinc-400 transition-colors hover:text-zinc-100">
            Fazer uma nova indicação
          </Link>
          <Link to="/notifications" className="block text-zinc-400 transition-colors hover:text-zinc-100">
            Revisar alertas recentes
          </Link>
          <Link to={`/profile/${currentUser.id}`} className="block text-zinc-400 transition-colors hover:text-zinc-100">
            Atualizar perfil e preferências
          </Link>
        </div>
      </section>
    </aside>
  );
}
