import React from 'react';

export function Notifications() {
  return (
    <div className="max-w-md mx-auto bg-zinc-950 min-h-screen pb-20">
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 sticky top-0 z-10 px-4 py-3">
        <h1 className="text-xl font-black tracking-tight text-zinc-100">Notificações</h1>
      </header>
      <div className="p-10 text-center text-zinc-600 text-sm">
        Nenhuma notificação ainda.
      </div>
    </div>
  );
}
