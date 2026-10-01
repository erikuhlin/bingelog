'use client';

import React from 'react';
import { Film, CheckCircle2, Clock } from 'lucide-react';

interface LibraryStatsHeaderProps {
  totalTitles: number;
  totalWatchedEpisodes: number;
  totalRuntimeMinutes: number;
}

export default function LibraryStatsHeader({
  totalTitles,
  totalWatchedEpisodes,
  totalRuntimeMinutes,
}: LibraryStatsHeaderProps) {
  const formatRuntime = (mins: number) => {
    if (!mins || mins <= 0) return '0 h';
    if (mins < 60) return `${mins} min`;
    const days = Math.floor(mins / (24 * 60));
    const hours = Math.floor((mins % (24 * 60)) / 60);

    if (days > 0) {
      return hours > 0 ? `${days} d ${hours} h` : `${days} d`;
    }
    const remMins = mins % 60;
    return remMins > 0 ? `${hours} h ${remMins} m` : `${hours} h`;
  };

  const timeString = formatRuntime(totalRuntimeMinutes);

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 text-xs">
      {/* Stat 1: Titles */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171C25] border border-[#2B3443] shadow-sm">
        <Film className="w-3.5 h-3.5 text-[#E9A23B]" />
        <span className="font-bold text-[#ECE9E3]">{totalTitles}</span>
        <span className="text-[#9EA8B6]">{totalTitles === 1 ? 'titel' : 'titlar'}</span>
      </div>

      {/* Stat 2: Watched Episodes */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171C25] border border-[#2B3443] shadow-sm">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#6FA98A]" />
        <span className="font-bold text-[#ECE9E3]">{totalWatchedEpisodes}</span>
        <span className="text-[#9EA8B6]">sedda avsnitt</span>
      </div>

      {/* Stat 3: Total watch time */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171C25] border border-[#2B3443] shadow-sm">
        <Clock className="w-3.5 h-3.5 text-[#E9A23B]" />
        <span className="font-bold text-[#ECE9E3]">{timeString}</span>
        <span className="text-[#9EA8B6]">sedd tid</span>
      </div>
    </div>
  );
}
