import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, PlusSquare, Bell, User as UserIcon } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/explore', label: 'Explorar', icon: Compass },
  { to: '/create', label: 'Indicar', icon: PlusSquare },
  { to: '/notifications', label: 'Alertas', icon: Bell },
] as const;

export function DesktopSidebar() {
  const { currentUser, unreadNotificationsCount } = useStore();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:gap-4 lg:sticky lg:top-6 lg:self-start">
      <div className="px-2 py-3">
        <div className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">FilmOrion</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-zinc-100">Seu circulo de indicacoes.</h1>
        </div>

        <nav className="space-y-1">
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
        'flex items-center gap-3 py-2 text-sm transition-colors',
        isActive ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-100'
      )}
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'h-5 w-px rounded-full bg-transparent transition-colors',
              isActive && 'bg-zinc-100'
            )}
          />
          <div className="relative">
            <Icon size={18} className={isActive ? 'text-zinc-100' : undefined} />
            {badge > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[10px] leading-[18px] text-white font-bold text-center">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </div>
          <span className="font-semibold">{label}</span>
        </>
      )}
    </NavLink>
  );
}
