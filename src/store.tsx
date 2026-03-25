import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { User, Item, Recommendation, RecommendationInteraction, Comment, UserItemStatus, Connection } from './types';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';

type StoreContextType = {
  dataLoading: boolean;
  currentUser: User;
  users: User[];
  items: Item[];
  recommendations: Recommendation[];
  interactions: RecommendationInteraction[];
  comments: Comment[];
  userItemStatuses: UserItemStatus[];
  connections: Connection[];
  addRecommendation: (rec: Omit<Recommendation, 'id' | 'created_at'>) => void;
  deleteRecommendation: (id: string) => void;
  editRecommendation: (id: string, message: string | undefined) => void;
  toggleInteraction: (recommendationId: string, type: 'support' | 'oppose') => void;
  addComment: (recommendationId: string, content: string) => void;
  updateUserItemStatus: (itemId: string, status: 'saved' | 'watched' | 'ignored') => void;
  toggleFollow: (userId: string) => void;
  addItem: (item: Item) => void;
  updateCurrentUser: (updates: Partial<Pick<User, 'name' | 'bio' | 'avatar'>>) => void;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User>({ id: '', name: '', avatar: '' });
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [interactions, setInteractions] = useState<RecommendationInteraction[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userItemStatuses, setUserItemStatuses] = useState<UserItemStatus[]>([]);

  // Ref to always have the latest items in async callbacks
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  useEffect(() => {
    if (!session?.user) return;
    loadAll(session.user.id);
  }, [session?.user?.id]);

  const loadAll = async (uid: string) => {
    setDataLoading(true);
    try {
      const [
        { data: profile },
        { data: profiles },
        { data: recs },
        { data: its },
        { data: ints },
        { data: cmts },
        { data: statuses },
        { data: conns },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).single(),
        supabase.from('profiles').select('*'),
        supabase.from('recommendations').select('*').order('created_at', { ascending: false }),
        supabase.from('items').select('*'),
        supabase.from('recommendation_interactions').select('*'),
        supabase.from('comments').select('*').order('created_at', { ascending: true }),
        supabase.from('user_item_statuses').select('*').eq('user_id', uid),
        supabase.from('connections').select('*'),
      ]);

      if (profile) setCurrentUser(profile);
      if (profiles) setUsers(profiles);
      if (recs) setRecommendations(recs);
      if (its) setItems(its);
      if (ints) setInteractions(ints);
      if (cmts) setComments(cmts);
      if (statuses) setUserItemStatuses(statuses);
      if (conns) setConnections(conns);
    } finally {
      setDataLoading(false);
    }
  };

  const addRecommendation = (rec: Omit<Recommendation, 'id' | 'created_at'>) => {
    const tempId = `r${Date.now()}`;
    const newRec: Recommendation = { ...rec, id: tempId, created_at: new Date().toISOString() };
    setRecommendations(prev => [newRec, ...prev]);

    (async () => {
      // Upsert item first to avoid FK violation
      const item = itemsRef.current.find(i => i.id === rec.item_id);
      if (item) {
        await supabase.from('items').upsert({
          id: item.id, title: item.title, image: item.image,
          type: item.type, year: item.year ?? null,
        });
      }
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
        setRecommendations(prev => prev.filter(r => r.id !== tempId));
        return;
      }
      if (data) setRecommendations(prev => prev.map(r => r.id === tempId ? data : r));
    })();
  };

  const deleteRecommendation = (id: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== id));
    supabase.from('recommendations').delete().eq('id', id).then(() => {});
  };

  const editRecommendation = (id: string, message: string | undefined) => {
    setRecommendations(prev => prev.map(r => r.id === id ? { ...r, message } : r));
    supabase.from('recommendations').update({ message: message ?? null }).eq('id', id).then(() => {});
  };

  const toggleInteraction = (recommendationId: string, type: 'support' | 'oppose') => {
    setInteractions(prev => {
      const existing = prev.find(i => i.recommendation_id === recommendationId && i.user_id === currentUser.id);
      if (existing) {
        if (existing.type === type) {
          supabase.from('recommendation_interactions').delete().eq('id', existing.id).then(() => {});
          return prev.filter(i => i.id !== existing.id);
        }
        supabase.from('recommendation_interactions').update({ type }).eq('id', existing.id).then(() => {});
        return prev.map(i => i.id === existing.id ? { ...i, type } : i);
      }
      const tempId = `int${Date.now()}`;
      supabase.from('recommendation_interactions').insert({
        recommendation_id: recommendationId,
        user_id: currentUser.id,
        type,
      }).select().single().then(({ data }) => {
        if (data) setInteractions(p => p.map(i => i.id === tempId ? data : i));
      });
      return [...prev, { id: tempId, recommendation_id: recommendationId, user_id: currentUser.id, type }];
    });
  };

  const addComment = (recommendationId: string, content: string) => {
    const tempId = `com${Date.now()}`;
    setComments(prev => [...prev, {
      id: tempId,
      recommendation_id: recommendationId,
      user_id: currentUser.id,
      content,
      created_at: new Date().toISOString(),
    }]);
    supabase.from('comments').insert({
      recommendation_id: recommendationId,
      user_id: currentUser.id,
      content,
    }).select().single().then(({ data }) => {
      if (data) setComments(p => p.map(c => c.id === tempId ? data : c));
    });
  };

  const updateUserItemStatus = (itemId: string, status: 'saved' | 'watched' | 'ignored') => {
    setUserItemStatuses(prev => {
      const existing = prev.find(s => s.item_id === itemId && s.user_id === currentUser.id);
      if (existing) {
        if (existing.status === status) {
          supabase.from('user_item_statuses').delete().eq('id', existing.id).then(() => {});
          return prev.filter(s => s.id !== existing.id);
        }
        supabase.from('user_item_statuses').update({ status }).eq('id', existing.id).then(() => {});
        return prev.map(s => s.id === existing.id ? { ...s, status } : s);
      }
      const tempId = `uis${Date.now()}`;
      supabase.from('user_item_statuses').insert({
        user_id: currentUser.id, item_id: itemId, status,
      }).select().single().then(({ data }) => {
        if (data) setUserItemStatuses(p => p.map(s => s.id === tempId ? data : s));
      });
      return [...prev, { id: tempId, user_id: currentUser.id, item_id: itemId, status }];
    });
  };

  const toggleFollow = (userId: string) => {
    setConnections(prev => {
      const existing = prev.find(c => c.requester_id === currentUser.id && c.receiver_id === userId);
      if (existing) {
        supabase.from('connections').delete().eq('id', existing.id).then(() => {});
        return prev.filter(c => c.id !== existing.id);
      }
      const tempId = `c${Date.now()}`;
      supabase.from('connections').insert({
        requester_id: currentUser.id, receiver_id: userId, status: 'accepted',
      }).select().single().then(({ data }) => {
        if (data) setConnections(p => p.map(c => c.id === tempId ? data : c));
      });
      return [...prev, { id: tempId, requester_id: currentUser.id, receiver_id: userId, status: 'accepted' }];
    });
  };

  const addItem = (item: Item) => {
    setItems(prev => prev.find(i => i.id === item.id) ? prev : [...prev, item]);
    supabase.from('items').upsert({
      id: item.id, title: item.title, image: item.image,
      type: item.type, year: item.year ?? null,
    }).then(() => {});
  };

  const updateCurrentUser = (updates: Partial<Pick<User, 'name' | 'bio' | 'avatar'>>) => {
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
    supabase.from('profiles').update(updates).eq('id', currentUser.id).then(() => {});
  };

  return (
    <StoreContext.Provider value={{
      dataLoading,
      currentUser,
      users,
      items,
      recommendations,
      interactions,
      comments,
      userItemStatuses,
      connections,
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
