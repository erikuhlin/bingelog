'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Frown } from 'lucide-react';
import { MediaItem, MediaType } from '@/lib/types';
import MediaCard from './MediaCard';
import ProviderFilterTabs from './ProviderFilterTabs';
import AdvancedFilterBar from './AdvancedFilterBar';
import { SWEDISH_STREAMING_PROVIDERS } from '@/lib/tmdb';

interface ExploreFeedProps {
  initialTrending: MediaItem[];
  defaultMediaType?: 'all' | MediaType;
  title?: string;
}

export default function ExploreFeed({
  initialTrending,
  defaultMediaType = 'all',
  title,
}: ExploreFeedProps) {
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [mediaType, setMediaType] = useState<'all' | MediaType>(defaultMediaType);
  const [genreId, setGenreId] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('popularity.desc');

  const [items, setItems] = useState<MediaItem[]>(initialTrending);
  const [loading, setLoading] = useState(false);

  const isFiltered =
    selectedProviderId !== null ||
    mediaType !== defaultMediaType ||
    genreId !== null ||
    minRating !== null ||
    sortBy !== 'popularity.desc';

  const activeFilterCount =
    (selectedProviderId ? 1 : 0) +
    (mediaType !== 'all' ? 1 : 0) +
    (genreId ? 1 : 0) +
    (minRating ? 1 : 0) +
    (sortBy !== 'popularity.desc' ? 1 : 0);

  const handleReset = () => {
    setSelectedProviderId(null);
    setMediaType('all');
    setGenreId(null);
    setMinRating(null);
    setSortBy('popularity.desc');
  };

  useEffect(() => {
    if (!isFiltered) {
      setItems(initialTrending);
      return;
    }

    let isMounted = true;
    const fetchFiltered = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (mediaType !== 'all') params.set('mediaType', mediaType);
        if (selectedProviderId) params.set('providerId', String(selectedProviderId));
        if (genreId) params.set('genreId', String(genreId));
        if (minRating) params.set('minRating', String(minRating));
        if (sortBy) params.set('sortBy', sortBy);

        const res = await fetch(`/api/discover?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setItems(data.results || []);
          }
        }
      } catch (err) {
        console.error('Failed to load discover items:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFiltered();

    return () => {
      isMounted = false;
    };
  }, [selectedProviderId, mediaType, genreId, minRating, sortBy, isFiltered, initialTrending]);

  const selectedProviderName = selectedProviderId
    ? SWEDISH_STREAMING_PROVIDERS.find((p) => p.id === selectedProviderId)?.name
    : null;

  return (
    <section className="mb-14 space-y-6">
      {/* Streaming Provider Quick Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Filtrera efter streamingtjänst
          </span>
          {selectedProviderName && (
            <span className="text-xs font-semibold text-rose-400">
              Visar titlar på {selectedProviderName}
            </span>
          )}
        </div>

        <ProviderFilterTabs
          selectedProviderId={selectedProviderId}
          onSelectProvider={setSelectedProviderId}
        />
      </div>

      {/* Advanced Filter Bar */}
      <AdvancedFilterBar
        mediaType={mediaType}
        onMediaTypeChange={setMediaType}
        genreId={genreId}
        onGenreChange={setGenreId}
        minRating={minRating}
        onMinRatingChange={setMinRating}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onReset={handleReset}
        activeFilterCount={activeFilterCount}
      />

      {/* Title & Results count */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-rose-500" />
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            {selectedProviderName
              ? `Populärt på ${selectedProviderName}`
              : isFiltered
              ? 'Filtrerade titlar'
              : title || 'Trendar i veckan'}
          </h2>
        </div>
        {isFiltered && (
          <span className="text-xs text-zinc-400 font-medium">
            {items.length} titlar hittades
          </span>
        )}
      </div>

      {/* Content Grid / Loading */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          <span className="text-xs font-medium">Hämtar titlar från streamingtjänster...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30">
          <Frown className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-200">Inga titlar matchade dina filter</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
            Testa att sänka betyget eller byta streamingtjänst för att se fler resultat.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
          >
            Återställ filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((item) => (
            <MediaCard key={`feed-${item.media_type}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
