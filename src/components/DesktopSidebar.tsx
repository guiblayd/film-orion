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
  const { currentUser, unreadNotificationsCount, isGuest, isReadOnly } = useStore();
  const navItems = isReadOnly ? NAV_ITEMS.filter(item => item.to !== '/create') : NAV_ITEMS;

  return (
    <aside className="hidden lg:sticky lg:top-6 lg:flex lg:h-[calc(100vh-48px)] lg:flex-col lg:justify-between lg:self-start">
      <div>
        <Link to="/" className="mb-8 block text-[20px] font-semibold tracking-tight text-zinc-100">
          FilmOrion
        </Link>

        <nav className="space-y-1">
          {navItems.map(item => (
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

        {!isReadOnly ? (
          <Link
            to="/create"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-zinc-100 px-5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-white"
          >
            Indicar
          </Link>
        ) : null}
      </div>

      <div className="pt-5">
        <Link
          to={`/profile/${currentUser.id}`}
          className="group flex items-center gap-3 rounded-full px-2 py-2 transition-colors hover:bg-zinc-900/40"
        >
          <img src={currentUser.avatar} alt={currentUser.name} className="h-10 w-10 rounded-full object-cover ring-1 ring-zinc-800" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-100">{currentUser.name}</p>
            <p className="truncate text-xs text-zinc-500 transition-colors group-hover:text-zinc-400">
              {isGuest ? 'Somente leitura' : formatUsername(currentUser.username)}
            </p>
          </div>
          <UserIcon size={16} className="ml-auto text-zinc-700 transition-colors group-hover:text-zinc-500" />
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
        'group flex items-center gap-3 rounded-full px-2 py-2.5 text-sm transition-colors',
        isActive ? 'text-zinc-100' : 'text-zinc-500 hover:bg-zinc-900/30 hover:text-zinc-100'
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
          <span className={cn('text-[15px]', isActive ? 'font-semibold text-zinc-100' : 'font-medium text-zinc-400 group-hover:text-zinc-200')}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}
