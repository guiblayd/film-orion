import { Item } from '../types';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY as string | undefined;
const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w300';
export const LOGO_IMG = 'https://image.tmdb.org/t/p/w92';
export const TMDB_GENRES = [
  { id: '18', label: 'Drama' },
  { id: '878', label: 'Ficcao cientifica' },
  { id: '53', label: 'Suspense' },
  { id: '35', label: 'Comedia' },
  { id: '10749', label: 'Romance' },
  { id: '16', label: 'Animacao' },
] as const;

export const TMDB_PROVIDERS = [
  { id: '8', label: 'Netflix' },
  { id: '119', label: 'Prime Video' },
  { id: '1899', label: 'Max' },
  { id: '337', label: 'Disney Plus' },
  { id: '350', label: 'Apple TV Plus' },
] as const;

const COUNTRY_PT: Record<string, string> = {
  US: 'Estados Unidos',
  GB: 'Reino Unido',
  FR: 'Franca',
  DE: 'Alemanha',
  IT: 'Italia',
  ES: 'Espanha',
  JP: 'Japao',
  KR: 'Coreia do Sul',
  CN: 'China',
  IN: 'India',
  BR: 'Brasil',
  AU: 'Australia',
  CA: 'Canada',
  MX: 'Mexico',
  AR: 'Argentina',
  PT: 'Portugal',
  RU: 'Russia',
  SE: 'Suecia',
  DK: 'Dinamarca',
  NO: 'Noruega',
  NL: 'Paises Baixos',
  BE: 'Belgica',
  CH: 'Suica',
  AT: 'Austria',
  PL: 'Polonia',
  TR: 'Turquia',
  IL: 'Israel',
  TH: 'Tailandia',
  HK: 'Hong Kong',
  TW: 'Taiwan',
  IE: 'Irlanda',
  NZ: 'Nova Zelandia',
  ZA: 'Africa do Sul',
  CO: 'Colombia',
  CL: 'Chile',
  PE: 'Peru',
};

export type TMDBDetails = {
  country?: string;
  overview?: string;
  backdrop?: string;
  provider_logos?: { name: string; logo_path: string }[];
  runtime?: number;
  seasons?: number;
  genres?: string[];
  cast?: string[];
  director?: string;
  creators?: string[];
  vote_average?: number;
};

function withKey(path: string, extraParams = '') {
  if (!API_KEY) return null;
  const separator = extraParams ? '&' : '';
  return `${BASE}${path}?api_key=${API_KEY}${separator}${extraParams}`;
}

export async function getTMDBDetails(tmdbId: number, mediaType: 'movie' | 'tv'): Promise<TMDBDetails> {
  const detailsUrl = withKey(`/${mediaType}/${tmdbId}`, 'language=pt-BR&append_to_response=credits');
  const providersUrl = withKey(`/${mediaType}/${tmdbId}/watch/providers`);
  if (!detailsUrl || !providersUrl) return {};

  try {
    const [detailsRes, providersRes] = await Promise.all([
      fetch(detailsUrl),
      fetch(providersUrl),
    ]);
    if (!detailsRes.ok) return {};
    const details = await detailsRes.json();
    const providers = providersRes.ok ? await providersRes.json() : {};

    const backdropPath = details.backdrop_path as string | null;
    const backdrop = backdropPath ? `https://image.tmdb.org/t/p/w780${backdropPath}` : undefined;

    const countryCode = mediaType === 'movie'
      ? details.production_countries?.[0]?.iso_3166_1
      : details.origin_country?.[0];
    const country = countryCode ? (COUNTRY_PT[countryCode] ?? countryCode) : undefined;
    const overview: string | undefined = details.overview || undefined;

    const flatrate =
      providers.results?.BR?.flatrate ||
      providers.results?.US?.flatrate ||
      [];
    const seen = new Set<number>();
    const provider_logos = (flatrate as any[])
      .filter(provider => {
        if (seen.has(provider.provider_id)) return false;
        seen.add(provider.provider_id);
        return true;
      })
      .map(provider => ({
        name: provider.provider_name as string,
        logo_path: provider.logo_path as string,
      }));

    const runtime = mediaType === 'movie' ? (details.runtime || undefined) : undefined;
    const seasons = mediaType === 'tv' ? (details.number_of_seasons || undefined) : undefined;
    const genres: string[] = (details.genres || []).slice(0, 3).map((genre: any) => genre.name as string);
    const cast: string[] = (details.credits?.cast || []).slice(0, 5).map((member: any) => member.name as string);
    const director = mediaType === 'movie'
      ? ((details.credits?.crew || []).find((member: any) => member.job === 'Director')?.name as string | undefined)
      : undefined;
    const creators: string[] = mediaType === 'tv'
      ? (details.created_by || []).map((creator: any) => creator.name as string)
      : [];
    const vote_average = details.vote_average ? Math.round(details.vote_average * 10) / 10 : undefined;

    return {
      country,
      overview,
      backdrop,
      provider_logos,
      runtime,
      seasons,
      genres,
      cast,
      director,
      creators: creators.length ? creators : undefined,
      vote_average,
    };
  } catch {
    return {};
  }
}

function mapMovie(result: any): Item {
  return {
    id: `tmdb_${result.id}`,
    title: result.title,
    image: `${IMG}${result.poster_path}`,
    type: 'movie',
    year: Number(result.release_date?.substring(0, 4)) || undefined,
  };
}

function mapTV(result: any): Item {
  const isAnime = (result.genre_ids as number[]).includes(16) && result.original_language === 'ja';
  return {
    id: `tmdb_${result.id}`,
    title: result.name,
    image: `${IMG}${result.poster_path}`,
    type: isAnime ? 'anime' : 'series',
    year: Number(result.first_air_date?.substring(0, 4)) || undefined,
  };
}

async function fetchList(url: string | null, mapFn: (result: any) => Item): Promise<Item[]> {
  if (!url) return [];

  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.results || []).filter((result: any) => result.poster_path).map(mapFn);
  } catch {
    return [];
  }
}

async function discoverList({
  mediaType,
  providerId,
  genreId,
  sortBy = 'popularity.desc',
  year,
  releaseDateGte,
  releaseDateLte,
  firstAirDateGte,
  firstAirDateLte,
}: {
  mediaType: 'movie' | 'tv';
  providerId?: string;
  genreId?: string;
  sortBy?: string;
  year?: string;
  releaseDateGte?: string;
  releaseDateLte?: string;
  firstAirDateGte?: string;
  firstAirDateLte?: string;
}) {
  const params = new URLSearchParams({
    language: 'pt-BR',
    include_adult: 'false',
    sort_by: sortBy,
    watch_region: 'BR',
  });

  if (providerId) params.set('with_watch_providers', providerId);
  if (genreId) params.set('with_genres', genreId);

  if (year) {
    if (mediaType === 'movie') params.set('primary_release_year', year);
    else params.set('first_air_date_year', year);
  }

  if (mediaType === 'movie') {
    if (releaseDateGte) params.set('primary_release_date.gte', releaseDateGte);
    if (releaseDateLte) params.set('primary_release_date.lte', releaseDateLte);
  } else {
    if (firstAirDateGte) params.set('first_air_date.gte', firstAirDateGte);
    if (firstAirDateLte) params.set('first_air_date.lte', firstAirDateLte);
  }

  return fetchList(withKey(`/discover/${mediaType}`, params.toString()), mediaType === 'movie' ? mapMovie : mapTV);
}

export function getTrending(): Promise<Item[]> {
  return fetchList(
    withKey('/trending/all/week', 'language=pt-BR'),
    (result: any) => result.media_type === 'tv' ? mapTV(result) : mapMovie(result)
  ).then(items => items.filter(item => !item.image.includes('/null')));
}

export function getPopularMovies(): Promise<Item[]> {
  return fetchList(withKey('/movie/popular', 'language=pt-BR&region=BR'), mapMovie);
}

export function getPopularTV(): Promise<Item[]> {
  return fetchList(withKey('/tv/popular', 'language=pt-BR'), mapTV);
}

export function getTopRatedMovies(): Promise<Item[]> {
  return fetchList(withKey('/movie/top_rated', 'language=pt-BR&region=BR'), mapMovie);
}

export async function getNetflixNewReleases(): Promise<Item[]> {
  const currentYear = new Date().getFullYear();
  const recentStart = `${currentYear - 1}-01-01`;

  const [movies, series] = await Promise.all([
    discoverList({
      mediaType: 'movie',
      providerId: '8',
      sortBy: 'primary_release_date.desc',
      releaseDateGte: recentStart,
    }),
    discoverList({
      mediaType: 'tv',
      providerId: '8',
      sortBy: 'first_air_date.desc',
      firstAirDateGte: recentStart,
    }),
  ]);

  return dedupeItems([...movies, ...series]).slice(0, 18);
}

export async function searchTMDB(query: string): Promise<Item[]> {
  if (!query.trim()) return [];

  const url = withKey(
    '/search/multi',
    `query=${encodeURIComponent(query)}&language=pt-BR&include_adult=false`
  );
  if (!url) return [];

  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();

  return (data.results || [])
    .filter((result: any) => (result.media_type === 'movie' || result.media_type === 'tv') && result.poster_path)
    .slice(0, 20)
    .map((result: any): Item => {
      const isTV = result.media_type === 'tv';
      const isAnime = isTV && (result.genre_ids as number[]).includes(16) && result.original_language === 'ja';
      return {
        id: `tmdb_${result.id}`,
        title: isTV ? result.name : result.title,
        image: `${IMG}${result.poster_path}`,
        type: isAnime ? 'anime' : isTV ? 'series' : 'movie',
        year: Number((isTV ? result.first_air_date : result.release_date)?.substring(0, 4)) || undefined,
      };
    });
}

export async function discoverTMDB({
  mediaType = 'all',
  genreId,
  providerId,
  year,
}: {
  mediaType?: 'all' | 'movie' | 'tv';
  genreId?: string;
  providerId?: string;
  year?: string;
}): Promise<Item[]> {
  if (!API_KEY) return [];

  const targets = mediaType === 'all' ? ['movie', 'tv'] as const : [mediaType] as const;
  const requests = targets.map(target => discoverList({
    mediaType: target,
    providerId,
    genreId,
    year,
  }));

  const lists = await Promise.all(requests);
  return dedupeItems(lists.flat()).slice(0, 18);
}

function dedupeItems(items: Item[]) {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
