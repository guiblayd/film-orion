import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Item, Recommendation, RecommendationInteraction, Comment, UserItemStatus, Connection } from './types';
import { currentUser as initialCurrentUser, mockUsers, mockItems, mockRecommendations, mockInteractions, mockComments, mockUserItemStatuses, mockConnections } from './mockData';

type StoreContextType = {
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
  updateCurrentUser: (updates: Partial<Pick<User, 'name' | 'bio'>>) => void;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(initialCurrentUser);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [items, setItems] = useState<Item[]>(mockItems);
  const [connections, setConnections] = useState<Connection[]>(mockConnections);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(mockRecommendations);
  const [interactions, setInteractions] = useState<RecommendationInteraction[]>(mockInteractions);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [userItemStatuses, setUserItemStatuses] = useState<UserItemStatus[]>(mockUserItemStatuses);

  const addRecommendation = (rec: Omit<Recommendation, 'id' | 'created_at'>) => {
    setRecommendations(prev => [{
      ...rec,
      id: `r${Date.now()}`,
      created_at: new Date().toISOString(),
    }, ...prev]);
  };

  const deleteRecommendation = (id: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== id));
  };

  const editRecommendation = (id: string, message: string | undefined) => {
    setRecommendations(prev => prev.map(r => r.id === id ? { ...r, message } : r));
  };

  const toggleInteraction = (recommendationId: string, type: 'support' | 'oppose') => {
    setInteractions(prev => {
      const existing = prev.find(i => i.recommendation_id === recommendationId && i.user_id === currentUser.id);
      if (existing) {
        if (existing.type === type) return prev.filter(i => i.id !== existing.id);
        return prev.map(i => i.id === existing.id ? { ...i, type } : i);
      }
      return [...prev, { id: `int${Date.now()}`, recommendation_id: recommendationId, user_id: currentUser.id, type }];
    });
  };

  const addComment = (recommendationId: string, content: string) => {
    setComments(prev => [...prev, {
      id: `com${Date.now()}`,
      recommendation_id: recommendationId,
      user_id: currentUser.id,
      content,
      created_at: new Date().toISOString(),
    }]);
  };

  const updateUserItemStatus = (itemId: string, status: 'saved' | 'watched' | 'ignored') => {
    setUserItemStatuses(prev => {
      const existing = prev.find(s => s.item_id === itemId && s.user_id === currentUser.id);
      if (existing) {
        if (existing.status === status) return prev.filter(s => s.id !== existing.id);
        return prev.map(s => s.id === existing.id ? { ...s, status } : s);
      }
      return [...prev, { id: `uis${Date.now()}`, user_id: currentUser.id, item_id: itemId, status }];
    });
  };

  const toggleFollow = (userId: string) => {
    setConnections(prev => {
      const existing = prev.find(c => c.requester_id === currentUser.id && c.receiver_id === userId);
      if (existing) return prev.filter(c => c.id !== existing.id);
      return [...prev, { id: `c${Date.now()}`, requester_id: currentUser.id, receiver_id: userId, status: 'accepted' }];
    });
  };

  const addItem = (item: Item) => {
    setItems(prev => prev.find(i => i.id === item.id) ? prev : [...prev, item]);
  };

  const updateCurrentUser = (updates: Partial<Pick<User, 'name' | 'bio'>>) => {
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  return (
    <StoreContext.Provider value={{
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
