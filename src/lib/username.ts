export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 24;

export const RESERVED_USERNAMES = [
  'admin',
  'api',
  'app',
  'auth',
  'create',
  'explore',
  'feed',
  'help',
  'home',
  'item',
  'items',
  'login',
  'me',
  'notifications',
  'perfil',
  'profile',
  'recommendation',
  'recommendations',
  'reset',
  'root',
  'search',
  'settings',
  'signup',
  'support',
  'system',
  'user',
  'users',
] as const;

export function sanitizeUsername(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, USERNAME_MAX_LENGTH);
}

export function validateUsername(username: string) {
  if (!username) return 'Escolha um @username.';
  if (username.length < USERNAME_MIN_LENGTH) return `Use pelo menos ${USERNAME_MIN_LENGTH} caracteres.`;
  if (username.length > USERNAME_MAX_LENGTH) return `Use no maximo ${USERNAME_MAX_LENGTH} caracteres.`;
  if (!/^[a-z0-9_]+$/.test(username)) return 'Use apenas letras minusculas, numeros e underscore.';
  if (RESERVED_USERNAMES.includes(username as typeof RESERVED_USERNAMES[number])) {
    return 'Esse @username nao esta disponivel.';
  }
  return null;
}

export function formatUsername(username: string) {
  return `@${username}`;
}
