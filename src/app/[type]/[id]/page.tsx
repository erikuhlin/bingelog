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
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171C25] hover:bg-[#1E2531] text-xs font-semibold text-[#8D97A8] hover:text-[#ECE9E3] border border-[#2B3443] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Tillbaka till översikten</span>
        </Link>
      </div>

      {/* Hero Backdrop Header */}
      <div className="relative rounded-3xl overflow-hidden border border-[#2B3443] bg-[#171C25] shadow-2xl">
        {/* Backdrop Image */}
        <div className="relative h-44 xs:h-52 sm:h-72 md:h-96 w-full">
          <img
            src={getBackdropUrl(media.backdrop_path, 'original')}
            alt={media.title}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#171C25] via-[#171C25]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171C25]/90 via-[#171C25]/40 to-transparent" />
        </div>

        {/* Content Box Overlapping Backdrop */}
        <div className="relative -mt-16 xs:-mt-24 sm:-mt-32 md:-mt-40 p-4 sm:p-6 md:p-8 z-10">
          {/* Top Section: Poster + Main Info (Side by side on both mobile & desktop) */}
          <div className="flex flex-row items-start gap-3.5 sm:gap-6 md:gap-8">
            {/* Poster */}
            <div className="w-24 xs:w-28 sm:w-44 md:w-56 aspect-[2/3] rounded-2xl overflow-hidden border border-[#2B3443] shadow-2xl bg-[#0F1218] flex-shrink-0">
              <img
                src={getImageUrl(media.poster_path, 'w500')}
                alt={media.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title & Metadata */}
            <div className="flex-1 min-w-0 flex flex-col justify-end pt-0.5 sm:pt-4">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <span className="flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full bg-[#1E2531] border border-[#2B3443] text-[10px] sm:text-xs font-semibold text-[#ECE9E3]">
                  {media.media_type === 'movie' ? (
                    <>
                      <Film className="w-3 h-3 text-[#E9A23B]" />
                      <span>Film</span>
                    </>
                  ) : (
                    <>
                      <Tv className="w-3 h-3 text-[#6FA98A]" />
                      <span>TV-Serie</span>
                    </>
                  )}
                </span>

                {releaseYear && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full bg-[#1E2531] border border-[#2B3443] text-[10px] sm:text-xs text-[#8D97A8]">
                    <Calendar className="w-3 h-3 text-[#8D97A8]" />
                    <span>{releaseYear}</span>
                  </span>
                )}

                {media.runtime ? (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full bg-[#1E2531] border border-[#2B3443] text-[10px] sm:text-xs text-[#8D97A8]">
                    <Clock className="w-3 h-3 text-[#8D97A8]" />
                    <span>{media.runtime} min</span>
                  </span>
                ) : null}

                {media.number_of_seasons ? (
                  <span className="px-2.5 py-0.5 sm:py-1 rounded-full bg-[#1E2531] border border-[#2B3443] text-[10px] sm:text-xs text-[#8D97A8]">
                    {media.number_of_seasons} {media.number_of_seasons === 1 ? 'säsong' : 'säsonger'}
                  </span>
                ) : null}

                {media.vote_average > 0 && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full bg-[#E9A23B]/15 border border-[#E9A23B]/30 text-[10px] sm:text-xs font-bold text-[#E9A23B]">
                    <Star className="w-3 h-3 fill-[#E9A23B]" />
                    <span>{media.vote_average.toFixed(1)}</span>
                    <span className="text-[#8D97A8] font-normal hidden xs:inline">({media.vote_count})</span>
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-lg xs:text-xl sm:text-3xl md:text-5xl font-black text-[#ECE9E3] tracking-tight leading-tight">
                {media.title}
              </h1>

              {media.original_title && media.original_title !== media.title && (
                <p className="text-[11px] sm:text-xs text-[#8D97A8] mt-0.5 italic truncate">
                  Originaltitel: {media.original_title}
                </p>
              )}

              {/* Creator / Director info */}
              {(media.directors || media.created_by) && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-[11px] sm:text-xs text-[#8D97A8]">
                  {media.directors && media.directors.length > 0 && (
                    <p>
                      <span className="text-[#8D97A8]/70">Regi:</span>{' '}
                      <strong className="text-[#ECE9E3] font-medium">
                        {media.directors.map((d) => d.name).join(', ')}
                      </strong>
                    </p>
                  )}
                  {media.created_by && media.created_by.length > 0 && (
                    <p>
                      <span className="text-[#8D97A8]/70">Skapare:</span>{' '}
                      <strong className="text-[#ECE9E3] font-medium">
                        {media.created_by.map((c) => c.name).join(', ')}
                      </strong>
                    </p>
                  )}
                </div>
              )}

              {/* Genres */}
              {media.genres && media.genres.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {media.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-2 py-0.5 rounded-lg bg-[#1E2531] border border-[#2B3443] text-[10px] sm:text-xs text-[#8D97A8] font-medium"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Bar (Buttons) */}
          <div className="mt-4 sm:mt-6 pt-3.5 sm:pt-4 border-t border-[#2B3443]">
            <MediaActionsBar
              tmdbId={media.id}
              mediaType={media.media_type}
              title={media.title}
              posterPath={media.poster_path}
              backdropPath={media.backdrop_path}
              trailerVideo={trailer}
            />
          </div>

          {/* Tagline & Overview */}
          <div className="mt-4 pt-3.5 sm:pt-4 border-t border-[#2B3443]">
            {media.tagline && (
              <p className="text-xs sm:text-sm text-[#E9A23B] font-medium italic mb-2">
                &ldquo;{media.tagline}&rdquo;
              </p>
            )}
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8D97A8] mb-1.5">
              Handling
            </h3>
            <p className="text-[#ECE9E3] text-xs sm:text-sm leading-relaxed max-w-3xl">
              {media.overview}
            </p>
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
