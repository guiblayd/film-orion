import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, PlusSquare, Bell, User as UserIcon } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Início', icon: Home, end: true },
  { to: '/explore', label: 'Explorar', icon: Compass },
  { to: '/create', label: 'Indicar', icon: PlusSquare },
  { to: '/notifications', label: 'Alertas', icon: Bell },
] as const;

export function Navigation() {
  const { currentUser, unreadNotificationsCount, isReadOnly } = useStore();
  const navItems = isReadOnly ? NAV_ITEMS.filter(item => item.to !== '/create') : NAV_ITEMS;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/50 z-50 lg:hidden">
      <div className="max-w-md mx-auto h-16 px-1 flex items-stretch lg:max-w-3xl">
        {navItems.map(item => (
          <NavigationLink
            key={item.to}
            to={item.to}
            end={'end' in item ? item.end : false}
            label={item.label}
            icon={item.icon}
            badge={item.to === '/notifications' ? unreadNotificationsCount : 0}
          />
        ))}
        <NavigationLink
          to={`/profile/${currentUser.id}`}
          label="Perfil"
          icon={UserIcon}
        />
      </div>
    </nav>
  );
}

function NavigationLink({
  to,
  label,
  icon: Icon,
  badge = 0,
  end = false,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => cn(
        'flex-1 flex items-center justify-center',
        isActive ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
      )}
    >
      {({ isActive }) => (
        <div className={cn(
          'min-w-[56px] px-2 py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors',
          isActive ? 'bg-zinc-900 text-zinc-100' : 'text-inherit'
        )}>
          <div className="relative">
            <Icon size={20} />
            {badge > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[10px] leading-[18px] text-white font-bold text-center">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold leading-none">{label}</span>
        </div>
      )}
    </NavLink>
  );
}
