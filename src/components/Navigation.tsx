import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlusSquare, User as UserIcon } from 'lucide-react';
import { useStore } from '../store';

export function Navigation() {
  const { currentUser } = useStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800/50 pb-safe z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-14">
        <NavLink 
          to="/" 
          className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Home size={24} />
        </NavLink>
        
        <NavLink 
          to="/create" 
          className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <PlusSquare size={24} />
        </NavLink>
        
        <NavLink 
          to={`/profile/${currentUser.id}`} 
          className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <UserIcon size={24} />
        </NavLink>
      </div>
    </nav>
  );
}
