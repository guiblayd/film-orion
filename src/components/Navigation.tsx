import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, PlusSquare, Bell, User as UserIcon } from 'lucide-react';
import { useStore } from '../store';

export function Navigation() {
  const { currentUser } = useStore();

  const cls = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800/50 pb-safe z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-14">
        <NavLink to="/" end className={cls}><Home size={22} /></NavLink>
        <NavLink to="/explore" className={cls}><Compass size={22} /></NavLink>
        <NavLink to="/create" className={cls}><PlusSquare size={22} /></NavLink>
        <NavLink to="/notifications" className={cls}><Bell size={22} /></NavLink>
        <NavLink to={`/profile/${currentUser.id}`} className={cls}><UserIcon size={22} /></NavLink>
      </div>
    </nav>
  );
}
