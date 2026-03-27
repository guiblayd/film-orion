import { User, Item, Recommendation, RecommendationInteraction, Comment, UserItemStatus, Connection } from './types';

export const currentUser: User = {
  id: 'u1',
  name: 'Alex Silva',
  username: 'alex_silva',
  avatar: 'https://picsum.photos/seed/alex/150/150',
  bio: 'Sempre em busca de um bom sci-fi.',
};

export const mockUsers: User[] = [
  currentUser,
  { id: 'u2', name: 'Beatriz Costa', username: 'beatriz_costa', avatar: 'https://picsum.photos/seed/beatriz/150/150', bio: 'Fã de dramas coreanos e animes.' },
  { id: 'u3', name: 'Carlos Mendes', username: 'carlos_mendes', avatar: 'https://picsum.photos/seed/carlos/150/150', bio: 'Cinéfilo de fim de semana.' },
  { id: 'u4', name: 'Diana Rocha', username: 'diana_rocha', avatar: 'https://picsum.photos/seed/diana/150/150' },
  ...Array.from({ length: 26 }).map((_, i) => ({
    id: `u${i + 5}`,
    name: `User ${i + 5}`,
    username: `user_${i + 5}`,
    avatar: `https://picsum.photos/seed/user${i + 5}/150/150`,
    bio: `Bio for user ${i + 5}`,
  })),
];

export const mockConnections: Connection[] = [
  { id: 'c1', requester_id: 'u1', receiver_id: 'u2', status: 'accepted' },
  { id: 'c2', requester_id: 'u3', receiver_id: 'u1', status: 'accepted' },
  { id: 'c3', requester_id: 'u1', receiver_id: 'u4', status: 'accepted' },
  ...Array.from({ length: 26 }).map((_, i) => ({
    id: `c${i + 4}`,
    requester_id: 'u1',
    receiver_id: `u${i + 5}`,
    status: 'accepted' as const,
  })),
];

export const mockItems: Item[] = [
  { id: 'i1', title: 'Duna: Parte Dois', image: 'https://picsum.photos/seed/dune2/300/450', type: 'movie', year: 2024, watch_providers: ['Max'] },
  { id: 'i2', title: 'Shogun', image: 'https://picsum.photos/seed/shogun/300/450', type: 'series', year: 2024, watch_providers: ['Disney+', 'Star+'] },
  { id: 'i3', title: 'Frieren e a Jornada para o Além', image: 'https://picsum.photos/seed/frieren/300/450', type: 'anime', year: 2023, watch_providers: ['Crunchyroll'] },
  { id: 'i4', title: 'Pobres Criaturas', image: 'https://picsum.photos/seed/poorthings/300/450', type: 'movie', year: 2023, watch_providers: ['Star+'] },
];

export const mockRecommendations: Recommendation[] = [
  {
    id: 'r1',
    from_user_id: 'u2',
    to_user_id: 'u1',
    item_id: 'i3',
    message: 'Alex, você precisa ver isso. A forma como tratam a passagem do tempo é absurda. Confia.',
    discussion_enabled: true,
    visibility: 'connections',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'r2',
    from_user_id: 'u1',
    to_user_id: 'u3',
    item_id: 'i1',
    message: 'A experiência no cinema foi incrível, mas acho que você vai curtir mesmo em casa. Visual espetacular.',
    discussion_enabled: true,
    visibility: 'connections',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'r3',
    from_user_id: 'u4',
    to_user_id: 'u1',
    item_id: 'i2',
    message: 'Melhor série do ano até agora. A intriga política é no nível das primeiras temporadas de GoT.',
    discussion_enabled: true,
    visibility: 'connections',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

export const mockInteractions: RecommendationInteraction[] = [
  { id: 'int1', recommendation_id: 'r1', user_id: 'u3', type: 'support' },
  { id: 'int2', recommendation_id: 'r1', user_id: 'u4', type: 'support' },
  { id: 'int3', recommendation_id: 'r2', user_id: 'u2', type: 'oppose' },
  ...Array.from({ length: 15 }).map((_, i) => ({
    id: `int${i + 4}`,
    recommendation_id: 'r1',
    user_id: `u${i + 5}`,
    type: (Math.random() > 0.3 ? 'support' : 'oppose') as 'support' | 'oppose',
  })),
];

export const mockComments: Comment[] = [
  { id: 'com1', recommendation_id: 'r1', user_id: 'u3', content: 'Assino embaixo. Obra-prima.', created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
];

export const mockUserItemStatuses: UserItemStatus[] = [
  { id: 'uis1', user_id: 'u1', item_id: 'i2', status: 'saved' },
];
