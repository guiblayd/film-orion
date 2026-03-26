import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Item, Recommendation, RecommendationInteraction, Comment, UserItemStatus, Connection, OnboardingPreferences } from './types';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import { Database } from './types/database';
import { dismissOnboarding, isOnboardingDismissed, loadOnboardingPreferences, saveOnboardingPreferences } from './lib/onboarding';

type StoreContextType = {
  dataLoading: boolean;
  currentUser: User;
  users: User[];
  connections: Connection[];
  userItemStatuses: UserItemStatus[];
  unreadNotificationsCount: number;
  onboardingPreferences: OnboardingPreferences | null;
  onboardingDismissed: boolean;
  refreshUnreadNotificationsCount: () => Promise<void>;
  saveOnboarding: (preferences: Omit<OnboardingPreferences, 'completed_at'>) => void;
  skipOnboarding: () => void;
  addRecommendation: (rec: Omit<Recommendation, 'id' | 'created_at'>) => Promise<Recommendation | null>;
  deleteRecommendation: (id: string) => Promise<void>;
  editRecommendation: (
    id: string,
    updates: Pick<Recommendation, 'message' | 'discussion_enabled' | 'visibility'>
  ) => Promise<Recommendation | null>;
  toggleInteraction: (recommendationId: string, type: 'support' | 'oppose') => Promise<RecommendationInteraction | null>;
  addComment: (recommendationId: string, content: string) => Promise<Comment | null>;
  updateUserItemStatus: (itemId: string, status: 'saved' | 'watched' | 'ignored') => Promise<UserItemStatus | null>;
  toggleFollow: (userId: string) => Promise<void>;
  addItem: (item: Item) => Promise<void>;
  updateCurrentUser: (updates: Partial<Pick<User, 'name' | 'bio' | 'avatar' | 'username'>>) => Promise<string | null>;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const EMPTY_USER: User = { id: '', name: '', username: '', avatar: '' };

export function StoreProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User>(EMPTY_USER);
  const [users, setUsers] = useState<User[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [userItemStatuses, setUserItemStatuses] = useState<UserItemStatus[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [onboardingPreferences, setOnboardingPreferences] = useState<OnboardingPreferences | null>(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  const refreshUnreadNotificationsCount = useCallback(async () => {
    const uid = session?.user?.id;
    if (!uid) {
      setUnreadNotificationsCount(0);
      return;
    }

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', uid)
      .is('read_at', null);

    setUnreadNotificationsCount(count ?? 0);
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user) {
      setCurrentUser(EMPTY_USER);
      setUsers([]);
      setConnections([]);
      setUserItemStatuses([]);
      setUnreadNotificationsCount(0);
      setOnboardingPreferences(null);
      setOnboardingDismissed(false);
      setDataLoading(false);
      return;
    }

    const loadInitial = async () => {
      setDataLoading(true);
      try {
        const uid = session.user.id;
        const [
          { data: profile },
          { data: profiles },
          { data: statuses },
          { data: conns },
        ] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', uid).single(),
          supabase.from('profiles').select('*'),
          supabase.from('user_item_statuses').select('*').eq('user_id', uid),
          supabase
            .from('connections')
            .select('*')
            .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`),
        ]);

        if (profile) setCurrentUser(toUser(profile));
        if (profiles) setUsers(profiles.map(toUser));
        if (statuses) setUserItemStatuses(statuses.map(toUserItemStatus));
        if (conns) setConnections(conns.map(toConnection));
        setOnboardingPreferences(loadOnboardingPreferences(uid));
        setOnboardingDismissed(isOnboardingDismissed(uid));

        await refreshUnreadNotificationsCount();
      } finally {
        setDataLoading(false);
      }
    };

    loadInitial();
  }, [session?.user?.id, refreshUnreadNotificationsCount]);

  const addRecommendation = async (rec: Omit<Recommendation, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('recommendations')
      .insert({
        from_user_id: rec.from_user_id,
        to_user_id: rec.to_user_id,
        item_id: rec.item_id,
        message: rec.message ?? null,
        discussion_enabled: rec.discussion_enabled,
        visibility: rec.visibility,
      })
      .select()
      .single();

    if (error) {
      console.error('addRecommendation:', error.message);
      return null;
    }

    return data ? toRecommendation(data) : null;
  };

  const saveOnboarding = (preferences: Omit<OnboardingPreferences, 'completed_at'>) => {
    if (!currentUser.id) return;
    const saved = saveOnboardingPreferences(currentUser.id, preferences);
    if (saved) {
      setOnboardingPreferences(saved);
      setOnboardingDismissed(false);
    }
  };

  const skipOnboarding = () => {
    if (!currentUser.id) return;
    dismissOnboarding(currentUser.id);
    setOnboardingDismissed(true);
  };

  const deleteRecommendation = async (id: string) => {
    const { error } = await supabase.from('recommendations').delete().eq('id', id);
    if (error) console.error('deleteRecommendation:', error.message);
  };

  const editRecommendation = async (
    id: string,
    updates: Pick<Recommendation, 'message' | 'discussion_enabled' | 'visibility'>
  ) => {
    const { data, error } = await supabase
      .from('recommendations')
      .update({
        message: updates.message ?? null,
        discussion_enabled: updates.discussion_enabled,
        visibility: updates.visibility,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('editRecommendation:', error.message);
      return null;
    }

    return data ? toRecommendation(data) : null;
  };

  const toggleInteraction = async (recommendationId: string, type: 'support' | 'oppose') => {
    const { data: existing } = await supabase
      .from('recommendation_interactions')
      .select('*')
      .eq('recommendation_id', recommendationId)
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (existing) {
      if (existing.type === type) {
        const { error } = await supabase.from('recommendation_interactions').delete().eq('id', existing.id);
        if (error) console.error('toggleInteraction delete:', error.message);
        return null;
      }

      const { data, error } = await supabase
        .from('recommendation_interactions')
        .update({ type })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('toggleInteraction update:', error.message);
        return null;
      }

      return data ? toInteraction(data) : null;
    }

    const { data, error } = await supabase
      .from('recommendation_interactions')
      .insert({
        recommendation_id: recommendationId,
        user_id: currentUser.id,
        type,
      })
      .select()
      .single();

    if (error) {
      console.error('toggleInteraction insert:', error.message);
      return null;
    }

    return data ? toInteraction(data) : null;
  };

  const addComment = async (recommendationId: string, content: string) => {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        recommendation_id: recommendationId,
        user_id: currentUser.id,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('addComment:', error.message);
      return null;
    }

    return data ? toComment(data) : null;
  };

  const updateUserItemStatus = async (itemId: string, status: 'saved' | 'watched' | 'ignored') => {
    const previousStatuses = userItemStatuses;
    const existing = userItemStatuses.find(itemStatus => itemStatus.item_id === itemId && itemStatus.user_id === currentUser.id);

    if (existing) {
      if (existing.status === status) {
        setUserItemStatuses(prev => prev.filter(itemStatus => itemStatus.id !== existing.id));
        const { error } = await supabase.from('user_item_statuses').delete().eq('id', existing.id);
        if (error) {
          console.error('updateUserItemStatus delete:', error.message);
          setUserItemStatuses(previousStatuses);
          return existing;
        }
        return null;
      }

      const optimistic = { ...existing, status };
      setUserItemStatuses(prev => prev.map(itemStatus => itemStatus.id === existing.id ? optimistic : itemStatus));

      const { data, error } = await supabase
        .from('user_item_statuses')
        .update({ status })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('updateUserItemStatus update:', error.message);
        setUserItemStatuses(previousStatuses);
        return existing;
      }

      if (data) {
        const nextStatus = toUserItemStatus(data);
        setUserItemStatuses(prev => prev.map(itemStatus => itemStatus.id === nextStatus.id ? nextStatus : itemStatus));
        return nextStatus;
      }

      return optimistic;
    }

    const tempId = `uis${Date.now()}`;
    const optimistic: UserItemStatus = { id: tempId, user_id: currentUser.id, item_id: itemId, status };
    setUserItemStatuses(prev => [...prev, optimistic]);

    const { data, error } = await supabase
      .from('user_item_statuses')
      .insert({
        user_id: currentUser.id,
        item_id: itemId,
        status,
      })
      .select()
      .single();

    if (error) {
      console.error('updateUserItemStatus insert:', error.message);
      setUserItemStatuses(previousStatuses);
      return null;
    }

    if (data) {
      const nextStatus = toUserItemStatus(data);
      setUserItemStatuses(prev => prev.map(itemStatus => itemStatus.id === tempId ? nextStatus : itemStatus));
      return nextStatus;
    }

    return optimistic;
  };

  const toggleFollow = async (userId: string) => {
    const previousConnections = connections;
    const existing = connections.find(connection => connection.requester_id === currentUser.id && connection.receiver_id === userId);

    if (existing) {
      setConnections(prev => prev.filter(connection => connection.id !== existing.id));
      const { error } = await supabase.from('connections').delete().eq('id', existing.id);
      if (error) {
        console.error('toggleFollow delete:', error.message);
        setConnections(previousConnections);
      }
      return;
    }

    const tempId = `connection${Date.now()}`;
    const optimistic: Connection = {
      id: tempId,
      requester_id: currentUser.id,
      receiver_id: userId,
      status: 'accepted',
    };

    setConnections(prev => [...prev, optimistic]);

    const { data, error } = await supabase
      .from('connections')
      .insert({
        requester_id: currentUser.id,
        receiver_id: userId,
        status: 'accepted',
      })
      .select()
      .single();

    if (error) {
      console.error('toggleFollow insert:', error.message);
      setConnections(previousConnections);
      return;
    }

    if (data) {
      const nextConnection = toConnection(data);
      setConnections(prev => prev.map(connection => connection.id === tempId ? nextConnection : connection));
    }
  };

  const addItem = async (item: Item) => {
    const { error } = await supabase.from('items').upsert({
      id: item.id,
      title: item.title,
      image: item.image,
      type: item.type,
      year: item.year ?? null,
    });

    if (error) console.error('addItem:', error.message);
  };

  const updateCurrentUser = async (updates: Partial<Pick<User, 'name' | 'bio' | 'avatar' | 'username'>>) => {
    const previousCurrentUser = currentUser;
    const previousUsers = users;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    setUsers(prev => prev.map(user => user.id === currentUser.id ? updated : user));

    const dbPayload: Record<string, string | null> = {};
    if (updates.name !== undefined) dbPayload.name = updates.name;
    if (updates.avatar !== undefined) dbPayload.avatar = updates.avatar;
    if (updates.username !== undefined) dbPayload.username = updates.username;
    if ('bio' in updates) dbPayload.bio = updates.bio ?? null;

    const { error } = await supabase.from('profiles').update(dbPayload).eq('id', currentUser.id);
    if (error) {
      console.error('[store] updateCurrentUser failed:', error.message, error.code, error.details);
      setCurrentUser(previousCurrentUser);
      setUsers(previousUsers);

      if (error.code === '23505') return 'Esse @username ja esta em uso.';
      if (error.message.includes('profiles_username_format_check')) return 'Use apenas letras minusculas, numeros e underscore.';
      if (error.message.includes('profiles_username_reserved_check')) return 'Esse @username nao esta disponivel.';
      return 'Nao foi possivel atualizar seu perfil agora.';
    }

    return null;
  };

  return (
    <StoreContext.Provider value={{
      dataLoading,
      currentUser,
      users,
      connections,
      userItemStatuses,
      unreadNotificationsCount,
      onboardingPreferences,
      onboardingDismissed,
      refreshUnreadNotificationsCount,
      saveOnboarding,
      skipOnboarding,
      addRecommendation,
      deleteRecommendation,
      editRecommendation,
      toggleInteraction,
      addComment,
      updateUserItemStatus,
      toggleFollow,
      addItem,
      updateCurrentUser,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error('useStore must be used within a StoreProvider');
  return context;
}

function toUser(profile: Database['public']['Tables']['profiles']['Row']): User {
  return {
    id: profile.id,
    name: profile.name,
    username: profile.username,
    avatar: profile.avatar ?? '',
    bio: profile.bio ?? undefined,
  };
}

function toConnection(connection: Database['public']['Tables']['connections']['Row']): Connection {
  return {
    id: connection.id,
    requester_id: connection.requester_id,
    receiver_id: connection.receiver_id,
    status: (connection.status ?? 'accepted') as Connection['status'],
  };
}

function toRecommendation(recommendation: Database['public']['Tables']['recommendations']['Row']): Recommendation {
  return {
    id: recommendation.id,
    from_user_id: recommendation.from_user_id,
    to_user_id: recommendation.to_user_id,
    item_id: recommendation.item_id,
    message: recommendation.message ?? undefined,
    discussion_enabled: recommendation.discussion_enabled,
    visibility: (recommendation.visibility ?? 'connections') as Recommendation['visibility'],
    created_at: recommendation.created_at,
  };
}

function toInteraction(interaction: Database['public']['Tables']['recommendation_interactions']['Row']): RecommendationInteraction {
  return {
    id: interaction.id,
    recommendation_id: interaction.recommendation_id,
    user_id: interaction.user_id,
    type: interaction.type as RecommendationInteraction['type'],
  };
}

function toComment(comment: Database['public']['Tables']['comments']['Row']): Comment {
  return {
    id: comment.id,
    recommendation_id: comment.recommendation_id,
    user_id: comment.user_id,
    content: comment.content,
    created_at: comment.created_at,
  };
}

function toUserItemStatus(status: Database['public']['Tables']['user_item_statuses']['Row']): UserItemStatus {
  return {
    id: status.id,
    user_id: status.user_id,
    item_id: status.item_id,
    status: status.status as UserItemStatus['status'],
  };
}
