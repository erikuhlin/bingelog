import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Star, Clock, Calendar, ArrowLeft, Film, Tv } from 'lucide-react';
import { getMediaDetails, getImageUrl, getBackdropUrl } from '@/lib/tmdb';
import { MediaType } from '@/lib/types';
import StatusSelector from '@/components/StatusSelector';
import EpisodeTracker from '@/components/EpisodeTracker';

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

  return (
    <div className="space-y-10">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Tillbaka till översikten</span>
      </Link>

      {/* Hero Backdrop Header */}
      <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl">
        {/* Backdrop Image */}
        <div className="relative h-[340px] md:h-[460px] w-full">
          <img
            src={getBackdropUrl(media.backdrop_path, 'original')}
            alt={media.title}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/40 to-transparent" />
        </div>

        {/* Content Box Overlapping Backdrop */}
        <div className="relative -mt-36 md:-mt-44 p-6 md:p-10 flex flex-col md:flex-row items-start gap-8 z-10">
          {/* Poster */}
          <div className="w-44 md:w-56 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-zinc-700/80 shadow-2xl bg-zinc-950 flex-shrink-0">
            <img
              src={getImageUrl(media.poster_path, 'w500')}
              alt={media.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-700 text-xs font-semibold text-zinc-200">
                {media.media_type === 'movie' ? (
                  <>
                    <Film className="w-3.5 h-3.5 text-rose-500" />
                    <span>Film</span>
                  </>
                ) : (
                  <>
                    <Tv className="w-3.5 h-3.5 text-sky-400" />
                    <span>TV-Serie</span>
                  </>
                )}
              </span>

              {releaseYear && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{releaseYear}</span>
                </span>
              )}

              {media.runtime ? (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{media.runtime} min</span>
                </span>
              ) : null}

              {media.number_of_seasons ? (
                <span className="px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300">
                  {media.number_of_seasons} {media.number_of_seasons === 1 ? 'säsong' : 'säsonger'}
                </span>
              ) : null}

              {media.vote_average > 0 && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{media.vote_average.toFixed(1)}</span>
                  <span className="text-zinc-500 font-normal">({media.vote_count})</span>
                </span>
              )}
            </div>

            {/* Title & Tagline */}
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {media.title}
            </h1>

            {media.original_title && media.original_title !== media.title && (
              <p className="text-sm text-zinc-400 mt-1 italic">
                Originaltitel: {media.original_title}
              </p>
            )}

            {media.tagline && (
              <p className="text-sm md:text-base text-rose-400 font-medium mt-2">
                &ldquo;{media.tagline}&rdquo;
              </p>
            )}

            {/* Genres */}
            {media.genres && media.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {media.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800/80 text-xs text-zinc-300 font-medium"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            <div className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Handling
              </h3>
              <p className="text-zinc-300 text-sm md:text-base leading-relaxed">
                {media.overview}
              </p>
            </div>

            {/* Actions & Rating */}
            <div className="mt-6 pt-6 border-t border-zinc-800 flex flex-wrap items-center gap-4">
              <StatusSelector
                tmdbId={media.id}
                mediaType={media.media_type}
                title={media.title}
                posterPath={media.poster_path}
                backdropPath={media.backdrop_path}
                showRating={true}
              />
            </div>
          </div>
        </div>
      </div>

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
        <section>
          <h2 className="text-xl font-bold text-white tracking-tight mb-4">
            Skådespelare
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {media.credits.cast.map((actor) => (
              <div
                key={actor.id}
                className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 mb-2.5 border border-zinc-700">
                  <img
                    src={getImageUrl(actor.profile_path, 'w300')}
                    alt={actor.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="text-xs font-semibold text-zinc-100 truncate w-full">
                  {actor.name}
                </h4>
                <p className="text-[11px] text-zinc-400 truncate w-full mt-0.5">
                  {actor.character}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
