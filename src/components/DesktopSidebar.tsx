import React from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, Compass, Home, PlusSquare, User as UserIcon } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Início', icon: Home, end: true },
  { to: '/explore', label: 'Explorar', icon: Compass },
  { to: '/create', label: 'Indicar', icon: PlusSquare },
  { to: '/notifications', label: 'Alertas', icon: Bell },
] as const;

export function DesktopSidebar() {
  const { currentUser, unreadNotificationsCount } = useStore();

  return (
    <aside className="hidden lg:sticky lg:top-8 lg:flex lg:flex-col lg:self-start">
      <div className="pb-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">FilmOrion</p>
        <h1 className="mt-3 text-[26px] font-semibold tracking-tight text-zinc-100">Indicações com contexto, não ruído.</h1>
        <p className="mt-3 max-w-[18rem] text-sm leading-relaxed text-zinc-500">
          Navegue pelo seu círculo, descubra bons títulos e acompanhe o que realmente vale ver.
        </p>
      </div>

      <nav className="space-y-1.5 border-t border-zinc-800/50 pt-5">
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
        <DesktopNavLink to={`/profile/${currentUser.id}`} icon={UserIcon} label="Perfil" />
      </nav>
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
        'group flex items-center gap-3 rounded-2xl px-1 py-2 text-sm transition-colors',
        isActive ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-100'
      )}
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'h-8 w-[2px] rounded-full bg-transparent transition-colors',
              isActive && 'bg-zinc-300'
            )}
          />
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
