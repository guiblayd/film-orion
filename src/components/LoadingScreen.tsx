export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 border-2 border-zinc-700 border-t-zinc-100 rounded-full animate-spin" />
        <p className="text-zinc-600 text-xs">Carregando...</p>
      </div>
    </div>
  );
}
