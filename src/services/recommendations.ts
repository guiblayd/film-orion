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

export async function fetchRecommendationCards(
  users: User[],
  options: RecommendationQueryOptions = {}
): Promise<RecommendationCardData[]> {
  let query = supabase
    .from('recommendations')
    .select('*')
    .order('created_at', { ascending: false });

  if (options.fromUserId) query = query.eq('from_user_id', options.fromUserId);
  if (options.toUserId) query = query.eq('to_user_id', options.toUserId);
  if (options.itemId) query = query.eq('item_id', options.itemId);
  if (options.limit) query = query.limit(options.limit);

  const { data: recommendations, error } = await query;
  if (error) {
    console.error('fetchRecommendationCards:', error.message);
    return [];
  }

  return buildRecommendationCards((recommendations ?? []).map(toRecommendation), users);
}

export async function fetchRecommendationCardById(id: string, users: User[]) {
  const { data: recommendation, error } = await supabase
    .from('recommendations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !recommendation) {
    if (error) console.error('fetchRecommendationCardById:', error.message);
    return null;
  }

  const [card] = await buildRecommendationCards([toRecommendation(recommendation)], users);
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

async function buildRecommendationCards(recommendations: Recommendation[], users: User[]) {
  if (recommendations.length === 0) return [];

  const recommendationIds = recommendations.map(recommendation => recommendation.id);
  const itemIds = [...new Set(recommendations.map(recommendation => recommendation.item_id))];

  const [{ data: items }, { data: interactions }, { data: comments }] = await Promise.all([
    supabase.from('items').select('*').in('id', itemIds),
    supabase.from('recommendation_interactions').select('*').in('recommendation_id', recommendationIds),
    supabase
      .from('comments')
      .select('*')
      .in('recommendation_id', recommendationIds)
      .order('created_at', { ascending: true }),
  ]);

  const usersById = new Map(users.map(user => [user.id, user] as const));
  const itemsById = new Map((items ?? []).map(item => {
    const nextItem = toItem(item);
    return [nextItem.id, nextItem] as const;
  }));
  const interactionsByRecommendationId = groupBy((interactions ?? []).map(toInteraction), interaction => interaction.recommendation_id);
  const commentsByRecommendationId = groupBy((comments ?? []).map(toComment), comment => comment.recommendation_id);

  return recommendations.flatMap(recommendation => {
    const fromUser = usersById.get(recommendation.from_user_id);
    const toUser = usersById.get(recommendation.to_user_id);
    const item = itemsById.get(recommendation.item_id);

    if (!fromUser || !toUser || !item) return [];

    const recommendationInteractions = interactionsByRecommendationId.get(recommendation.id) ?? [];
    const recommendationComments = (commentsByRecommendationId.get(recommendation.id) ?? []).map(comment => ({
      ...comment,
      user: usersById.get(comment.user_id) ?? null,
    }));

    const participantIds = [...new Set([
      ...recommendationInteractions.map(interaction => interaction.user_id),
      ...recommendationComments.map(comment => comment.user_id),
    ])];

    return [{
      recommendation,
      item,
      fromUser,
      toUser,
      participants: participantIds
        .map(participantId => usersById.get(participantId))
        .filter((participant): participant is User => Boolean(participant))
        .slice(0, 5),
      participantCount: participantIds.length,
      interactions: recommendationInteractions,
      comments: recommendationComments,
    }];
  });
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce((map, item) => {
    const key = getKey(item);
    const current = map.get(key);
    if (current) current.push(item);
    else map.set(key, [item]);
    return map;
  }, new Map<string, T[]>());
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
