'use client';

import React, { useState } from 'react';
import { Tv, RotateCcw } from 'lucide-react';
import { MediaItem } from '@/lib/types';
import { SWEDISH_STREAMING_PROVIDERS } from '@/lib/tmdb';
import HeroCarousel from './HeroCarousel';
import ProviderFilterTabs from './ProviderFilterTabs';
import StreamingNewsRow from './StreamingNewsRow';
import ContinueWatchingSection from './ContinueWatchingSection';
import ForYouSection from './ForYouSection';
import HorizontalMediaRow from './HorizontalMediaRow';
import ExploreFeed from './ExploreFeed';

interface HomePageContentProps {
  carouselItems: MediaItem[];
  trendingList: MediaItem[];
  initialNewReleases: MediaItem[];
  popularCombined: MediaItem[];
}

export default function HomePageContent({
  carouselItems,
  trendingList,
  initialNewReleases,
  popularCombined,
}: HomePageContentProps) {
  const [selectedProviderIds, setSelectedProviderIds] = useState<number[]>([]);

  const selectedProviderNames = selectedProviderIds
    .map((id) => SWEDISH_STREAMING_PROVIDERS.find((p) => p.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* 1. Hero Carousel with top trending titles (#1–#5) */}
      {carouselItems.length > 0 && <HeroCarousel items={carouselItems} />}

      {/* 2. Top-level Streaming Service Selector */}
      <div className="mb-6 sm:mb-8 p-3.5 sm:p-5 rounded-3xl bg-[#171C25]/70 border border-[#2B3443]/80 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
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
                • Visar nyheter och katalog från samtliga tjänster
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

      {/* 3. "Nyheter på streaming" - Horizontal side-scroll right at the top! */}
      <StreamingNewsRow
        initialItems={initialNewReleases}
        selectedProviderIds={selectedProviderIds}
        defaultMediaType="all"
      />

      {/* 4. "Tittar på" - Active Series with progress bar for user */}
      <ContinueWatchingSection />

      {/* 5. "För dig" - Personalized Recommendations (Only for logged in users) */}
      <ForYouSection />

      {/* 6. Dedicated Horizontal Carousel for "Trendar i veckan" (#6–#20) */}
      {trendingList.length > 0 && (
        <HorizontalMediaRow
          title="Trendar i veckan"
          iconType="sparkles"
          iconColor="text-[#E9A23B]"
          items={trendingList}
        />
      )}

      {/* 7. Main Streaming Catalog synced with the top streaming selector */}
      <ExploreFeed
        initialTrending={popularCombined}
        defaultMediaType="all"
        title="Populärt på streaming"
        externalProviderIds={selectedProviderIds}
        onExternalProviderChange={setSelectedProviderIds}
        hideProviderTabs={true}
      />
    </div>
  );
}
