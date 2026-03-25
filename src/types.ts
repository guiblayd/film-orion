export type User = {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
};

export type Connection = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
};

export type Item = {
  id: string;
  title: string;
  image: string;
  type: 'movie' | 'series' | 'anime';
  year?: number;
  metadata?: string;
  watch_providers?: string[];
};

export type Recommendation = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  item_id: string;
  message?: string;
  discussion_enabled: boolean;
  visibility: 'private' | 'connections' | 'public';
  created_at: string;
};

export type RecommendationInteraction = {
  id: string;
  recommendation_id: string;
  user_id: string;
  type: 'support' | 'oppose';
};

export type Comment = {
  id: string;
  recommendation_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export type UserItemStatus = {
  id: string;
  user_id: string;
  item_id: string;
  status: 'saved' | 'watched' | 'ignored';
};
