'use client';

import React, { useState } from 'react';
import {
  Film,
  Tv,
  Ticket,
  ShoppingBag,
  Sparkles,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { MediaItem, MovieMonetizationFilter } from '@/lib/types';
import { CuratedCategoryRow } from '@/lib/seasonal';
import { SWEDISH_STREAMING_PROVIDERS } from '@/lib/tmdb';
import ProviderFilterTabs from './ProviderFilterTabs';
import StreamingNewsRow from './StreamingNewsRow';
import HorizontalMediaRow from './HorizontalMediaRow';
import ExploreFeed from './ExploreFeed';

interface MoviesPageContentProps {
  popularMovies: MediaItem[];
  initialNewReleases: MediaItem[];
  theatricalMovies: MediaItem[];
  rentBuyMovies: MediaItem[];
  upcomingMovies: MediaItem[];
  curatedRows: CuratedCategoryRow[];
}

export default function MoviesPageContent({
  popularMovies,
  initialNewReleases,
  theatricalMovies,
  rentBuyMovies,
  upcomingMovies,
  curatedRows,
}: MoviesPageContentProps) {
  const [selectedProviderIds, setSelectedProviderIds] = useState<number[]>([]);
  const [monetizationType, setMonetizationType] = useState<MovieMonetizationFilter>('all');

  const selectedProviderNames = selectedProviderIds
    .map((id) => SWEDISH_STREAMING_PROVIDERS.find((p) => p.id === id)?.name)
    .filter(Boolean) as string[];

  const handleSelectMonetization = (type: MovieMonetizationFilter) => {
    setMonetizationType(type);
    if (type === 'theatrical' || type === 'rent_buy') {
      setSelectedProviderIds([]);
    }
  };

  const handleSelectProviders = (ids: number[]) => {
    setSelectedProviderIds(ids);
    if (ids.length > 0 && (monetizationType === 'theatrical' || monetizationType === 'rent_buy')) {
      setMonetizationType('flatrate');
    }
  };

  const isStreamingRelevant = monetizationType === 'all' || monetizationType === 'flatrate';
  const isOverviewMode = monetizationType === 'all' && selectedProviderIds.length === 0;

  return (
    <div className="space-y-8 sm:space-y-10 w-full max-w-full overflow-hidden">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#ECE9E3] tracking-tight flex items-center gap-3">
          <Film className="w-7 h-7 sm:w-8 sm:h-8 text-[#E9A23B]" />
          <span>Utforska Filmer</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#8D97A8] mt-1.5 max-w-2xl leading-relaxed">
          Se färska nyheter på dina streamingtjänster, bioaktuella premiärer, hyr- & köpfilmer och utforska hela filmkatalogen.
        </p>
      </div>

      {/* Top Filter Panel: Visningsform (Alla / Streama / Bioaktuella / Hyr & Köp) + Streamingtjänster */}
      <div className="p-3.5 sm:p-5 rounded-3xl bg-[#171C25]/80 border border-[#2B3443] space-y-4">
        {/* Row 1: Availability / Monetization Mode Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => handleSelectMonetization('all')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                monetizationType === 'all'
                  ? 'bg-[#E9A23B] text-[#0F1218] shadow-lg shadow-[#E9A23B]/25'
                  : 'bg-[#0F1218]/70 text-[#8D97A8] hover:text-[#ECE9E3] border border-[#2B3443]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Alla filmer</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMonetization('flatrate')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                monetizationType === 'flatrate'
                  ? 'bg-[#E9A23B] text-[#0F1218] shadow-lg shadow-[#E9A23B]/25'
                  : 'bg-[#0F1218]/70 text-[#8D97A8] hover:text-[#ECE9E3] border border-[#2B3443]'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Streama</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMonetization('theatrical')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                monetizationType === 'theatrical'
                  ? 'bg-[#E9A23B] text-[#0F1218] shadow-lg shadow-[#E9A23B]/25'
                  : 'bg-[#0F1218]/70 text-[#8D97A8] hover:text-[#ECE9E3] border border-[#2B3443]'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Bioaktuella</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMonetization('rent_buy')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                monetizationType === 'rent_buy'
                  ? 'bg-[#E9A23B] text-[#0F1218] shadow-lg shadow-[#E9A23B]/25'
                  : 'bg-[#0F1218]/70 text-[#8D97A8] hover:text-[#ECE9E3] border border-[#2B3443]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Hyr & Köp</span>
            </button>
          </div>

          {(selectedProviderIds.length > 0 || monetizationType !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSelectedProviderIds([]);
                setMonetizationType('all');
              }}
              className="flex items-center gap-1 text-xs font-semibold text-[#8D97A8] hover:text-[#E9A23B] transition-colors self-start sm:self-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Återställ vy</span>
            </button>
          )}
        </div>

        {/* Row 2: Streaming Provider Selector (visible when Alla or Streama is active) */}
        {isStreamingRelevant && (
          <div className="pt-2 border-t border-[#2B3443]/60 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-[#8D97A8] uppercase tracking-wider">
                Streamingtjänster {selectedProviderNames.length > 0 ? `• ${selectedProviderNames.join(', ')}` : '(Samtliga)'}
              </span>
            </div>
            <ProviderFilterTabs
              selectedProviderIds={selectedProviderIds}
              onSelectProvider={handleSelectProviders}
            />
          </div>
        )}
      </div>

      {/* 1. Top Horizontal Row: "Nya filmer på streaming" (when Alla or Streama is active) */}
      {isStreamingRelevant && (
        <StreamingNewsRow
          initialItems={initialNewReleases}
          selectedProviderIds={selectedProviderIds}
          defaultMediaType="movie"
        />
      )}

      {/* 2. Overview Sections (Bioaktuella, Hyr & Köp, Kommande, Kategorier) when in full overview */}
      {isOverviewMode && (
        <>
          {/* Bioaktuella filmer */}
          {theatricalMovies.length > 0 && (
            <div className="relative">
              <HorizontalMediaRow
                title="Bioaktuella filmer"
                description="Filmer som går på bio i Sverige just nu"
                badge="På bio nu"
                iconType="film"
                iconColor="text-[#E9A23B]"
                items={theatricalMovies}
              />
              <div className="-mt-6 mb-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSelectMonetization('theatrical')}
                  className="text-xs font-semibold text-[#E9A23B] hover:text-[#F2B04E] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Utforska alla bioaktuella filmer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Nytt att hyra & köpa */}
          {rentBuyMovies.length > 0 && (
            <div className="relative">
              <HorizontalMediaRow
                title="Nytt på Hyr & Köp"
                description="Nya filmer tillgängliga att hyra eller köpa digitalt (Apple TV, SF Anytime, Viaplay m.fl.)"
                badge="Hyr & Köp"
                iconType="sparkles"
                iconColor="text-sky-400"
                items={rentBuyMovies}
              />
              <div className="-mt-6 mb-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSelectMonetization('rent_buy')}
                  className="text-xs font-semibold text-[#E9A23B] hover:text-[#F2B04E] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Utforska alla hyr- & köpfilmer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Kommande filmer */}
          {upcomingMovies.length > 0 && (
            <HorizontalMediaRow
              title="Kommande filmer"
              description="Biopremiärer och filmer som släpps snart"
              iconType="calendar"
              iconColor="text-[#E9A23B]"
              items={upcomingMovies}
              moreLink={{
                href: '/upcoming?tab=movies',
                label: 'Visa alla kommande',
              }}
            />
          )}

          {/* Curated category rows */}
          <div className="space-y-2">
            {curatedRows.map((row) => (
              <HorizontalMediaRow
                key={`movie-row-${row.id}`}
                title={row.title}
                description={row.description}
                badge={row.badge}
                iconType={row.iconType}
                iconColor={row.iconColor}
                items={row.items}
              />
            ))}
          </div>
        </>
      )}

      {/* 3. Main Movie Catalog synced with top monetizationType and selectedProviderIds */}
      <div className="pt-4 border-t border-[#2B3443]">
        <ExploreFeed
          initialTrending={
            monetizationType === 'theatrical' && theatricalMovies.length > 0
              ? theatricalMovies
              : monetizationType === 'rent_buy' && rentBuyMovies.length > 0
              ? rentBuyMovies
              : popularMovies
          }
          defaultMediaType="movie"
          title="Populära filmer"
          externalProviderIds={selectedProviderIds}
          onExternalProviderChange={handleSelectProviders}
          externalMonetizationType={monetizationType}
          onExternalMonetizationChange={handleSelectMonetization}
          hideProviderTabs={true}
        />
      </div>
    </div>
  );
}
