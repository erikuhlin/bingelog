import { MediaItem } from './types';
import { discoverMedia, getPopularMovies, getPopularShows } from './tmdb';

export interface SeasonalTheme {
  id: string;
  title: string;
  description: string;
  iconType: 'sparkles' | 'calendar' | 'film' | 'tv' | 'clock';
  iconColor: string;
  badge: string;
  movieGenreId?: number;
  movieSortBy?: string;
  tvGenreId?: number;
  tvSortBy?: string;
}

export interface CuratedCategoryRow {
  id: string;
  title: string;
  description: string;
  badge?: string;
  iconType?: 'sparkles' | 'calendar' | 'film' | 'tv' | 'clock';
  iconColor?: string;
  items: MediaItem[];
}

/**
 * Returns the current seasonal theme dynamically based on month of the year:
 * - October: Halloween & Horror
 * - Nov/Dec: Christmas & Winter warmers
 * - Jan/Feb: Valentine & Romance
 * - Mar/Apr: Spring & Family adventure
 * - May-Aug: Summer blockbusters & Action
 * - September: Autumn cozy mystery & drama
 */
export function getCurrentSeasonalTheme(): SeasonalTheme {
  const month = new Date().getMonth() + 1; // 1 to 12

  if (month === 10) {
    // October - Halloween
    return {
      id: 'halloween',
      title: '🎃 Halloween & Skräck: Kalla kårar',
      description: 'Kusliga rysare, monster och spökhistorier för mörka höstkvällar',
      iconType: 'sparkles',
      iconColor: 'text-orange-400',
      badge: 'Halloween-special',
      movieGenreId: 27, // Skräck (Horror)
      tvGenreId: 9648, // Mysterium (Mystery)
    };
  }

  if (month === 11 || month === 12) {
    // Nov/Dec - Christmas & Winter
    return {
      id: 'christmas',
      title: '🎄 Julstämning & Vintermys',
      description: 'Värmande julfilmer, familjeklassiker och mysiga äventyr i snön',
      iconType: 'sparkles',
      iconColor: 'text-red-400',
      badge: 'Jul & Vinter',
      movieGenreId: 10751, // Familj
      tvGenreId: 10751, // Familj / Drama
    };
  }

  if (month === 1 || month === 2) {
    // Jan/Feb - Valentine's / Romance
    return {
      id: 'romance',
      title: '❤️ Romantik & Stora känslor',
      description: 'Kärlek, passion och feelgood inför Alla hjärtans dag',
      iconType: 'sparkles',
      iconColor: 'text-rose-400',
      badge: 'Kärlekstema',
      movieGenreId: 10749, // Romantik
      tvGenreId: 18, // Drama
    };
  }

  if (month === 3 || month === 4) {
    // Mar/Apr - Spring & Easter
    return {
      id: 'spring',
      title: '🌱 Vårkänslor & Familjeäventyr',
      description: 'Fartfyllda äventyr och upplyftande berättelser för hela familjen',
      iconType: 'sparkles',
      iconColor: 'text-emerald-400',
      badge: 'Vårfavoriter',
      movieGenreId: 12, // Äventyr
      tvGenreId: 35, // Komedi
    };
  }

  if (month >= 5 && month <= 8) {
    // May-Aug - Summer blockbusters
    return {
      id: 'summer',
      title: '☀️ Sommarblockbusters & Action',
      description: 'Explosiv underhållning och storslagna äventyr för sommarkvällen',
      iconType: 'sparkles',
      iconColor: 'text-amber-400',
      badge: 'Sommarhett',
      movieGenreId: 28, // Action
      tvGenreId: 10759, // Action & Adventure
    };
  }

  // September (month 9) - Autumn cozy
  return {
    id: 'autumn',
    title: '🍂 Höstmys: Spännande berättelser',
    description: 'Kryp upp i soffan med mörka deckare och fängslande dramatik',
    iconType: 'sparkles',
    iconColor: 'text-amber-500',
    badge: 'Höstmys',
    movieGenreId: 53, // Thriller
    tvGenreId: 18, // Drama
  };
}

/**
 * Fetches Netflix-style curated category rows for movies
 */
export async function getCuratedMovieRows(): Promise<CuratedCategoryRow[]> {
  const seasonal = getCurrentSeasonalTheme();

  const [
    seasonalItems,
    actionItems,
    thrillerItems,
    romanceItems,
    comedyItems,
    sciFiItems,
    topRatedItems,
  ] = await Promise.all([
    // Seasonal theme
    discoverMedia({
      mediaType: 'movie',
      genreId: seasonal.movieGenreId,
      sortBy: seasonal.movieSortBy || 'popularity.desc',
      page: 1,
    }),
    // Action (28)
    discoverMedia({
      mediaType: 'movie',
      genreId: 28,
      sortBy: 'popularity.desc',
      page: 1,
    }),
    // Thriller & Kriminal (53)
    discoverMedia({
      mediaType: 'movie',
      genreId: 53,
      sortBy: 'popularity.desc',
      page: 1,
    }),
    // Romantik & Drama (10749)
    discoverMedia({
      mediaType: 'movie',
      genreId: 10749,
      sortBy: 'popularity.desc',
      page: 1,
    }),
    // Komedi (35)
    discoverMedia({
      mediaType: 'movie',
      genreId: 35,
      sortBy: 'popularity.desc',
      page: 1,
    }),
    // Sci-Fi (878)
    discoverMedia({
      mediaType: 'movie',
      genreId: 878,
      sortBy: 'popularity.desc',
      page: 1,
    }),
    // Topprankat
    discoverMedia({
      mediaType: 'movie',
      minRating: 7.8,
      sortBy: 'vote_average.desc',
      page: 1,
    }),
  ]);

  const rows: CuratedCategoryRow[] = [];

  // 1. Seasonal section
  if (seasonalItems.length > 0) {
    rows.push({
      id: seasonal.id,
      title: seasonal.title,
      description: seasonal.description,
      badge: seasonal.badge,
      iconType: seasonal.iconType,
      iconColor: seasonal.iconColor,
      items: seasonalItems,
    });
  }

  // 2. Action
  if (actionItems.length > 0) {
    rows.push({
      id: 'action',
      title: 'Adrenalin & Action',
      description: 'Hög puls, explosiva scener och storslagna äventyr',
      iconType: 'film',
      iconColor: 'text-[#E9A23B]',
      items: actionItems,
    });
  }

  // 3. Spännande thrillers & deckare
  if (thrillerItems.length > 0) {
    rows.push({
      id: 'thrillers',
      title: 'Spännande thrillers & deckare',
      description: 'Mörka gåtor, psykologiska mysterier och oväntade vändningar',
      iconType: 'film',
      iconColor: 'text-purple-400',
      items: thrillerItems,
    });
  }

  // 4. Romantiska draman
  if (romanceItems.length > 0) {
    rows.push({
      id: 'romance',
      title: 'Romantiska dramer & feelgood',
      description: 'Kärlekshistorier, relationer och varma känslor',
      iconType: 'sparkles',
      iconColor: 'text-rose-400',
      items: romanceItems,
    });
  }

  // 5. Komedier & skrattfest
  if (comedyItems.length > 0) {
    rows.push({
      id: 'comedy',
      title: 'Skrattfest & Komedier',
      description: 'Träffsäker humor och underhållning för hela gänget',
      iconType: 'sparkles',
      iconColor: 'text-emerald-400',
      items: comedyItems,
    });
  }

  // 6. Sci-Fi & Fantastiska världar
  if (sciFiItems.length > 0) {
    rows.push({
      id: 'scifi',
      title: 'Sci-Fi & Fantastiska världar',
      description: 'Framtidsvisioner, rymdäventyr och fascinerande koncept',
      iconType: 'film',
      iconColor: 'text-cyan-400',
      items: sciFiItems,
    });
  }

  // 7. Topprankade mästerverk
  if (topRatedItems.length > 0) {
    rows.push({
      id: 'top-rated',
      title: 'Topprankade mästerverk',
      description: 'Filmerna som hyllas allra mest av tittarna',
      badge: 'Höga betyg',
      iconType: 'sparkles',
      iconColor: 'text-[#E9A23B]',
      items: topRatedItems,
    });
  }

  return rows;
}

/**
 * Fetches Netflix-style curated category rows for series
 */
export async function getCuratedShowRows(): Promise<CuratedCategoryRow[]> {
  const seasonal = getCurrentSeasonalTheme();

  const [
    seasonalItems,
    crimeItems,
    dramaItems,
    sciFiItems,
    comedyItems,
    actionAdventureItems,
    topRatedItems,
  ] = await Promise.all([
    // Seasonal theme for TV
    discoverMedia({
      mediaType: 'tv',
      genreId: seasonal.tvGenreId,
      sortBy: seasonal.tvSortBy || 'popularity.desc',
      page: 1,
    }),
    // Kriminal & Mystery (80)
    discoverMedia({
      mediaType: 'tv',
      genreId: 80,
      sortBy: 'popularity.desc',
      page: 1,
    }),
    // Drama (18)
    discoverMedia({
      mediaType: 'tv',
      genreId: 18,
      sortBy: 'popularity.desc',
      page: 1,
    }),
    // Sci-Fi & Fantasy (10765)
    discoverMedia({
      mediaType: 'tv',
      genreId: 10765,
      sortBy: 'popularity.desc',
      page: 1,
    }),
    // Komedi (35)
    discoverMedia({
      mediaType: 'tv',
      genreId: 35,
      sortBy: 'popularity.desc',
      page: 1,
    }),
    // Action & Äventyr (10759)
    discoverMedia({
      mediaType: 'tv',
      genreId: 10759,
      sortBy: 'popularity.desc',
      page: 1,
    }),
    // Topprankat (vote_average >= 8.0)
    discoverMedia({
      mediaType: 'tv',
      minRating: 8.0,
      sortBy: 'vote_average.desc',
      page: 1,
    }),
  ]);

  const rows: CuratedCategoryRow[] = [];

  // 1. Seasonal section
  if (seasonalItems.length > 0) {
    rows.push({
      id: seasonal.id,
      title: seasonal.id === 'halloween' ? '👻 Kusliga serier & Mysterier' : seasonal.title,
      description: seasonal.id === 'halloween' ? 'Spöklika gåtor, rysliga mysterier och övernaturliga hemligheter' : seasonal.description,
      badge: seasonal.badge,
      iconType: seasonal.iconType,
      iconColor: seasonal.iconColor,
      items: seasonalItems,
    });
  }

  // 2. Spännande kriminalserier
  if (crimeItems.length > 0) {
    rows.push({
      id: 'crime',
      title: 'Spännande kriminalserier & deckare',
      description: 'Mysterier, mordutredningar och nagelbitande spänning',
      iconType: 'tv',
      iconColor: 'text-[#E9A23B]',
      items: crimeItems,
    });
  }

  // 3. Fängslande dramaserier
  if (dramaItems.length > 0) {
    rows.push({
      id: 'drama',
      title: 'Fängslande dramaserier',
      description: 'Starka karaktärer, djupa konflikter och gripande livsöden',
      iconType: 'tv',
      iconColor: 'text-indigo-400',
      items: dramaItems,
    });
  }

  // 4. Sci-Fi & Fantastiska världar
  if (sciFiItems.length > 0) {
    rows.push({
      id: 'scifi',
      title: 'Sci-Fi & Fantastiska världar',
      description: 'Episka universum, tidsresor och magiska världar',
      iconType: 'sparkles',
      iconColor: 'text-cyan-400',
      items: sciFiItems,
    });
  }

  // 5. Komediserier för skratt
  if (comedyItems.length > 0) {
    rows.push({
      id: 'comedy',
      title: 'Komediserier för skratt',
      description: 'Lättsam underhållning och serier som garanterar skratt',
      iconType: 'sparkles',
      iconColor: 'text-emerald-400',
      items: comedyItems,
    });
  }

  // 6. Action & Äventyr
  if (actionAdventureItems.length > 0) {
    rows.push({
      id: 'action',
      title: 'Action & Äventyr',
      description: 'Hjältar, uppdrag och full fart från första avsnittet',
      iconType: 'tv',
      iconColor: 'text-amber-500',
      items: actionAdventureItems,
    });
  }

  // 7. Topprankade serier
  if (topRatedItems.length > 0) {
    rows.push({
      id: 'top-rated',
      title: 'Topprankade serier',
      description: 'Serierna med allra högst betyg från tittarna',
      badge: 'Höga betyg',
      iconType: 'sparkles',
      iconColor: 'text-[#E9A23B]',
      items: topRatedItems,
    });
  }

  return rows;
}
