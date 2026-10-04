import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Star, Clock, Calendar, ArrowLeft, Film, Tv, Sparkles, UserCheck } from 'lucide-react';
import { getMediaDetails, getImageUrl, getBackdropUrl } from '@/lib/tmdb';
import { MediaType } from '@/lib/types';
import EpisodeTracker from '@/components/EpisodeTracker';
import WatchProvidersSection from '@/components/WatchProvidersSection';
import MediaActionsBar from '@/components/MediaActionsBar';
import MediaCard from '@/components/MediaCard';
import DetailBackButton from '@/components/DetailBackButton';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'Engelska',
  sv: 'Svenska',
  da: 'Danska',
  no: 'Norska',
  fi: 'Finska',
  fr: 'Franska',
  de: 'Tyska',
  es: 'Spanska',
  it: 'Italienska',
  ja: 'Japanska',
  ko: 'Koreanska',
  zh: 'Kinesiska',
  pt: 'Portugisiska',
  ru: 'Ryska',
  hi: 'Hindi',
};

const STATUS_NAMES: Record<string, string> = {
  Released: 'Släppt',
  Ended: 'Avslutad',
  'Returning Series': 'Pågående',
  'In Production': 'Under produktion',
  'Post Production': 'Efterproduktion',
  Planned: 'Planerad',
  Canceled: 'Nedlagd',
  Pilot: 'Pilot',
};

const COUNTRY_NAMES: Record<string, string> = {
  US: 'USA',
  SE: 'Sverige',
  GB: 'Storbritannien',
  DK: 'Danmark',
  NO: 'Norge',
  FI: 'Finland',
  FR: 'Frankrike',
  DE: 'Tyskland',
  ES: 'Spanien',
  IT: 'Italien',
  JP: 'Japan',
  KR: 'Sydkorea',
  CA: 'Kanada',
  AU: 'Australien',
};

function formatSwedishDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getRelativeDateLabel(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'idag';
    if (diffDays === 1) return 'imorgon';
    if (diffDays === 2) return 'i övermorgon';
    if (diffDays > 2 && diffDays <= 7) return `om ${diffDays} dagar`;
    if (diffDays > 7 && diffDays <= 30) return `om ${Math.round(diffDays / 7)} veckor`;
    return null;
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

export default async function MediaDetailPage({ params }: PageProps) {
  const { type, id } = await params;
  const mediaType = type === 'tv' ? 'tv' : 'movie';
  const numericId = parseInt(id, 10);

  if (isNaN(numericId)) {
    notFound();
  }

  const media = await getMediaDetails(mediaType, numericId);

  if (!media) {
    notFound();
  }

  const releaseYear =
    media.release_date?.slice(0, 4) || media.first_air_date?.slice(0, 4) || '';

  const trailer = media.videos?.[0];

  const nowMs = Date.now();

  // Find upcoming season if any
  const upcomingSeason = media.media_type === 'tv'
    ? media.seasons?.find((s) => {
        if (!s.air_date) return false;
        const d = new Date(s.air_date).getTime();
        return d > nowMs;
      })
    : null;

  // Next episode to air
  const nextEpisode = media.media_type === 'tv' ? media.next_episode_to_air : null;
  const nextEpisodeIsFuture = nextEpisode?.air_date
    ? new Date(nextEpisode.air_date).getTime() >= nowMs - (1000 * 60 * 60 * 24)
    : false;

  return (
    <div className="space-y-6 sm:space-y-8 md:space-y-10 pb-16 md:pb-8">
      {/* Back button */}
      <div>
        <DetailBackButton mediaType={mediaType} />
      </div>

      {/* Hero Backdrop Header */}
      <div className="relative rounded-3xl overflow-hidden border border-[#2B3443] bg-[#171C25] shadow-2xl">
        {/* Backdrop Image */}
        <div className="relative h-44 xs:h-52 sm:h-72 md:h-96 lg:h-[420px] w-full overflow-hidden">
          <img
            src={getBackdropUrl(media.backdrop_path, 'original')}
            alt={media.title}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#171C25] via-[#171C25]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171C25]/95 via-[#171C25]/50 to-transparent" />
        </div>

        {/* Content Box Overlapping Backdrop */}
        <div className="relative -mt-16 xs:-mt-24 sm:-mt-36 md:-mt-56 lg:-mt-64 p-4 sm:p-6 md:p-8 lg:p-10 z-10">

          {/* DESKTOP LAYOUT (md: and up): 2-Column Showcase */}
          <div className="hidden md:flex flex-row items-start gap-6 lg:gap-10">
            {/* Left Column: Poster + Actions + Quick Streaming info */}
            <div className="w-48 lg:w-64 flex-shrink-0 space-y-3.5">
              <div className="w-full aspect-[2/3] rounded-2xl overflow-hidden border border-[#2B3443] shadow-2xl bg-[#0F1218]">
                <img
                  src={getImageUrl(media.poster_path, 'w500')}
                  alt={media.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Action Buttons directly under poster */}
              <div className="w-full">
                <MediaActionsBar
                  tmdbId={media.id}
                  mediaType={media.media_type}
                  title={media.title}
                  posterPath={media.poster_path}
                  backdropPath={media.backdrop_path}
                  trailerVideo={trailer}
                />
              </div>
            </div>

            {/* Right Column: Title, Metadata, Tagline, Overview, Quick Facts */}
            <div className="flex-1 min-w-0 space-y-4 pt-1">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1E2531] border border-[#2B3443] text-xs font-semibold text-[#ECE9E3]">
                  {media.media_type === 'movie' ? (
                    <>
                      <Film className="w-3.5 h-3.5 text-[#E9A23B]" />
                      <span>Film</span>
                    </>
                  ) : (
                    <>
                      <Tv className="w-3.5 h-3.5 text-[#6FA98A]" />
                      <span>TV-Serie</span>
                    </>
                  )}
                </span>

                {releaseYear && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1E2531] border border-[#2B3443] text-xs text-[#8D97A8]">
                    <Calendar className="w-3.5 h-3.5 text-[#8D97A8]" />
                    <span>{releaseYear}</span>
                  </span>
                )}

                {media.runtime ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1E2531] border border-[#2B3443] text-xs text-[#8D97A8]">
                    <Clock className="w-3.5 h-3.5 text-[#8D97A8]" />
                    <span>{media.runtime} min</span>
                  </span>
                ) : null}

                {media.number_of_seasons ? (
                  <span className="px-2.5 py-1 rounded-full bg-[#1E2531] border border-[#2B3443] text-xs text-[#8D97A8]">
                    {media.number_of_seasons} {media.number_of_seasons === 1 ? 'säsong' : 'säsonger'}
                  </span>
                ) : null}

                {media.vote_average > 0 && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9A23B]/15 border border-[#E9A23B]/30 text-xs font-bold text-[#E9A23B]">
                    <Star className="w-3.5 h-3.5 fill-[#E9A23B]" />
                    <span>{media.vote_average.toFixed(1)}</span>
                    <span className="text-[#8D97A8] font-normal text-[11px]">({media.vote_count.toLocaleString('sv-SE')})</span>
                  </span>
                )}

                {media.status && STATUS_NAMES[media.status] && (
                  <span className="px-2.5 py-1 rounded-full bg-[#1E2531] border border-[#2B3443] text-xs font-medium text-[#8D97A8]">
                    {STATUS_NAMES[media.status]}
                  </span>
                )}

                {upcomingSeason && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9A23B]/15 border border-[#E9A23B]/40 text-xs font-bold text-[#E9A23B] shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-[#E9A23B]" />
                    <span>
                      Säsong {upcomingSeason.season_number} {getRelativeDateLabel(upcomingSeason.air_date) ? `kommer ${getRelativeDateLabel(upcomingSeason.air_date)}` : `släpps ${formatSwedishDate(upcomingSeason.air_date)}`}
                    </span>
                  </span>
                )}

                {!upcomingSeason && nextEpisode && nextEpisodeIsFuture && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9A23B]/15 border border-[#E9A23B]/40 text-xs font-bold text-[#E9A23B] shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-[#E9A23B]" />
                    <span>
                      S{nextEpisode.season_number} A{nextEpisode.episode_number} {getRelativeDateLabel(nextEpisode.air_date) ? `släpps ${getRelativeDateLabel(nextEpisode.air_date)}` : `sänds ${formatSwedishDate(nextEpisode.air_date)}`}
                    </span>
                  </span>
                )}
              </div>

              {/* Title & Tagline */}
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-5xl font-black text-[#ECE9E3] tracking-tight leading-tight">
                  {media.title}
                </h1>

                {media.original_title && media.original_title !== media.title && (
                  <p className="text-xs text-[#8D97A8] mt-1 italic">
                    Originaltitel: {media.original_title}
                  </p>
                )}

                {media.tagline && (
                  <p className="text-sm lg:text-base text-[#E9A23B] font-medium italic mt-2">
                    &ldquo;{media.tagline}&rdquo;
                  </p>
                )}
              </div>

              {/* Directors, Creators & Cast Highlights */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#8D97A8]">
                {media.directors && media.directors.length > 0 && (
                  <p>
                    <span className="text-[#8D97A8]/70">Regi:</span>{' '}
                    <strong className="text-[#ECE9E3] font-semibold">
                      {media.directors.map((d) => d.name).join(', ')}
                    </strong>
                  </p>
                )}
                {media.created_by && media.created_by.length > 0 && (
                  <p>
                    <span className="text-[#8D97A8]/70">Skapare:</span>{' '}
                    <strong className="text-[#ECE9E3] font-semibold">
                      {media.created_by.map((c) => c.name).join(', ')}
                    </strong>
                  </p>
                )}
                {media.credits?.cast && media.credits.cast.length > 0 && (
                  <p>
                    <span className="text-[#8D97A8]/70">I rollerna:</span>{' '}
                    <span className="text-[#ECE9E3]/90">
                      {media.credits.cast.slice(0, 3).map((a) => a.name).join(', ')}
                    </span>
                  </p>
                )}
              </div>

              {/* Genres */}
              {media.genres && media.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {media.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-2.5 py-1 rounded-xl bg-[#1E2531] border border-[#2B3443] text-xs text-[#8D97A8] font-medium hover:text-[#ECE9E3] transition-colors"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Handling (Overview) - Fills the central desktop canvas */}
              <div className="pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8D97A8] mb-1.5">
                  Handling
                </h3>
                <p className="text-[#ECE9E3]/90 text-sm lg:text-base leading-relaxed max-w-3xl">
                  {media.overview || 'Ingen handling tillgänglig på svenska.'}
                </p>
              </div>

              {/* Quick Facts Strip */}
              <div className="pt-3 border-t border-[#2B3443]/70 grid grid-cols-2 lg:grid-cols-4 gap-2.5 max-w-2xl">
                {media.origin_country?.[0] && (
                  <div className="p-2.5 rounded-xl bg-[#0F1218]/50 border border-[#2B3443]/60">
                    <span className="text-[10px] uppercase font-semibold text-[#8D97A8] block">Land</span>
                    <span className="text-xs font-bold text-[#ECE9E3]">
                      {COUNTRY_NAMES[media.origin_country[0]] || media.origin_country[0]}
                    </span>
                  </div>
                )}
                {media.original_language && (
                  <div className="p-2.5 rounded-xl bg-[#0F1218]/50 border border-[#2B3443]/60">
                    <span className="text-[10px] uppercase font-semibold text-[#8D97A8] block">Språk</span>
                    <span className="text-xs font-bold text-[#ECE9E3]">
                      {LANGUAGE_NAMES[media.original_language] || media.original_language.toUpperCase()}
                    </span>
                  </div>
                )}
                {(media.release_date || media.first_air_date) && (
                  <div className="p-2.5 rounded-xl bg-[#0F1218]/50 border border-[#2B3443]/60">
                    <span className="text-[10px] uppercase font-semibold text-[#8D97A8] block">Premiär</span>
                    <span className="text-xs font-bold text-[#ECE9E3]">
                      {formatSwedishDate(media.release_date || media.first_air_date)}
                    </span>
                  </div>
                )}
                {media.number_of_episodes ? (
                  <div className="p-2.5 rounded-xl bg-[#0F1218]/50 border border-[#2B3443]/60">
                    <span className="text-[10px] uppercase font-semibold text-[#8D97A8] block">Avsnitt</span>
                    <span className="text-xs font-bold text-[#ECE9E3]">
                      {media.number_of_episodes} st
                    </span>
                  </div>
                ) : media.runtime ? (
                  <div className="p-2.5 rounded-xl bg-[#0F1218]/50 border border-[#2B3443]/60">
                    <span className="text-[10px] uppercase font-semibold text-[#8D97A8] block">Längd</span>
                    <span className="text-xs font-bold text-[#ECE9E3]">
                      {Math.floor(media.runtime / 60)}h {media.runtime % 60}m
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* MOBILE LAYOUT (< md:): Compact, readable, thumb-friendly */}
          <div className="md:hidden space-y-4">
            {/* Top row: Poster + Title and Badges side by side */}
            <div className="flex items-start gap-3.5">
              <div className="w-24 xs:w-28 sm:w-36 aspect-[2/3] rounded-2xl overflow-hidden border border-[#2B3443] shadow-xl bg-[#0F1218] flex-shrink-0">
                <img
                  src={getImageUrl(media.poster_path, 'w500')}
                  alt={media.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-[#1E2531] border border-[#2B3443] text-[10px] font-semibold text-[#ECE9E3]">
                    {media.media_type === 'movie' ? 'Film' : 'Serie'}
                  </span>
                  {releaseYear && (
                    <span className="px-2 py-0.5 rounded-full bg-[#1E2531] border border-[#2B3443] text-[10px] text-[#8D97A8]">
                      {releaseYear}
                    </span>
                  )}
                  {media.vote_average > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E9A23B]/15 border border-[#E9A23B]/30 text-[10px] font-bold text-[#E9A23B]">
                      <Star className="w-3 h-3 fill-[#E9A23B]" />
                      <span>{media.vote_average.toFixed(1)}</span>
                    </span>
                  )}
                </div>

                <h1 className="text-lg xs:text-xl sm:text-2xl font-black text-[#ECE9E3] leading-tight">
                  {media.title}
                </h1>

                {media.tagline && (
                  <p className="text-xs text-[#E9A23B] font-medium italic mt-1 line-clamp-2">
                    &ldquo;{media.tagline}&rdquo;
                  </p>
                )}

                {(media.directors || media.created_by) && (
                  <p className="text-[11px] text-[#8D97A8] mt-1 line-clamp-1">
                    <span className="text-[#8D97A8]/70">
                      {media.directors ? 'Regi:' : 'Skapare:'}
                    </span>{' '}
                    <span className="text-[#ECE9E3] font-medium">
                      {(media.directors || media.created_by)!.map((p) => p.name).join(', ')}
                    </span>
                  </p>
                )}

                {/* Genres */}
                {media.genres && media.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {media.genres.slice(0, 3).map((genre) => (
                      <span
                        key={genre.id}
                        className="px-2 py-0.5 rounded-md bg-[#1E2531] border border-[#2B3443] text-[10px] text-[#8D97A8] font-medium"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar across full width on mobile */}
            <div className="pt-2">
              <MediaActionsBar
                tmdbId={media.id}
                mediaType={media.media_type}
                title={media.title}
                posterPath={media.poster_path}
                backdropPath={media.backdrop_path}
                trailerVideo={trailer}
              />
            </div>

            {/* Handling on Mobile */}
            <div className="pt-2 border-t border-[#2B3443]/70">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8D97A8] mb-1">
                Handling
              </h3>
              <p className="text-[#ECE9E3] text-xs sm:text-sm leading-relaxed">
                {media.overview || 'Ingen handling tillgänglig på svenska.'}
              </p>
            </div>

            {/* Quick Facts Chips on Mobile */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {media.origin_country?.[0] && (
                <div className="p-2 rounded-xl bg-[#0F1218]/60 border border-[#2B3443]/60">
                  <span className="text-[9px] uppercase font-semibold text-[#8D97A8] block">Land</span>
                  <span className="text-xs font-bold text-[#ECE9E3]">
                    {COUNTRY_NAMES[media.origin_country[0]] || media.origin_country[0]}
                  </span>
                </div>
              )}
              {media.original_language && (
                <div className="p-2 rounded-xl bg-[#0F1218]/60 border border-[#2B3443]/60">
                  <span className="text-[9px] uppercase font-semibold text-[#8D97A8] block">Språk</span>
                  <span className="text-xs font-bold text-[#ECE9E3]">
                    {LANGUAGE_NAMES[media.original_language] || media.original_language.toUpperCase()}
                  </span>
                </div>
              )}
              {media.runtime ? (
                <div className="p-2 rounded-xl bg-[#0F1218]/60 border border-[#2B3443]/60">
                  <span className="text-[9px] uppercase font-semibold text-[#8D97A8] block">Längd</span>
                  <span className="text-xs font-bold text-[#ECE9E3]">{media.runtime} min</span>
                </div>
              ) : media.number_of_seasons ? (
                <div className="p-2 rounded-xl bg-[#0F1218]/60 border border-[#2B3443]/60">
                  <span className="text-[9px] uppercase font-semibold text-[#8D97A8] block">Säsonger</span>
                  <span className="text-xs font-bold text-[#ECE9E3]">{media.number_of_seasons} st</span>
                </div>
              ) : null}
              {media.status && STATUS_NAMES[media.status] && (
                <div className="p-2 rounded-xl bg-[#0F1218]/60 border border-[#2B3443]/60">
                  <span className="text-[9px] uppercase font-semibold text-[#8D97A8] block">Status</span>
                  <span className="text-xs font-bold text-[#ECE9E3] truncate block">
                    {STATUS_NAMES[media.status]}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Upcoming season or episode highlight card */}
      {media.media_type === 'tv' && (upcomingSeason || (nextEpisode && nextEpisodeIsFuture)) && (
        <section className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#171C25] via-[#1E2531] to-[#171C25] border border-[#E9A23B]/35 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#E9A23B]/15 text-[#E9A23B] border border-[#E9A23B]/30 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0 shadow-inner">
              <Sparkles className="w-5 h-5 fill-[#E9A23B]/20" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black text-[#E9A23B] tracking-wider px-2 py-0.5 rounded-md bg-[#E9A23B]/15 border border-[#E9A23B]/30">
                  {upcomingSeason ? 'Kommande säsong' : 'Kommande avsnitt'}
                </span>
                {nextEpisode?.name && !upcomingSeason && (
                  <span className="text-xs text-[#8D97A8] truncate max-w-[200px] sm:max-w-xs">&ldquo;{nextEpisode.name}&rdquo;</span>
                )}
              </div>
              <p className="text-sm sm:text-base font-bold text-[#ECE9E3] mt-1">
                {upcomingSeason ? (
                  <>
                    Säsong {upcomingSeason.season_number}{' '}
                    <span className="text-[#E9A23B]">
                      {getRelativeDateLabel(upcomingSeason.air_date)
                        ? `har premiär ${getRelativeDateLabel(upcomingSeason.air_date)}`
                        : `släpps ${formatSwedishDate(upcomingSeason.air_date)}`}
                    </span>
                    {upcomingSeason.episode_count ? ` (${upcomingSeason.episode_count} nya avsnitt)` : ''}
                  </>
                ) : (
                  <>
                    Säsong {nextEpisode!.season_number}, Avsnitt {nextEpisode!.episode_number}{' '}
                    <span className="text-[#E9A23B]">
                      {getRelativeDateLabel(nextEpisode!.air_date)
                        ? `sänds ${getRelativeDateLabel(nextEpisode!.air_date)}`
                        : `sänds den ${formatSwedishDate(nextEpisode!.air_date)}`}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="text-xs text-[#ECE9E3] flex items-center gap-2 self-start sm:self-auto bg-[#0F1218]/80 px-3.5 py-2 rounded-2xl border border-[#2B3443] flex-shrink-0">
            <Calendar className="w-4 h-4 text-[#E9A23B]" />
            <span className="font-semibold">{formatSwedishDate(upcomingSeason?.air_date || nextEpisode?.air_date)}</span>
          </div>
        </section>
      )}

      {/* Swedish Watch Providers (Stream, Hyr, Köp) */}
      <WatchProvidersSection providers={media.streaming_info} />

      {/* Episode Tracker if TV Show */}
      {media.media_type === 'tv' && media.seasons && media.seasons.length > 0 && (
        <section>
          <EpisodeTracker
            showId={media.id}
            showTitle={media.title}
            posterPath={media.poster_path}
            backdropPath={media.backdrop_path}
            seasons={media.seasons}
          />
        </section>
      )}

      {/* Cast Section */}
      {media.credits?.cast && media.credits.cast.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#E9A23B]" />
            <h2 className="text-lg md:text-xl font-bold text-[#ECE9E3] tracking-tight">
              Skådespelare
            </h2>
          </div>

          <div className="flex overflow-x-auto gap-3 pb-3 scrollbar-none sm:grid sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 sm:overflow-visible snap-x">
            {media.credits.cast.map((actor) => (
              <div
                key={actor.id}
                className="w-28 sm:w-auto flex-shrink-0 p-3 rounded-2xl bg-[#171C25] border border-[#2B3443] text-center flex flex-col items-center shadow-sm snap-start"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden bg-[#1E2531] mb-2 border border-[#2B3443]">
                  <img
                    src={getImageUrl(actor.profile_path, 'w300')}
                    alt={actor.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="text-xs font-semibold text-[#ECE9E3] truncate w-full">
                  {actor.name}
                </h4>
                <p className="text-[11px] text-[#8D97A8] truncate w-full mt-0.5">
                  {actor.character}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations Section */}
      {media.recommendations && media.recommendations.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-[#2B3443]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#E9A23B]" />
            <h2 className="text-lg md:text-xl font-bold text-[#ECE9E3] tracking-tight">
              Liknande titlar du kanske gillar
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {media.recommendations.map((item) => (
              <MediaCard key={`rec-${item.id}`} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
