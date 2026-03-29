export type User = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  is_admin?: boolean;
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
  has_spoiler: boolean;
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

export type NotificationType =
  | 'recommendation_received'
  | 'comment_added'
  | 'connection_created'
  | 'recommendation_status_changed'
  | 'admin_message';

export type AppNotification = {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: NotificationType;
  recommendation_id?: string;
  comment_id?: string;
  connection_id?: string;
  item_id?: string;
  metadata?: Record<string, string | number | boolean | null>;
  read_at?: string;
  created_at: string;
};

export type OnboardingPreferences = {
  favoriteTypes: Item['type'][];
  favoriteGenres: string[];
  favoriteProviders: string[];
  completed_at: string;
};
