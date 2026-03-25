import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Item, Recommendation, RecommendationInteraction, Comment, UserItemStatus, Connection } from './types';
import { currentUser, mockUsers, mockItems, mockRecommendations, mockInteractions, mockComments, mockUserItemStatuses, mockConnections } from './mockData';

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
  toggleInteraction: (recommendationId: string, type: 'support' | 'oppose') => void;
  addComment: (recommendationId: string, content: string) => void;
  updateUserItemStatus: (itemId: string, status: 'saved' | 'watched' | 'ignored') => void;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [users] = useState<User[]>(mockUsers);
  const [items] = useState<Item[]>(mockItems);
  const [connections] = useState<Connection[]>(mockConnections);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(mockRecommendations);
  const [interactions, setInteractions] = useState<RecommendationInteraction[]>(mockInteractions);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [userItemStatuses, setUserItemStatuses] = useState<UserItemStatus[]>(mockUserItemStatuses);

  const addRecommendation = (rec: Omit<Recommendation, 'id' | 'created_at'>) => {
    const newRec: Recommendation = {
      ...rec,
      id: `r${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setRecommendations([newRec, ...recommendations]);
  };

  const toggleInteraction = (recommendationId: string, type: 'support' | 'oppose') => {
    setInteractions(prev => {
      const existing = prev.find(i => i.recommendation_id === recommendationId && i.user_id === currentUser.id);
      
      if (existing) {
        if (existing.type === type) {
          // Remove if clicking the same
          return prev.filter(i => i.id !== existing.id);
        } else {
          // Switch type
          return prev.map(i => i.id === existing.id ? { ...i, type } : i);
        }
      } else {
        // Add new
        return [...prev, { id: `int${Date.now()}`, recommendation_id: recommendationId, user_id: currentUser.id, type }];
      }
    });
  };

  const addComment = (recommendationId: string, content: string) => {
    const newComment: Comment = {
      id: `com${Date.now()}`,
      recommendation_id: recommendationId,
      user_id: currentUser.id,
      content,
      created_at: new Date().toISOString(),
    };
    setComments([...comments, newComment]);
  };

  const updateUserItemStatus = (itemId: string, status: 'saved' | 'watched' | 'ignored') => {
    setUserItemStatuses(prev => {
      const existing = prev.find(s => s.item_id === itemId && s.user_id === currentUser.id);
      if (existing) {
        if (existing.status === status) {
          return prev.filter(s => s.id !== existing.id); // Toggle off
        }
        return prev.map(s => s.id === existing.id ? { ...s, status } : s);
      } else {
        return [...prev, { id: `uis${Date.now()}`, user_id: currentUser.id, item_id: itemId, status }];
      }
    });
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
      toggleInteraction,
      addComment,
      updateUserItemStatus
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
