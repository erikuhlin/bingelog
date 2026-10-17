'use client';

import React, { useState } from 'react';
import { Tv, RotateCcw } from 'lucide-react';
import { MediaItem } from '@/lib/types';
import { CuratedCategoryRow } from '@/lib/seasonal';
import { SWEDISH_STREAMING_PROVIDERS } from '@/lib/tmdb';
import ProviderFilterTabs from './ProviderFilterTabs';
import StreamingNewsRow from './StreamingNewsRow';
import UpcomingShowsSection from './UpcomingShowsSection';
import HorizontalMediaRow from './HorizontalMediaRow';
import ExploreFeed from './ExploreFeed';

interface ShowsPageContentProps {
  popularShows: MediaItem[];
  initialNewReleases: MediaItem[];
  upcomingSeasons: MediaItem[];
  upcomingNewShows: MediaItem[];
  curatedRows: CuratedCategoryRow[];
}

export default function ShowsPageContent({
  popularShows,
  initialNewReleases,
  upcomingSeasons,
  upcomingNewShows,
  curatedRows,
}: ShowsPageContentProps) {
  const [selectedProviderIds, setSelectedProviderIds] = useState<number[]>([]);

  const selectedProviderNames = selectedProviderIds
    .map((id) => SWEDISH_STREAMING_PROVIDERS.find((p) => p.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <div className="space-y-8 sm:space-y-10 w-full max-w-full overflow-hidden">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#ECE9E3] tracking-tight flex items-center gap-3">
          <Tv className="w-7 h-7 sm:w-8 sm:h-8 text-[#6FA98A]" />
          <span>Utforska Serier</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#8D97A8] mt-1.5 max-w-2xl leading-relaxed">
          Se nya serier och säsonger på dina streamingtjänster, kommande premiärer och utforska hela seriekatalogen.
        </p>
      </div>

      {/* Top Streaming Service Selector */}
      <div className="p-3.5 sm:p-5 rounded-3xl bg-[#171C25]/80 border border-[#2B3443] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Tv className="w-4 h-4 text-[#E9A23B] flex-shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-[#ECE9E3] tracking-tight truncate">
              Välj streamingtjänst
            </span>
            {selectedProviderNames.length > 0 ? (
              <span className="text-xs font-semibold text-[#E9A23B] truncate hidden xs:inline">
                • {selectedProviderNames.join(', ')}
              </span>
            ) : (
              <span className="text-xs text-[#8D97A8] hidden sm:inline">
                • Visar nyheter och serier från samtliga tjänster
              </span>
            )}
          </div>

          {selectedProviderIds.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedProviderIds([])}
              className="flex items-center gap-1 text-xs font-semibold text-[#8D97A8] hover:text-[#E9A23B] transition-colors flex-shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Visa alla</span>
            </button>
          )}
        </div>

        <ProviderFilterTabs
          selectedProviderIds={selectedProviderIds}
          onSelectProvider={setSelectedProviderIds}
        />
      </div>

      {/* 1. Top Horizontal Row: "Nya serier & säsonger på streaming" */}
      <StreamingNewsRow
        initialItems={initialNewReleases}
        selectedProviderIds={selectedProviderIds}
        defaultMediaType="tv"
      />

      {/* 2. Kommande serier & kategorirader (visas i översiktsläge när ingen specifik tjänst filtrerar bort översikten) */}
      {selectedProviderIds.length === 0 && (
        <>
          <UpcomingShowsSection
            upcomingSeasons={upcomingSeasons}
            upcomingNewShows={upcomingNewShows}
          />

          <div className="space-y-2">
            {curatedRows.map((row) => (
              <HorizontalMediaRow
                key={`show-row-${row.id}`}
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

      {/* 3. Main Series Catalog synced with top streaming selector */}
      <div className="pt-4 border-t border-[#2B3443]">
        <ExploreFeed
          initialTrending={popularShows}
          defaultMediaType="tv"
          title="Populära serier"
          externalProviderIds={selectedProviderIds}
          onExternalProviderChange={setSelectedProviderIds}
          hideProviderTabs={true}
        />
      </div>
    </div>
  );
}
