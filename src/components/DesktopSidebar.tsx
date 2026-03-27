import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bell, Compass, Home, PlusSquare, User as UserIcon } from 'lucide-react';
import { useStore } from '../store';
import { formatUsername } from '../lib/username';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'In\u00edcio', icon: Home, end: true },
  { to: '/explore', label: 'Explorar', icon: Compass },
  { to: '/create', label: 'Indicar', icon: PlusSquare },
  { to: '/notifications', label: 'Alertas', icon: Bell },
] as const;

export function DesktopSidebar() {
  const { currentUser, unreadNotificationsCount } = useStore();

  return (
    <aside className="hidden lg:sticky lg:top-8 lg:flex lg:h-[calc(100vh-64px)] lg:flex-col lg:justify-between lg:self-start">
      <div>
        <div className="pb-8">
          <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">FilmOrion</p>
          <h1 className="mt-3 max-w-[12rem] text-[28px] font-semibold leading-[1.05] tracking-tight text-zinc-100">
            Descoberta com contexto.
          </h1>
          <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-zinc-500">
            Um desktop pensado para ler, explorar e decidir sem excesso de moldura.
          </p>
        </div>

        <Link
          to="/create"
          className="mb-8 inline-flex h-11 items-center justify-center rounded-full bg-zinc-100 px-5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-white"
        >
          Nova indica\u00e7\u00e3o
        </Link>

        <nav className="space-y-1.5">
          {NAV_ITEMS.map(item => (
            <DesktopNavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : false}
              icon={item.icon}
              label={item.label}
              badge={item.to === '/notifications' ? unreadNotificationsCount : 0}
            />
          ))}
        </nav>
      </div>

      <div className="border-t border-zinc-800/50 pt-5">
        <Link
          to={`/profile/${currentUser.id}`}
          className="group flex items-center gap-3 rounded-[22px] px-3 py-3 transition-colors hover:bg-zinc-900/50"
        >
          <img src={currentUser.avatar} alt={currentUser.name} className="h-10 w-10 rounded-full object-cover ring-1 ring-zinc-800" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-100">{currentUser.name}</p>
            <p className="truncate text-xs text-zinc-500 transition-colors group-hover:text-zinc-400">
              {formatUsername(currentUser.username)}
            </p>
          </div>
          <UserIcon size={16} className="ml-auto text-zinc-600 transition-colors group-hover:text-zinc-400" />
        </Link>
      </div>
    </aside>
  );
}

function DesktopNavLink({
  to,
  icon: Icon,
  label,
  badge = 0,
  end = false,
}: {
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  badge?: number;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => cn(
        'group flex items-center gap-3 rounded-full px-3 py-2.5 text-sm transition-colors',
        isActive ? 'bg-zinc-900/80 text-zinc-100' : 'text-zinc-500 hover:bg-zinc-900/40 hover:text-zinc-100'
      )}
    >
      {({ isActive }) => (
        <>
          <div className="relative">
            <Icon size={18} className={isActive ? 'text-zinc-100' : 'text-zinc-500 transition-colors group-hover:text-zinc-300'} />
            {badge > 0 && (
              <span className="absolute -right-2 -top-2 min-w-[18px] rounded-full bg-rose-500 px-1 text-center text-[10px] font-semibold leading-[18px] text-white">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </div>
          <span className={cn('font-medium', isActive ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-200')}>{label}</span>
        </>
      )}
    </NavLink>
  );
}
