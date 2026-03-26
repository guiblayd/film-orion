import { OnboardingPreferences } from '../types';

export const ONBOARDING_GENRES = [
  'Drama',
  'Ficcao cientifica',
  'Suspense',
  'Comedia',
  'Romance',
  'Animacao',
] as const;

export const ONBOARDING_PROVIDERS = [
  'Netflix',
  'Prime Video',
  'Max',
  'Disney Plus',
  'Apple TV Plus',
] as const;

export function getOnboardingStorageKey(userId: string) {
  return `filmorion:onboarding:${userId}`;
}

export function loadOnboardingPreferences(userId: string): OnboardingPreferences | null {
  if (typeof window === 'undefined' || !userId) return null;

  const raw = window.localStorage.getItem(getOnboardingStorageKey(userId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as OnboardingPreferences;
    if (!Array.isArray(parsed.favoriteTypes) || !Array.isArray(parsed.favoriteGenres) || !Array.isArray(parsed.favoriteProviders)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveOnboardingPreferences(userId: string, preferences: Omit<OnboardingPreferences, 'completed_at'>) {
  if (typeof window === 'undefined' || !userId) return null;

  const value: OnboardingPreferences = {
    ...preferences,
    completed_at: new Date().toISOString(),
  };
  window.localStorage.setItem(getOnboardingStorageKey(userId), JSON.stringify(value));
  return value;
}

export function dismissOnboarding(userId: string) {
  if (typeof window === 'undefined' || !userId) return;
  window.localStorage.setItem(`filmorion:onboarding:dismissed:${userId}`, '1');
}

export function isOnboardingDismissed(userId: string) {
  if (typeof window === 'undefined' || !userId) return false;
  return window.localStorage.getItem(`filmorion:onboarding:dismissed:${userId}`) === '1';
}
