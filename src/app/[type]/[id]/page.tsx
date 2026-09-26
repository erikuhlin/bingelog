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

              {/* Quick Streaming Service badges under poster if available */}
              {media.streaming_info?.flatrate && media.streaming_info.flatrate.length > 0 && (
                <div className="p-3 rounded-2xl bg-[#0F1218]/70 border border-[#2B3443] space-y-2 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6FA98A] flex items-center gap-1">
                    <Tv className="w-3.5 h-3.5 text-[#6FA98A]" />
                    <span>Streama i Sverige</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {media.streaming_info.flatrate.slice(0, 4).map((p) => (
                      <div
                        key={p.provider_id}
                        title={p.provider_name}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#1E2531] border border-[#2B3443] text-[10px] font-semibold text-[#ECE9E3] shadow-sm"
                      >
                        <img
                          src={getImageUrl(p.logo_path, 'w300')}
                          alt={p.provider_name}
                          className="w-3.5 h-3.5 rounded object-cover"
                        />
                        <span className="truncate max-w-[80px]">{p.provider_name}</span>
                      </div>
                    ))}
                    {media.streaming_info.flatrate.length > 4 && (
                      <span className="text-[10px] font-bold text-[#8D97A8] px-1.5 py-0.5 rounded bg-[#1E2531]">
                        +{media.streaming_info.flatrate.length - 4} till
                      </span>
                    )}
                  </div>
                </div>
              )}
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

            {/* Quick Streaming info on mobile if available */}
            {media.streaming_info?.flatrate && media.streaming_info.flatrate.length > 0 && (
              <div className="p-3 rounded-2xl bg-[#0F1218]/60 border border-[#2B3443] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-bold text-[#6FA98A] uppercase tracking-wide flex-shrink-0">
                    Finns på:
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                    {media.streaming_info.flatrate.slice(0, 3).map((p) => (
                      <div
                        key={p.provider_id}
                        title={p.provider_name}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1E2531] border border-[#2B3443] text-[10px] text-[#ECE9E3] flex-shrink-0"
                      >
                        <img
                          src={getImageUrl(p.logo_path, 'w300')}
                          alt={p.provider_name}
                          className="w-3.5 h-3.5 rounded object-cover"
                        />
                        <span className="truncate max-w-[65px]">{p.provider_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
