import { User } from '../types';

export const GUEST_MODE_STORAGE_KEY = 'filmorion:guest-mode';
export const GUEST_USER_ID = 'guest';

const GUEST_AVATAR_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="32" fill="#18181b" />
    <circle cx="32" cy="24" r="12" fill="#52525b" />
    <path d="M14 52c3-11 12-16 18-16s15 5 18 16" fill="#52525b" />
  </svg>
`;

export const GUEST_USER: User = {
  id: GUEST_USER_ID,
  name: 'Visitante',
  username: 'visitante',
  avatar: `data:image/svg+xml;utf8,${encodeURIComponent(GUEST_AVATAR_SVG)}`,
  bio: 'Navegando em modo somente leitura.',
};
