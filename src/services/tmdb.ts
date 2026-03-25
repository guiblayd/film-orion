import { Item } from '../types';

const API_KEY = '418765d7c9dee1aa4c604bb76f6bb2c9';
const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w300';
export const LOGO_IMG = 'https://image.tmdb.org/t/p/w45';

const COUNTRY_PT: Record<string, string> = {
  US: 'Estados Unidos', GB: 'Reino Unido', FR: 'França', DE: 'Alemanha',
  IT: 'Itália', ES: 'Espanha', JP: 'Japão', KR: 'Coreia do Sul',
  CN: 'China', IN: 'Índia', BR: 'Brasil', AU: 'Austrália',
  CA: 'Canadá', MX: 'México', AR: 'Argentina', PT: 'Portugal',
  RU: 'Rússia', SE: 'Suécia', DK: 'Dinamarca', NO: 'Noruega',
  NL: 'Países Baixos', BE: 'Bélgica', CH: 'Suíça', AT: 'Áustria',
  PL: 'Polônia', TR: 'Turquia', IL: 'Israel', TH: 'Tailândia',
  HK: 'Hong Kong', TW: 'Taiwan', IE: 'Irlanda', NZ: 'Nova Zelândia',
  ZA: 'África do Sul', CO: 'Colômbia', CL: 'Chile', PE: 'Peru',
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

export async function getTMDBDetails(tmdbId: number, mediaType: 'movie' | 'tv'): Promise<TMDBDetails> {
  try {
    const [detailsRes, providersRes] = await Promise.all([
      fetch(`${BASE}/${mediaType}/${tmdbId}?api_key=${API_KEY}&language=pt-BR&append_to_response=credits`),
      fetch(`${BASE}/${mediaType}/${tmdbId}/watch/providers?api_key=${API_KEY}`),
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

    // Only show subscription (flatrate) providers — buy/rent can show wrong services
    const flatrate =
      providers.results?.BR?.flatrate ||
      providers.results?.US?.flatrate ||
      [];
    const seen = new Set<number>();
    const provider_logos = (flatrate as any[])
      .filter(p => {
        if (seen.has(p.provider_id)) return false;
        seen.add(p.provider_id);
        return true;
      })
      .map(p => ({
        name: p.provider_name as string,
        logo_path: p.logo_path as string,
      }));

    const runtime = mediaType === 'movie' ? (details.runtime || undefined) : undefined;
    const seasons = mediaType === 'tv' ? (details.number_of_seasons || undefined) : undefined;
    const genres: string[] = (details.genres || []).slice(0, 3).map((g: any) => g.name as string);
    const cast: string[] = (details.credits?.cast || []).slice(0, 5).map((c: any) => c.name as string);
    const director = mediaType === 'movie'
      ? ((details.credits?.crew || []).find((c: any) => c.job === 'Director')?.name as string | undefined)
      : undefined;
    const creators: string[] = mediaType === 'tv'
      ? (details.created_by || []).map((c: any) => c.name as string)
      : [];
    const vote_average = details.vote_average ? Math.round(details.vote_average * 10) / 10 : undefined;

    return { country, overview, backdrop, provider_logos, runtime, seasons, genres, cast, director, creators: creators.length ? creators : undefined, vote_average };
  } catch {
    return {};
  }
}

function mapMovie(r: any): Item {
  return {
    id: `tmdb_${r.id}`,
    title: r.title,
    image: `${IMG}${r.poster_path}`,
    type: 'movie',
    year: Number(r.release_date?.substring(0, 4)) || undefined,
  };
}

function mapTV(r: any): Item {
  const isAnime = (r.genre_ids as number[]).includes(16) && r.original_language === 'ja';
  return {
    id: `tmdb_${r.id}`,
    title: r.name,
    image: `${IMG}${r.poster_path}`,
    type: isAnime ? 'anime' : 'series',
    year: Number(r.first_air_date?.substring(0, 4)) || undefined,
  };
}

async function fetchList(url: string, mapFn: (r: any) => Item): Promise<Item[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).filter((r: any) => r.poster_path).map(mapFn);
  } catch {
    return [];
  }
}

export function getTrending(): Promise<Item[]> {
  return fetchList(
    `${BASE}/trending/all/week?api_key=${API_KEY}&language=pt-BR`,
    (r: any) => {
      if (r.media_type === 'tv') return mapTV(r);
      return mapMovie(r);
    }
  ).then(items => items.filter(i => i.image.includes('/null') === false));
}

export function getPopularMovies(): Promise<Item[]> {
  return fetchList(`${BASE}/movie/popular?api_key=${API_KEY}&language=pt-BR&region=BR`, mapMovie);
}

export function getPopularTV(): Promise<Item[]> {
  return fetchList(`${BASE}/tv/popular?api_key=${API_KEY}&language=pt-BR`, mapTV);
}

export function getTopRatedMovies(): Promise<Item[]> {
  return fetchList(`${BASE}/movie/top_rated?api_key=${API_KEY}&language=pt-BR&region=BR`, mapMovie);
}

export async function searchTMDB(query: string): Promise<Item[]> {
  if (!query.trim()) return [];
  const res = await fetch(
    `${BASE}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR&include_adult=false`
  );
  if (!res.ok) return [];
  const data = await res.json();

  return (data.results || [])
    .filter((r: any) => (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path)
    .slice(0, 20)
    .map((r: any): Item => {
      const isTV = r.media_type === 'tv';
      const isAnime = isTV && (r.genre_ids as number[]).includes(16) && r.original_language === 'ja';
      return {
        id: `tmdb_${r.id}`,
        title: isTV ? r.name : r.title,
        image: `${IMG}${r.poster_path}`,
        type: isAnime ? 'anime' : isTV ? 'series' : 'movie',
        year: Number((isTV ? r.first_air_date : r.release_date)?.substring(0, 4)) || undefined,
      };
    });
}
