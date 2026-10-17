import React, { Suspense } from 'react';
import { Calendar, Sparkles } from 'lucide-react';
import { getUpcomingMovies, getUpcomingSeasons, getUpcomingNewShows } from '@/lib/tmdb';
import UpcomingHubClient from '@/components/UpcomingHubClient';

export const metadata = {
  title: 'Kommande premiärer | Bingelog',
  description: 'Se alla kommande filmer, serier och nya säsonger som ännu inte haft premiär.',
};

export default async function UpcomingPage() {
  const [upcomingMovies, upcomingSeasons, upcomingNewShows] = await Promise.all([
    getUpcomingMovies(50),
    getUpcomingSeasons(40),
    getUpcomingNewShows(40),
  ]);

  return (
    <div className="space-y-8 w-full max-w-full overflow-hidden">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#E9A23B]/15 border border-[#E9A23B]/30 text-[#E9A23B] flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            Premiärkalender
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#ECE9E3] tracking-tight flex items-center gap-3">
          <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-[#E9A23B]" />
          <span>Kommande premiärer</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#8D97A8] mt-1.5 max-w-2xl leading-relaxed">
          Upptäck biopremiärer, splitternya serier och efterlängtade säsonger som släpps snart.
          Här samlas samtliga titlar som ännu inte haft premiär.
        </p>
      </div>

      <Suspense fallback={<div className="py-20 text-center text-sm text-[#8D97A8]">Laddar kommande premiärer...</div>}>
        <UpcomingHubClient
          upcomingMovies={upcomingMovies}
          upcomingSeasons={upcomingSeasons}
          upcomingNewShows={upcomingNewShows}
        />
      </Suspense>
    </div>
  );
}
