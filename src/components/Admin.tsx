import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BarChart3, Bell, Loader2, MessageSquare,
  Search, Shield, Trash2, Send, Users, Film, Link2,
  ChevronRight, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { getRelativeTime } from '../lib/utils';
import { cn } from '../lib/utils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

// ── Types ──────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'users' | 'recommendations' | 'comments' | 'notifications';

type Stats = {
  totalUsers: number;
  totalRecommendations: number;
  totalComments: number;
  totalConnections: number;
  newUsersWeek: number;
  newRecsWeek: number;
  newCommentsWeek: number;
};

type AdminUser = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  is_admin: boolean;
  created_at: string;
  email?: string | null;
};

type AdminRec = {
  id: string;
  from_name: string;
  to_name: string;
  item_title: string;
  visibility: string;
  has_spoiler: boolean;
  created_at: string;
};

type AdminComment = {
  id: string;
  user_name: string;
  user_avatar: string;
  content: string;
  recommendation_id: string;
  created_at: string;
};

type DeleteTarget = {
  type: 'user' | 'recommendation' | 'comment';
  id: string;
  label: string;
};

// ── Edge Function helper ───────────────────────────────────────────────────

async function callAdminAction(action: string, payload?: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const result = await res.json() as Record<string, unknown>;
  if (!res.ok) throw new Error((result.error as string) ?? 'Erro na ação');
  return result;
}

// ── Main component ─────────────────────────────────────────────────────────

export function Admin() {
  const navigate = useNavigate();
  const { currentUser, users: storeUsers } = useStore();

  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const [recs, setRecs] = useState<AdminRec[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);

  const [comments, setComments] = useState<AdminComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [notifRecipient, setNotifRecipient] = useState<'all' | string>('all');
  const [notifMessage, setNotifMessage] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (!currentUser.is_admin) return <Navigate to="/" replace />;

  // ── Loaders ──────────────────────────────────────────────────────────────

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalUsers },
      { count: totalRecommendations },
      { count: totalComments },
      { count: totalConnections },
      { count: newUsersWeek },
      { count: newRecsWeek },
      { count: newCommentsWeek },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('recommendations').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('connections').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('recommendations').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    ]);

    setStats({
      totalUsers: totalUsers ?? 0,
      totalRecommendations: totalRecommendations ?? 0,
      totalComments: totalComments ?? 0,
      totalConnections: totalConnections ?? 0,
      newUsersWeek: newUsersWeek ?? 0,
      newRecsWeek: newRecsWeek ?? 0,
      newCommentsWeek: newCommentsWeek ?? 0,
    });
    setStatsLoading(false);
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, username, avatar, is_admin, created_at')
      .order('created_at', { ascending: false });

    // Get emails from edge function
    let emailMap: Record<string, string | null> = {};
    try {
      const result = await callAdminAction('list_users') as { users: { id: string; email: string | null }[] };
      emailMap = Object.fromEntries(result.users.map(u => [u.id, u.email]));
    } catch {
      // emails not critical
    }

    setAdminUsers(
      (profiles ?? []).map(p => ({
        id: p.id,
        name: p.name,
        username: p.username,
        avatar: p.avatar ?? '',
        is_admin: p.is_admin ?? false,
        created_at: p.created_at,
        email: emailMap[p.id] ?? null,
      }))
    );
    setUsersLoading(false);
  }, []);

  const loadRecs = useCallback(async () => {
    setRecsLoading(true);
    const { data } = await supabase
      .from('recommendations')
      .select(`
        id, visibility, has_spoiler, created_at,
        from_profile:profiles!recommendations_from_user_id_fkey(name),
        to_profile:profiles!recommendations_to_user_id_fkey(name),
        item:items(title)
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    setRecs(
      (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        visibility: r.visibility as string,
        has_spoiler: Boolean(r.has_spoiler),
        created_at: r.created_at as string,
        from_name: (r.from_profile as { name: string } | null)?.name ?? '?',
        to_name: (r.to_profile as { name: string } | null)?.name ?? '?',
        item_title: (r.item as { title: string } | null)?.title ?? '?',
      }))
    );
    setRecsLoading(false);
  }, []);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    const { data } = await supabase
      .from('comments')
      .select(`
        id, content, recommendation_id, created_at,
        user:profiles!comments_user_id_fkey(name, avatar)
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    setComments(
      (data ?? []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        content: c.content as string,
        recommendation_id: c.recommendation_id as string,
        created_at: c.created_at as string,
        user_name: (c.user as { name: string } | null)?.name ?? '?',
        user_avatar: (c.user as { avatar: string } | null)?.avatar ?? '',
      }))
    );
    setCommentsLoading(false);
  }, []);

  useEffect(() => {
    if (tab === 'overview') void loadStats();
    if (tab === 'users') void loadUsers();
    if (tab === 'recommendations') void loadRecs();
    if (tab === 'comments') void loadComments();
  }, [tab, loadStats, loadUsers, loadRecs, loadComments]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const confirmDelete = (target: DeleteTarget) => setDeleteTarget(target);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'user') {
        await callAdminAction('delete_user', { userId: deleteTarget.id });
        setAdminUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      } else if (deleteTarget.type === 'recommendation') {
        await supabase.from('recommendations').delete().eq('id', deleteTarget.id);
        setRecs(prev => prev.filter(r => r.id !== deleteTarget.id));
      } else if (deleteTarget.type === 'comment') {
        await supabase.from('comments').delete().eq('id', deleteTarget.id);
        setComments(prev => prev.filter(c => c.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notifMessage.trim()) return;
    setSendingNotif(true);
    setNotifSuccess(false);

    try {
      const recipients = notifRecipient === 'all'
        ? storeUsers.filter(u => u.id !== currentUser.id)
        : storeUsers.filter(u => u.id === notifRecipient);

      const rows = recipients.map(u => ({
        recipient_id: u.id,
        actor_id: currentUser.id,
        type: 'admin_message' as const,
        metadata: { message: notifMessage.trim() },
      }));

      if (rows.length > 0) {
        await supabase.from('notifications').insert(rows);
      }

      setNotifMessage('');
      setNotifSuccess(true);
      setTimeout(() => setNotifSuccess(false), 3000);
    } finally {
      setSendingNotif(false);
    }
  };

  // ── Filtered data ─────────────────────────────────────────────────────────

  const filteredUsers = adminUsers.filter(u =>
    !userSearch.trim() ||
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email ?? '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Visão geral', icon: BarChart3 },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'recommendations', label: 'Indicações', icon: Film },
    { id: 'comments', label: 'Comentários', icon: MessageSquare },
    { id: 'notifications', label: 'Notificações', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('/')} className="p-1 text-zinc-400 hover:text-zinc-100">
            <ArrowLeft size={20} />
          </button>
          <Shield size={18} className="text-amber-400" />
          <h1 className="text-sm font-semibold text-zinc-100 lg:text-base">Painel Admin</h1>
          <span className="ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
            superadmin
          </span>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-6xl overflow-x-auto px-4">
          <div className="flex gap-0.5 pb-0">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors',
                  tab === t.id
                    ? 'border-zinc-100 text-zinc-100'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                )}
              >
                <t.icon size={13} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-400">Dados gerais</h2>
              <button onClick={() => void loadStats()} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300">
                <RefreshCw size={12} /> Atualizar
              </button>
            </div>

            {statsLoading ? (
              <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-zinc-600" /></div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatCard icon={Users} label="Usuários" total={stats.totalUsers} week={stats.newUsersWeek} color="text-sky-400" />
                  <StatCard icon={Film} label="Indicações" total={stats.totalRecommendations} week={stats.newRecsWeek} color="text-violet-400" />
                  <StatCard icon={MessageSquare} label="Comentários" total={stats.totalComments} week={stats.newCommentsWeek} color="text-emerald-400" />
                  <StatCard icon={Link2} label="Conexões" total={stats.totalConnections} color="text-amber-400" />
                </div>

                <div className="mt-6 grid gap-3 lg:grid-cols-3">
                  <QuickStat label="Média de indicações por usuário" value={
                    stats.totalUsers > 0 ? (stats.totalRecommendations / stats.totalUsers).toFixed(1) : '0'
                  } />
                  <QuickStat label="Média de comentários por indicação" value={
                    stats.totalRecommendations > 0 ? (stats.totalComments / stats.totalRecommendations).toFixed(1) : '0'
                  } />
                  <QuickStat label="Usuários sem indicação esta semana" value={
                    String(Math.max(0, stats.totalUsers - stats.newUsersWeek))
                  } />
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ── Users ────────────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Buscar por nome, @usuario ou email..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-9 pr-4 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-700"
                />
              </div>
              <button onClick={() => void loadUsers()} className="p-2 text-zinc-500 hover:text-zinc-300">
                <RefreshCw size={15} />
              </button>
            </div>

            {usersLoading ? (
              <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-zinc-600" /></div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-zinc-800/60">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800/60 text-left">
                      <th className="px-4 py-3 text-xs font-medium text-zinc-500">Usuário</th>
                      <th className="hidden px-4 py-3 text-xs font-medium text-zinc-500 lg:table-cell">Email</th>
                      <th className="hidden px-4 py-3 text-xs font-medium text-zinc-500 lg:table-cell">Membro</th>
                      <th className="px-4 py-3 text-xs font-medium text-zinc-500"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="transition-colors hover:bg-zinc-900/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <img src={user.avatar} alt={user.name} className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-zinc-800" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate text-sm font-medium text-zinc-100">{user.name}</span>
                                {user.is_admin && (
                                  <Shield size={11} className="shrink-0 text-amber-400" />
                                )}
                              </div>
                              <span className="text-xs text-zinc-500">@{user.username}</span>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 text-xs text-zinc-400 lg:table-cell">
                          {user.email ?? <span className="text-zinc-600">—</span>}
                        </td>
                        <td className="hidden px-4 py-3 text-xs text-zinc-500 lg:table-cell">
                          {getRelativeTime(user.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/profile/${user.id}`}
                              className="p-1.5 text-zinc-600 transition-colors hover:text-zinc-300"
                            >
                              <ChevronRight size={15} />
                            </Link>
                            {!user.is_admin && (
                              <button
                                onClick={() => confirmDelete({ type: 'user', id: user.id, label: user.name })}
                                className="p-1.5 text-zinc-600 transition-colors hover:text-rose-400"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan={4} className="py-10 text-center text-sm text-zinc-600">Nenhum usuário encontrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Recommendations ──────────────────────────────────────────────── */}
        {tab === 'recommendations' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-zinc-500">{recs.length} indicações</p>
              <button onClick={() => void loadRecs()} className="p-1.5 text-zinc-500 hover:text-zinc-300">
                <RefreshCw size={14} />
              </button>
            </div>

            {recsLoading ? (
              <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-zinc-600" /></div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-zinc-800/60">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800/60 text-left">
                      <th className="px-4 py-3 text-xs font-medium text-zinc-500">De → Para</th>
                      <th className="hidden px-4 py-3 text-xs font-medium text-zinc-500 lg:table-cell">Título</th>
                      <th className="hidden px-4 py-3 text-xs font-medium text-zinc-500 lg:table-cell">Vis.</th>
                      <th className="px-4 py-3 text-xs font-medium text-zinc-500">Data</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {recs.map(rec => (
                      <tr key={rec.id} className="transition-colors hover:bg-zinc-900/40">
                        <td className="px-4 py-3">
                          <span className="text-zinc-200">{rec.from_name}</span>
                          <span className="mx-1 text-zinc-600">→</span>
                          <span className="text-zinc-200">{rec.to_name}</span>
                          <span className="mt-0.5 block text-xs text-zinc-500 lg:hidden">{rec.item_title}</span>
                        </td>
                        <td className="hidden px-4 py-3 text-zinc-400 lg:table-cell">
                          <span className="line-clamp-1">{rec.item_title}</span>
                          {rec.has_spoiler && (
                            <span className="mt-0.5 block text-[10px] text-amber-500">spoiler</span>
                          )}
                        </td>
                        <td className="hidden px-4 py-3 text-xs text-zinc-500 lg:table-cell">
                          {rec.visibility === 'public' ? 'Público' : rec.visibility === 'connections' ? 'Círculo' : 'Privado'}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500">{getRelativeTime(rec.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/recommendation/${rec.id}`}
                              className="p-1.5 text-zinc-600 transition-colors hover:text-zinc-300"
                            >
                              <ChevronRight size={15} />
                            </Link>
                            <button
                              onClick={() => confirmDelete({ type: 'recommendation', id: rec.id, label: `${rec.from_name} → ${rec.to_name}` })}
                              className="p-1.5 text-zinc-600 transition-colors hover:text-rose-400"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {recs.length === 0 && (
                      <tr><td colSpan={5} className="py-10 text-center text-sm text-zinc-600">Nenhuma indicação.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Comments ─────────────────────────────────────────────────────── */}
        {tab === 'comments' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-zinc-500">{comments.length} comentários</p>
              <button onClick={() => void loadComments()} className="p-1.5 text-zinc-500 hover:text-zinc-300">
                <RefreshCw size={14} />
              </button>
            </div>

            {commentsLoading ? (
              <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-zinc-600" /></div>
            ) : (
              <div className="space-y-2">
                {comments.map(comment => (
                  <div key={comment.id} className="flex items-start gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/30 px-4 py-3">
                    <img src={comment.user_avatar} alt={comment.user_name} className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-zinc-800" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-200">{comment.user_name}</span>
                        <span className="text-[11px] text-zinc-600">{getRelativeTime(comment.created_at)}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-zinc-400">{comment.content}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Link
                        to={`/recommendation/${comment.recommendation_id}`}
                        className="p-1.5 text-zinc-600 transition-colors hover:text-zinc-300"
                      >
                        <ChevronRight size={15} />
                      </Link>
                      <button
                        onClick={() => confirmDelete({ type: 'comment', id: comment.id, label: comment.content.slice(0, 40) })}
                        className="p-1.5 text-zinc-600 transition-colors hover:text-rose-400"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="py-10 text-center text-sm text-zinc-600">Nenhum comentário.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Notifications ────────────────────────────────────────────────── */}
        {tab === 'notifications' && (
          <div className="mx-auto max-w-lg">
            <h2 className="mb-6 text-sm font-medium text-zinc-400">Enviar notificação para usuários</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">Destinatário</label>
                <select
                  value={notifRecipient}
                  onChange={e => setNotifRecipient(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-700"
                >
                  <option value="all">Todos os usuários ({storeUsers.filter(u => u.id !== currentUser.id).length})</option>
                  {storeUsers
                    .filter(u => u.id !== currentUser.id)
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">Mensagem</label>
                <textarea
                  value={notifMessage}
                  onChange={e => setNotifMessage(e.target.value)}
                  placeholder="Escreva a mensagem para os usuários..."
                  maxLength={280}
                  className="h-32 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-700"
                />
                <p className="mt-1 text-right text-xs text-zinc-600">{notifMessage.length}/280</p>
              </div>

              <button
                onClick={() => void handleSendNotification()}
                disabled={!notifMessage.trim() || sendingNotif}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                {sendingNotif ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Enviar notificação
              </button>

              {notifSuccess && (
                <p className="text-center text-sm text-emerald-400">Notificação enviada com sucesso!</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Delete confirmation modal ─────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl">
            <div className="mb-3 flex items-center gap-2 text-rose-400">
              <AlertTriangle size={17} />
              <h2 className="text-base font-bold">Confirmar exclusão</h2>
            </div>
            <p className="mb-1 text-sm text-zinc-400">
              {deleteTarget.type === 'user' && 'Excluir usuário permanentemente:'}
              {deleteTarget.type === 'recommendation' && 'Excluir indicação:'}
              {deleteTarget.type === 'comment' && 'Excluir comentário:'}
            </p>
            <p className="mb-6 truncate text-sm font-medium text-zinc-200">"{deleteTarget.label}"</p>
            <p className="mb-5 text-xs leading-relaxed text-zinc-500">
              Esta ação não pode ser desfeita.
              {deleteTarget.type === 'user' && ' A conta, indicações e dados do usuário serão removidos.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border border-zinc-700 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white hover:bg-rose-400 disabled:opacity-60"
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  total,
  week,
  color,
}: {
  icon: React.ElementType;
  label: string;
  total: number;
  week?: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4">
      <div className={cn('mb-3', color)}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-semibold tracking-tight text-zinc-100">{total.toLocaleString('pt-BR')}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
      {week !== undefined && (
        <p className="mt-2 text-[11px] text-zinc-600">
          +{week} esta semana
        </p>
      )}
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/20 px-4 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-zinc-100">{value}</p>
    </div>
  );
}
