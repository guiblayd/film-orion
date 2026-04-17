import { supabase } from '../lib/supabase';
import { Comment, Item, Recommendation, RecommendationInteraction, User } from '../types';
import { Database } from '../types/database';

type RecommendationQueryOptions = {
  fromUserId?: string;
  toUserId?: string;
  itemId?: string;
  limit?: number;
};

export type RecommendationComment = Comment & {
  user: User | null;
};

export type RecommendationCardData = {
  recommendation: Recommendation;
  item: Item;
  fromUser: User;
  toUser: User;
  participants: User[];
  participantCount: number;
  interactions: RecommendationInteraction[];
  comments: RecommendationComment[];
};

type ItemRow = Database['public']['Tables']['items']['Row'];
type InteractionRow = Database['public']['Tables']['recommendation_interactions']['Row'];
type CommentRow = Database['public']['Tables']['comments']['Row'];
type RecommendationRow = Database['public']['Tables']['recommendations']['Row'];

type RawRecommendation = RecommendationRow & {
  item: ItemRow | null;
  recommendation_interactions: InteractionRow[];
  comments: CommentRow[];
};

// Single round-trip: embeds items, interactions and comments directly
const REC_SELECT = `*, item:items(*), recommendation_interactions(*), comments(*)`;

export async function fetchRecommendationCards(
  users: User[],
  options: RecommendationQueryOptions = {}
): Promise<RecommendationCardData[]> {
  let query = supabase
    .from('recommendations')
    .select(REC_SELECT)
    .order('created_at', { ascending: false });

  if (options.fromUserId) query = query.eq('from_user_id', options.fromUserId);
  if (options.toUserId) query = query.eq('to_user_id', options.toUserId);
  if (options.itemId) query = query.eq('item_id', options.itemId);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) {
    console.error('fetchRecommendationCards:', error.message);
    return [];
  }

  return buildFromRaw((data ?? []) as unknown as RawRecommendation[], users);
}

export async function fetchRecommendationCardById(id: string, users: User[]) {
  const { data, error } = await supabase
    .from('recommendations')
    .select(REC_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('fetchRecommendationCardById:', error.message);
    return null;
  }

  const [card] = buildFromRaw([data as unknown as RawRecommendation], users);
  return card ?? null;
}

export async function fetchItemById(id: string) {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('fetchItemById:', error.message);
    return null;
  }

  return data ? toItem(data) : null;
}

export async function fetchItemsByIds(ids: string[]) {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .in('id', ids);

  if (error) {
    console.error('fetchItemsByIds:', error.message);
    return [];
  }

  return (data ?? []).map(toItem);
}

// Sync: processes already-fetched embedded data — no extra network calls
function buildFromRaw(raws: RawRecommendation[], users: User[]): RecommendationCardData[] {
  if (raws.length === 0) return [];

  const usersById = new Map(users.map(user => [user.id, user]));

  return raws.flatMap(raw => {
    const fromUser = usersById.get(raw.from_user_id);
    const toUser = usersById.get(raw.to_user_id);
    if (!fromUser || !toUser || !raw.item) return [];

    const item = toItem(raw.item);
    const interactions = (raw.recommendation_interactions ?? []).map(toInteraction);
    const comments = (raw.comments ?? [])
      .slice()
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(c => ({ ...toComment(c), user: usersById.get(c.user_id) ?? null }));

    const participantIds = [...new Set([
      ...interactions.map(i => i.user_id),
      ...comments.map(c => c.user_id),
    ])];

    return [{
      recommendation: toRecommendation(raw),
      item,
      fromUser,
      toUser,
      participants: participantIds
        .map(pid => usersById.get(pid))
        .filter((u): u is User => Boolean(u))
        .slice(0, 5),
      participantCount: participantIds.length,
      interactions,
      comments,
    }];
  });
}

function toItem(item: ItemRow): Item {
  return {
    id: item.id,
    title: item.title,
    image: item.image ?? '',
    type: item.type as Item['type'],
    year: item.year ?? undefined,
  };
}

function toRecommendation(recommendation: RecommendationRow): Recommendation {
  return {
    id: recommendation.id,
    from_user_id: recommendation.from_user_id,
    to_user_id: recommendation.to_user_id,
    item_id: recommendation.item_id,
    message: recommendation.message ?? undefined,
    has_spoiler: recommendation.has_spoiler ?? false,
    discussion_enabled: recommendation.discussion_enabled,
    visibility: (recommendation.visibility ?? 'connections') as Recommendation['visibility'],
    created_at: recommendation.created_at,
  };
}

function toInteraction(interaction: InteractionRow): RecommendationInteraction {
  return {
    id: interaction.id,
    recommendation_id: interaction.recommendation_id,
    user_id: interaction.user_id,
    type: interaction.type as RecommendationInteraction['type'],
  };
}

function toComment(comment: CommentRow): Comment {
  return {
    id: comment.id,
    recommendation_id: comment.recommendation_id,
    user_id: comment.user_id,
    content: comment.content,
    created_at: comment.created_at,
  };
}
