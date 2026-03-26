import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, MessageSquare, UserPlus } from 'lucide-react';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import { AppNotification, Item, User } from '../types';
import { formatUsername } from '../lib/username';
import { Database } from '../types/database';

type NotificationRow = AppNotification & {
  item: Item | null;
};

function formatNotificationDateTime(dateStr: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export function Notifications() {
  const { users, refreshUnreadNotificationsCount } = useStore();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (users.length === 0) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('notifications:', error.message);
        if (!cancelled) setLoading(false);
        return;
      }

      const itemIds = [...new Set((data ?? []).map(notification => notification.item_id).filter(Boolean))] as string[];
      const { data: items } = itemIds.length > 0
        ? await supabase.from('items').select('*').in('id', itemIds)
        : { data: [] as Item[] };

      const itemsById = new Map((items ?? []).map(item => {
        const nextItem = toItem(item);
        return [nextItem.id, nextItem] as const;
      }));
      const nextNotifications = (data ?? []).map(notification => {
        const nextNotification = toNotification(notification);
        return {
          ...nextNotification,
          item: nextNotification.item_id ? itemsById.get(nextNotification.item_id) ?? null : null,
        };
      });

      if (!cancelled) {
        setNotifications(nextNotifications);
        setLoading(false);
      }

      const unreadIds = nextNotifications.filter(notification => !notification.read_at).map(notification => notification.id);
      if (unreadIds.length > 0) {
        const readAt = new Date().toISOString();
        await supabase
          .from('notifications')
          .update({ read_at: readAt })
          .in('id', unreadIds);

        if (!cancelled) {
          setNotifications(prev => prev.map(notification => unreadIds.includes(notification.id) ? { ...notification, read_at: readAt } : notification));
        }

        await refreshUnreadNotificationsCount();
      } else {
        await refreshUnreadNotificationsCount();
      }
    };

    load();
    return () => { cancelled = true; };
  }, [users, refreshUnreadNotificationsCount]);

  return (
    <div className="max-w-md mx-auto bg-zinc-950 min-h-screen pb-20 lg:max-w-3xl lg:px-6">
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 px-4 py-3 sticky top-0 z-10 lg:max-w-3xl lg:mx-auto lg:rounded-b-2xl">
        <h1 className="text-xl font-black tracking-tight text-zinc-100">Notificações</h1>
      </header>

      <div className="lg:max-w-3xl lg:mx-auto lg:mt-4 lg:rounded-2xl lg:border lg:border-zinc-800/50 lg:overflow-hidden">
        {loading && (
          <div className="p-10 text-center text-zinc-600 text-sm">
            Carregando notificações...
          </div>
        )}

        {!loading && notifications.map(notification => (
          <NotificationCard key={notification.id} notification={notification} users={users} />
        ))}

        {!loading && notifications.length === 0 && (
          <div className="p-10 text-center text-zinc-600 text-sm">
            Nenhuma notificação ainda.
          </div>
        )}
      </div>
    </div>
  );
}

function toItem(item: Database['public']['Tables']['items']['Row']): Item {
  return {
    id: item.id,
    title: item.title,
    image: item.image ?? '',
    type: item.type as Item['type'],
    year: item.year ?? undefined,
  };
}

function toNotification(notification: Database['public']['Tables']['notifications']['Row']): AppNotification {
  return {
    id: notification.id,
    recipient_id: notification.recipient_id,
    actor_id: notification.actor_id,
    type: notification.type as AppNotification['type'],
    recommendation_id: notification.recommendation_id ?? undefined,
    comment_id: notification.comment_id ?? undefined,
    connection_id: notification.connection_id ?? undefined,
    item_id: notification.item_id ?? undefined,
    metadata: (notification.metadata as AppNotification['metadata']) ?? undefined,
    read_at: notification.read_at ?? undefined,
    created_at: notification.created_at,
  };
}

function NotificationCard({ notification, users }: { notification: NotificationRow; users: User[] }) {
  const actor = users.find(user => user.id === notification.actor_id);
  if (!actor) return null;

  const config = getNotificationConfig(notification);

  return (
    <Link
      to={config.href}
      className="flex items-start gap-3 px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors"
    >
      <div className="relative shrink-0">
        <img src={actor.avatar} alt={actor.name} className="w-10 h-10 rounded-full object-cover ring-1 ring-zinc-800" />
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <config.icon size={11} className={config.iconClassName} />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3 mb-1">
          <p className="text-xs text-zinc-500">{formatUsername(actor.username)}</p>
          <div className="flex items-center gap-2 shrink-0">
            <p className="text-[11px] text-zinc-600 text-right">{formatNotificationDateTime(notification.created_at)}</p>
            {!notification.read_at && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            )}
          </div>
        </div>
        <p className="text-sm text-zinc-300 leading-relaxed">
          <span className="font-bold text-zinc-100">{actor.name}</span> {config.message}
        </p>
      </div>
    </Link>
  );
}

function getNotificationConfig(notification: NotificationRow) {
  switch (notification.type) {
    case 'recommendation_received':
      return {
        href: notification.recommendation_id ? `/recommendation/${notification.recommendation_id}` : '/notifications',
        icon: Bell,
        iconClassName: 'text-zinc-300',
        message: notification.item ? `te indicou ${notification.item.title}.` : 'te enviou uma nova indicação.',
      };
    case 'comment_added':
      return {
        href: notification.recommendation_id ? `/recommendation/${notification.recommendation_id}` : '/notifications',
        icon: MessageSquare,
        iconClassName: 'text-sky-400',
        message: notification.item ? `comentou na indicação de ${notification.item.title}.` : 'comentou em uma indicação.',
      };
    case 'connection_created':
      return {
        href: `/profile/${notification.actor_id}`,
        icon: UserPlus,
        iconClassName: 'text-emerald-400',
        message: 'começou a te seguir.',
      };
    case 'recommendation_status_changed': {
      const status = notification.metadata?.status;
      const action = status === 'watched' ? 'marcou como assistido' : 'salvou';
      return {
        href: notification.recommendation_id ? `/recommendation/${notification.recommendation_id}` : '/notifications',
        icon: Check,
        iconClassName: 'text-amber-400',
        message: notification.item ? `${action} ${notification.item.title}.` : 'atualizou o status de uma indicação sua.',
      };
    }
    default:
      return {
        href: '/notifications',
        icon: Bell,
        iconClassName: 'text-zinc-300',
        message: 'gerou uma nova atividade.',
      };
  }
}
