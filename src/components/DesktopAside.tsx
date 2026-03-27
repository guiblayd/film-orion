import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { formatUsername } from '../lib/username';

function getContextCopy(pathname: string) {
  if (pathname === '/explore') {
    return {
      eyebrow: 'Curadoria',
      title: 'Navega\u00e7\u00e3o ampla, ritmo leve.',
      description: 'No desktop, explorar funciona melhor como biblioteca aberta: poucos adornos, mais respira\u00e7\u00e3o e foco em p\u00f4ster, t\u00edtulo e contexto social.',
    };
  }

  if (pathname === '/notifications') {
    return {
      eyebrow: 'Fluxo',
      title: 'Tudo em uma leitura s\u00f3.',
      description: 'Alertas precisam parecer conversa e hist\u00f3rico, n\u00e3o dashboard com caixas. O desktop deve deixar a atividade leg\u00edvel e previs\u00edvel.',
    };
  }

  if (pathname.startsWith('/profile/')) {
    return {
      eyebrow: 'Perfil',
      title: 'Presen\u00e7a, hist\u00f3rico e rela\u00e7\u00f5es.',
      description: 'O perfil precisa comunicar pessoa, gosto e atividade sem parecer um bloco lateral separado do restante da experi\u00eancia.',
    };
  }

  return {
    eyebrow: 'Panorama',
    title: 'Seu c\u00edrculo, sem ru\u00eddo visual.',
    description: 'O desktop deve se comportar como uma superf\u00edcie cont\u00ednua de leitura, com navega\u00e7\u00e3o fixa e contexto aparecendo s\u00f3 quando realmente ajuda.',
  };
}

export function DesktopAside() {
  const location = useLocation();
  const { currentUser, users, connections, toggleFollow } = useStore();

  const connectionIds = useMemo(() => new Set(
    connections.map(connection => connection.requester_id === currentUser.id ? connection.receiver_id : connection.requester_id)
  ), [connections, currentUser.id]);

  const suggestedUsers = users
    .filter(user => user.id !== currentUser.id && !connectionIds.has(user.id))
    .slice(0, 3);

  const copy = getContextCopy(location.pathname);

  return (
    <aside className="hidden xl:flex xl:flex-col xl:gap-8 xl:pt-3">
      <section>
        <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{copy.eyebrow}</p>
        <p className="mt-4 text-[22px] font-medium leading-tight text-zinc-100">{copy.title}</p>
        <p className="mt-4 text-[14px] leading-7 text-zinc-500">
          {copy.description}
        </p>
        <p className="mt-4 text-sm leading-7 text-zinc-600">
          As sugestoes aparecem conforme a atividade e as conexoes do seu circulo.
        </p>
      </section>

      <section className="border-t border-zinc-800/50 pt-6">
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
                    {user.bio || 'Compartilha indica\u00e7\u00f5es e refer\u00eancias do que anda assistindo.'}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => void toggleFollow(user.id)}
                className="rounded-full border border-zinc-800/70 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
              >
                Seguir
              </button>
            </div>
          ))}
          {suggestedUsers.length === 0 && (
            <p className="text-sm leading-relaxed text-zinc-500">Voc\u00ea j\u00e1 est\u00e1 seguindo os perfis em destaque por aqui.</p>
          )}
        </div>
      </section>

      <section className="border-t border-zinc-800/50 pt-6">
        <h2 className="text-sm font-medium text-zinc-200">Atalhos</h2>
        <div className="mt-4 space-y-3 text-sm">
          <Link to="/create" className="block text-zinc-400 transition-colors hover:text-zinc-100">
            Fazer uma nova indica\u00e7\u00e3o
          </Link>
          <Link to="/notifications" className="block text-zinc-400 transition-colors hover:text-zinc-100">
            Revisar alertas recentes
          </Link>
          <Link to={`/profile/${currentUser.id}`} className="block text-zinc-400 transition-colors hover:text-zinc-100">
            Atualizar perfil e prefer\u00eancias
          </Link>
        </div>
      </section>
    </aside>
  );
}
